import { NestedObject, SimpleFormValue } from './types'

/**
 * Type for path segments that can be either string keys or numeric indices
 */
type PathSegment = string | number

/**
 * Splits a path string into segments, handling both dot and bracket notation
 * @example
 * "user.address[0].street" -> ["user", "address", 0, "street"]
 * "profile.name" -> ["profile", "name"]
 */
function parsePath(path: string): PathSegment[] {
  if (!path) {
    throw new Error('Path cannot be empty')
  }
  if (path.includes('..')) {
    throw new Error('Invalid path: consecutive dots are not allowed')
  }
  return path
    .split(/[.[\]]/)
    .filter(Boolean)
    .map(segment => {
      const num = parseInt(segment)
      return isNaN(num) ? segment : num
    })
}

/**
 * Creates a nested object structure from a path and value
 * @example
 * createNestedStructure(["user", "address", 0, "street"], "123 Maple")
 * -> { user: { address: [{ street: "123 Maple" }] } }
 */
function createNestedStructure(segments: PathSegment[], value: SimpleFormValue): NestedObject {
  const result: NestedObject = {}
  let current = result

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const nextSegment = segments[i + 1]
    const isNextNumeric = typeof nextSegment === 'number'

    current[segment] = isNextNumeric ? [] : {}
    current = current[segment] as NestedObject
  }

  current[segments[segments.length - 1]] = value
  return result
}

/**
 * Gets a value from a nested object using a path string
 * @param obj - The object to traverse
 * @param path - The path to the value (e.g., "user.address[0].street")
 * @param defaultValue - Optional default value if the path doesn't exist
 * @returns The value at the path or the default value
 */
export function getValue<T = unknown>(
  obj: NestedObject | null | undefined,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj) {
    throw new Error('Cannot get value from null or undefined object')
  }
  const segments = parsePath(path)
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return defaultValue
    }

    current = (current as Record<string | number, unknown>)[segment]
  }

  return (current as T) ?? defaultValue
}

/**
 * Sets a value in a nested object using a path string
 * @param obj - The object to modify
 * @param path - The path where to set the value (e.g., "user.address[0].street")
 * @param value - The value to set
 * @returns The modified object
 */
export function setValue(obj: NestedObject | null | undefined, path: string, value: SimpleFormValue): NestedObject {
  if (!obj) {
    throw new Error('Cannot set value on null or undefined object')
  }
  const segments = parsePath(path)
  let current: NestedObject = obj

  // Create nested structure for all segments except the last one
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const nextSegment = segments[i + 1]
    const isNextNumeric = typeof nextSegment === 'number'

    if (!current[segment] || typeof current[segment] !== 'object') {
      current[segment] = isNextNumeric ? [] : {}
    }

    current = current[segment] as NestedObject
  }

  // Set the value at the final path
  const lastSegment = segments[segments.length - 1]
  current[lastSegment] = value

  return obj
}

/**
 * Checks if a path exists in a nested object
 * @param obj - The object to check
 * @param path - The path to check (e.g., "user.address[0].street")
 * @returns True if the path exists and has a value
 */
export function hasValue(obj: NestedObject | null | undefined, path: string): boolean {
  if (!obj) {
    throw new Error('Cannot check value in null or undefined object')
  }
  const segments = parsePath(path)
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || typeof current !== 'object') {
      return false
    }

    current = (current as Record<string | number, unknown>)[segment]
  }

  return current !== undefined && current !== null
}

/**
 * Deletes a value from a nested object using a path string
 * @param obj - The object to modify
 * @param path - The path to delete (e.g., "user.address[0].street")
 * @returns The modified object
 */
export function deleteValue(obj: NestedObject | null | undefined, path: string): NestedObject {
  if (!obj) {
    throw new Error('Cannot delete value from null or undefined object')
  }
  const segments = parsePath(path)
  let current: NestedObject = obj

  // Navigate to the parent of the target value
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    if (!current[segment] || typeof current[segment] !== 'object') {
      return obj
    }
    current = current[segment] as NestedObject
  }

  // Delete the value at the final path
  const lastSegment = segments[segments.length - 1]
  delete current[lastSegment]

  // If this was an array element and it's the last property, remove the element
  if (Array.isArray(current) && typeof lastSegment === 'number') {
    const hasOtherProperties = Object.keys(current).some(key => {
      const numKey = parseInt(key)
      return !isNaN(numKey) && numKey > lastSegment
    })
    if (!hasOtherProperties) {
      current.length = lastSegment
    }
  }

  return obj
}

/**
 * Creates a new nested object from a path and value
 * @param path - The path to create (e.g., "user.address[0].street")
 * @param value - The value to set at the path
 * @returns A new nested object with the value at the specified path
 */
export function createFromPath(path: string, value: SimpleFormValue): NestedObject {
  const segments = parsePath(path)
  return createNestedStructure(segments, value)
}
