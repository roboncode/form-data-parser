/**
 * Type definitions for form data processing
 */
export type FormDataValue = string | File | null
export type SimpleFormValue = string | File | null

// Using interface instead of type to handle recursive definition
export interface NestedObject {
  [key: string]: SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject>
}

export type ProcessedFormData = Record<string, SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject>>

type FieldGroup = {
  path: string[]
  value: unknown
}

type FieldGroups = Record<string, FieldGroup[]>

/**
 * Helper function to check if a value is empty
 */
function isEmptyValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim() === ''
}

/**
 * Helper function to check if a key is numeric
 */
function isNumericKey(key: string): boolean {
  return !isNaN(parseInt(key))
}

/**
 * Helper function to convert an object with numeric keys to an array
 */
function convertToArray(obj: Record<string, unknown>): Array<SimpleFormValue | NestedObject> {
  const array: Array<SimpleFormValue | NestedObject> = []
  Object.keys(obj)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(key => {
      array[parseInt(key)] = normalizeStructure(obj[key]) as SimpleFormValue | NestedObject
    })
  return array.filter(val => val !== undefined)
}

/**
 * Helper function to normalize a structure (convert numeric-keyed objects to arrays)
 */
function normalizeStructure(item: unknown): SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject> {
  if (item === null || typeof item !== 'object') {
    return item as SimpleFormValue
  }

  if (Array.isArray(item)) {
    return item.map(val => normalizeStructure(val)).filter(Boolean) as Array<SimpleFormValue | NestedObject>
  }

  const obj = item as Record<string, unknown>
  const keys = Object.keys(obj)
  const allNumericKeys = keys.length > 0 && keys.every(isNumericKey)

  if (allNumericKeys) {
    return convertToArray(obj)
  }

  const resultObj: NestedObject = {}
  Object.entries(obj).forEach(([key, value]) => {
    const normalized = normalizeStructure(value)
    if (normalized !== undefined) {
      resultObj[key] = normalized as SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject>
    }
  })
  return resultObj
}

/**
 * Helper function to set a value at a nested path
 */
function setNestedValue(obj: NestedObject, path: string[], value: unknown): void {
  if (path.length === 0 || isEmptyValue(value)) return

  let current = obj
  const lastIndex = path.length - 1

  for (let i = 0; i < lastIndex; i++) {
    const key = path[i]
    const nextKey = path[i + 1]
    const isNextKeyNumeric = isNumericKey(nextKey)

    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = isNextKeyNumeric ? [] : ({} as NestedObject)
    } else if (isNextKeyNumeric && !Array.isArray(current[key])) {
      const tempObj = current[key] as NestedObject
      current[key] = convertToArray(tempObj)
    }

    current = current[key] as NestedObject
  }

  current[path[lastIndex]] = value as SimpleFormValue
}

/**
 * Helper function to process field groups
 */
function processFieldGroups(fieldGroups: FieldGroups): ProcessedFormData {
  const result: ProcessedFormData = {}

  Object.entries(fieldGroups).forEach(([groupName, fields]) => {
    const isArrayStructure = fields.every(field => field.path.length > 0 && isNumericKey(field.path[0]))
    const tempObj: NestedObject = {}

    fields.forEach(field => {
      setNestedValue(tempObj, field.path, field.value)
    })

    const normalized = normalizeStructure(tempObj)

    if (isArrayStructure && Array.isArray(normalized)) {
      result[groupName] = normalized.filter(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return Object.values(item as object).some(
            val => val !== null && ((typeof val === 'string' && val.trim() !== '') || typeof val !== 'string')
          )
        }
        return item !== undefined
      })
    } else {
      result[groupName] = normalized
    }
  })

  return result
}

/**
 * Generic function to convert form data into a structured object
 * @param data - The data to process, either FormData or a Record object
 * @returns Structured form data object
 */
export function processFormData(data: FormData | Record<string, unknown>): ProcessedFormData {
  // Handle different input types
  const entries: Array<[string, unknown]> =
    data instanceof FormData ? (Array.from(data.entries()) as Array<[string, unknown]>) : Object.entries(data)

  // Process simple fields (no dots or brackets)
  const result: ProcessedFormData = {}
  entries.forEach(([key, value]) => {
    if (typeof key === 'string' && !key.includes('.') && !key.includes('[')) {
      result[key] = value as SimpleFormValue
    }
  })

  // Process nested fields with pattern: name[0].field or name.field
  const nestedEntries = entries.filter(([key]) => typeof key === 'string' && (key.includes('.') || key.includes('[')))

  // Group by base name
  const fieldGroups: FieldGroups = {}
  nestedEntries.forEach(([key, value]) => {
    if (typeof key !== 'string') return

    const parts = key.split(/[.[\]]/).filter(Boolean)
    const baseName = parts[0]

    if (!fieldGroups[baseName]) {
      fieldGroups[baseName] = []
    }

    fieldGroups[baseName].push({
      path: parts.slice(1),
      value,
    })
  })

  // Process field groups and merge with simple fields
  return { ...result, ...processFieldGroups(fieldGroups) }
}
