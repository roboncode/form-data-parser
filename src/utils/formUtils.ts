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
 * Generic function to convert any form data into a structured object
 * @param formData - The FormData object from a form submission
 * @returns Structured form data object
 */
export function processFormData(formData: FormData): ProcessedFormData {
  const result: ProcessedFormData = {}

  // First, collect all form entries and organize them by their naming pattern
  const entries = Array.from(formData.entries())

  // Process simple fields (no brackets)
  entries.forEach(([key, value]) => {
    if (typeof key === 'string' && !key.includes('[')) {
      result[key] = value as SimpleFormValue
    }
  })

  // Process nested fields with pattern: name[key1][key2]...[keyN]
  const nestedFields = entries.filter(([key]) => typeof key === 'string' && key.includes('[') && key.includes(']'))

  // Group by the base name (before first bracket)
  const fieldGroups: Record<string, Array<{ path: string[]; value: FormDataEntryValue }>> = {}

  nestedFields.forEach(([key, value]) => {
    if (typeof key !== 'string') return

    // Extract the base name and the path parts
    const baseName = key.substring(0, key.indexOf('['))
    const pathStr = key.substring(key.indexOf('['))

    // Parse the path into parts
    const pathParts: string[] = []
    let currentPart = ''
    let inBracket = false

    for (let i = 0; i < pathStr.length; i++) {
      const char = pathStr[i]

      if (char === '[') {
        inBracket = true
        continue
      }

      if (char === ']') {
        inBracket = false
        pathParts.push(currentPart)
        currentPart = ''
        continue
      }

      if (inBracket) {
        currentPart += char
      }
    }

    // Add to the field groups
    if (!fieldGroups[baseName]) {
      fieldGroups[baseName] = []
    }

    fieldGroups[baseName].push({
      path: pathParts,
      value: value,
    })
  })

  // Post-process function to convert numeric object keys to array items
  const processNestedArrays = (
    item: unknown
  ): SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject> => {
    if (item === null || typeof item !== 'object') {
      return item as SimpleFormValue
    }

    // Check if this object should be an array
    const itemObj = item as Record<string, unknown>
    const keys = Object.keys(itemObj)
    const allNumericKeys = keys.length > 0 && keys.every(key => !isNaN(parseInt(key)))

    if (allNumericKeys) {
      // Convert to array
      const result: Array<SimpleFormValue | NestedObject> = []
      keys
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(key => {
          result[parseInt(key)] = processNestedArrays(itemObj[key]) as SimpleFormValue | NestedObject
        })
      return result.filter(Boolean) // Remove empty slots
    } else if (Array.isArray(item)) {
      return item.map(val => processNestedArrays(val)).filter(Boolean) as Array<SimpleFormValue | NestedObject>
    } else {
      // Process each property
      const result: NestedObject = {}
      Object.entries(itemObj).forEach(([key, value]) => {
        result[key] = processNestedArrays(value)
      })
      return result
    }
  }

  // Process each field group
  Object.entries(fieldGroups).forEach(([groupName, fields]) => {
    // Determine if this is an array or object structure
    const isArrayStructure = fields.every(field => field.path.length > 0 && !isNaN(parseInt(field.path[0])))

    if (isArrayStructure) {
      // Handle array structure (e.g., items[0], items[1], etc.)
      const array: Array<SimpleFormValue | NestedObject> = []

      fields.forEach(field => {
        const index = parseInt(field.path[0])

        // Simple array (e.g., items[0], items[1])
        if (field.path.length === 1) {
          if (typeof field.value === 'string' && field.value.trim() !== '') {
            array[index] = field.value
          }
        }
        // Array of objects (e.g., profile[0][name], profile[0][email])
        else if (field.path.length > 1) {
          if (!array[index] || typeof array[index] !== 'object') {
            array[index] = {} as NestedObject
          }

          // Handle nested properties
          let current = array[index] as NestedObject

          for (let i = 1; i < field.path.length - 1; i++) {
            const part = field.path[i]

            // Check if this part should be an array
            const isNestedArray = fields.some(otherField => {
              // Check if other fields have the same path prefix and numeric indices
              if (otherField !== field) {
                const otherPathPrefix = [groupName, ...otherField.path.slice(0, i + 1)].join('][')
                const currentPathPrefix = [groupName, ...field.path.slice(0, i + 1)].join('][')
                return otherPathPrefix === currentPathPrefix && !isNaN(parseInt(otherField.path[i + 1]))
              }
              return false
            })

            if (!current[part]) {
              current[part] = isNestedArray ? [] : ({} as NestedObject)
            } else if (isNestedArray && !Array.isArray(current[part])) {
              // Convert to array if needed
              const tempObj = current[part] as NestedObject
              const tempArray: Array<SimpleFormValue | NestedObject> = []

              // Move existing properties to array
              Object.entries(tempObj).forEach(([key, value]) => {
                if (!isNaN(parseInt(key))) {
                  tempArray[parseInt(key)] = value as SimpleFormValue | NestedObject
                }
              })

              current[part] = tempArray
            }

            current = current[part] as NestedObject
          }

          // Set the value at the final path
          const finalKey = field.path[field.path.length - 1]
          current[finalKey] = field.value as SimpleFormValue
        }
      })

      // Process the array to convert nested objects with numeric keys to arrays
      for (let i = 0; i < array.length; i++) {
        if (array[i] && typeof array[i] === 'object') {
          array[i] = processNestedArrays(array[i]) as SimpleFormValue | NestedObject
        }
      }

      // Filter out empty slots and objects
      result[groupName] = array.filter(item => {
        if (typeof item === 'object' && item !== null) {
          return Object.values(item as object).some(
            val => val !== null && ((typeof val === 'string' && val.trim() !== '') || typeof val !== 'string')
          )
        }
        return item !== undefined
      })
    } else {
      // Handle object structure (e.g., user[name], user[email])
      const obj: NestedObject = {}

      fields.forEach(field => {
        let current = obj

        // Navigate to the nested property
        for (let i = 0; i < field.path.length - 1; i++) {
          const part = field.path[i]
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {} as NestedObject
          }
          current = current[part] as NestedObject
        }

        // Set the value at the final path
        const finalKey = field.path[field.path.length - 1]
        current[finalKey] = field.value as SimpleFormValue
      })

      // Process the object to convert nested objects with numeric keys to arrays
      result[groupName] = processNestedArrays(obj)
    }
  })

  return result
}
