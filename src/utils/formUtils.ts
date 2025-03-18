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

/**
 * Generic function to convert form data into a structured object
 * @param data - The data to process, either FormData or a Record object
 * @returns Structured form data object
 */
export function processFormData(data: FormData | Record<string, unknown>): ProcessedFormData {
  const result: ProcessedFormData = {}
  let entries: Array<[string, unknown]> = []

  // Handle different input types
  if (data instanceof FormData) {
    // Process FormData object
    entries = Array.from(data.entries()) as Array<[string, unknown]>
  } else {
    // Process plain object (JSON)
    entries = Object.entries(data)
  }

  // Process simple fields (no dots or brackets)
  entries.forEach(([key, value]) => {
    if (typeof key === 'string' && !key.includes('.') && !key.includes('[')) {
      result[key] = value as SimpleFormValue
    }
  })

  // Process nested fields with pattern: name[0].field or name.field
  const nestedEntries = entries.filter(([key]) => typeof key === 'string' && (key.includes('.') || key.includes('[')))

  // Group by base name
  const fieldGroups: Record<string, Array<{ path: string[]; value: unknown }>> = {}

  nestedEntries.forEach(([key, value]) => {
    if (typeof key !== 'string') return

    // Split the key into parts, handling both dot and bracket notation
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

  // Helper function to set a value at a nested path
  const setNestedValue = (obj: NestedObject, path: string[], value: unknown): void => {
    if (path.length === 0) return

    let current = obj
    const lastIndex = path.length - 1

    for (let i = 0; i < lastIndex; i++) {
      const key = path[i]
      const nextKey = path[i + 1]
      const isNextKeyNumeric = !isNaN(parseInt(nextKey))

      // If key doesn't exist or is not an object, initialize it
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = isNextKeyNumeric ? [] : ({} as NestedObject)
      }
      // If next key is numeric but current key is not an array, convert it
      else if (isNextKeyNumeric && !Array.isArray(current[key])) {
        const tempObj = current[key] as NestedObject
        current[key] = Object.keys(tempObj).map(k => tempObj[k]) as Array<SimpleFormValue | NestedObject>
      }

      current = current[key] as NestedObject
    }

    // Set the final value
    const finalKey = path[lastIndex]

    // Only set non-empty string values
    if (typeof value !== 'string' || value.trim() !== '') {
      current[finalKey] = value as SimpleFormValue
    }
  }

  // Helper function to convert objects with numeric keys to arrays
  const normalizeStructure = (
    item: unknown
  ): SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject> => {
    // Handle primitive values
    if (item === null || typeof item !== 'object') {
      return item as SimpleFormValue
    }

    // Handle arrays
    if (Array.isArray(item)) {
      return item.map(val => normalizeStructure(val)).filter(Boolean) as Array<SimpleFormValue | NestedObject>
    }

    // Check if object should be an array (all keys are numeric)
    const obj = item as Record<string, unknown>
    const keys = Object.keys(obj)
    const allNumericKeys = keys.length > 0 && keys.every(key => !isNaN(parseInt(key)))

    if (allNumericKeys) {
      // Convert to array
      const array: Array<SimpleFormValue | NestedObject> = []
      keys
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(key => {
          array[parseInt(key)] = normalizeStructure(obj[key]) as SimpleFormValue | NestedObject
        })
      return array.filter(val => val !== undefined) as Array<SimpleFormValue | NestedObject>
    }

    // Process regular object
    const resultObj: NestedObject = {}
    Object.entries(obj).forEach(([key, value]) => {
      const normalized = normalizeStructure(value)
      if (normalized !== undefined) {
        resultObj[key] = normalized as SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject>
      }
    })
    return resultObj
  }

  // Process each field group
  Object.entries(fieldGroups).forEach(([groupName, fields]) => {
    // Check if top level is an array
    const isArrayStructure = fields.every(field => field.path.length > 0 && !isNaN(parseInt(field.path[0])))

    if (isArrayStructure) {
      // Array structure (e.g., items[0], items[1])
      const tempObj: NestedObject = {}

      fields.forEach(field => {
        setNestedValue(tempObj, field.path, field.value)
      })

      // Convert the temporary object to proper arrays where needed
      const normalized = normalizeStructure(tempObj)

      // Filter empty objects from the array
      if (Array.isArray(normalized)) {
        result[groupName] = normalized.filter(item => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            // Keep objects that have at least one non-empty value
            return Object.values(item as object).some(
              val => val !== null && ((typeof val === 'string' && val.trim() !== '') || typeof val !== 'string')
            )
          }
          return item !== undefined
        })
      } else {
        result[groupName] = normalized
      }
    } else {
      // Object structure (e.g., user.name, user.email)
      const obj: NestedObject = {}

      fields.forEach(field => {
        setNestedValue(obj, field.path, field.value)
      })

      result[groupName] = normalizeStructure(obj)
    }
  })

  return result
}
