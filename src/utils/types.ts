/**
 * Type definitions for form data processing
 */
export type FormDataValue = string | File | File[] | string[] | null | undefined
export type SimpleFormValue = string | number | boolean | Date | File | File[] | string[] | null
export type ArrayValue = SimpleFormValue[]
export type ObjectValue = { [key: string]: SimpleFormValue | ObjectValue | ArrayValue | null }
export type NestedValue = SimpleFormValue | ObjectValue | ArrayValue
export type ProcessedFormData = Record<string, NestedValue>

/**
 * Type for a nested object with arbitrary nesting
 */
export interface NestedObject {
  [key: string | number]: SimpleFormValue | NestedObject | Array<SimpleFormValue | NestedObject> | null
}
