import { describe, expect, it } from 'vitest'
import { createFromPath, deleteValue, getValue, hasValue, setValue } from './data'

import { NestedObject } from './formUtils'

describe('Data Utilities', () => {
  describe('createFromPath', () => {
    it('should create a simple nested object', () => {
      const result = createFromPath('user.name', 'John Doe')
      expect(result).toEqual({
        user: {
          name: 'John Doe',
        },
      })
    })

    it('should create an object with array', () => {
      const result = createFromPath('user.addresses[0].street', '123 Main St')
      expect(result).toEqual({
        user: {
          addresses: [
            {
              street: '123 Main St',
            },
          ],
        },
      })
    })

    it('should create deeply nested structure', () => {
      const result = createFromPath('company.departments[0].employees[0].contact.email', 'john@example.com')
      expect(result).toEqual({
        company: {
          departments: [
            {
              employees: [
                {
                  contact: {
                    email: 'john@example.com',
                  },
                },
              ],
            },
          ],
        },
      })
    })
  })

  describe('getValue', () => {
    const testObj = {
      user: {
        name: 'John Doe',
        addresses: [
          {
            street: '123 Main St',
            city: 'Springfield',
          },
        ],
      },
    }

    it('should get a simple value', () => {
      const result = getValue<string>(testObj, 'user.name')
      expect(result).toBe('John Doe')
    })

    it('should get a value from an array', () => {
      const result = getValue<string>(testObj, 'user.addresses[0].street')
      expect(result).toBe('123 Main St')
    })

    it('should return undefined for non-existent path', () => {
      const result = getValue<string>(testObj, 'user.addresses[1].street')
      expect(result).toBeUndefined()
    })

    it('should return default value for non-existent path', () => {
      const result = getValue<string>(testObj, 'user.addresses[1].street', 'Default St')
      expect(result).toBe('Default St')
    })

    it('should handle null values', () => {
      const result = getValue<string>(testObj, 'user.addresses[0].zip', '12345')
      expect(result).toBe('12345')
    })
  })

  describe('setValue', () => {
    it('should set a simple value', () => {
      const obj = {}
      const result = setValue(obj, 'user.name', 'John Doe')
      expect(result).toEqual({
        user: {
          name: 'John Doe',
        },
      })
    })

    it('should set a value in an array', () => {
      const obj = {}
      const result = setValue(obj, 'user.addresses[0].street', '123 Main St')
      expect(result).toEqual({
        user: {
          addresses: [
            {
              street: '123 Main St',
            },
          ],
        },
      })
    })

    it('should update existing value', () => {
      const obj = {
        user: {
          name: 'John Doe',
        },
      }
      const result = setValue(obj, 'user.name', 'Jane Doe')
      expect(result).toEqual({
        user: {
          name: 'Jane Doe',
        },
      })
    })

    it('should handle nested array updates', () => {
      const obj = {
        user: {
          addresses: [
            {
              street: '123 Main St',
            },
          ],
        },
      }
      const result = setValue(obj, 'user.addresses[0].city', 'Springfield')
      expect(result).toEqual({
        user: {
          addresses: [
            {
              street: '123 Main St',
              city: 'Springfield',
            },
          ],
        },
      })
    })
  })

  describe('hasValue', () => {
    const testObj = {
      user: {
        name: 'John Doe',
        addresses: [
          {
            street: '123 Main St',
            city: 'Springfield',
          },
        ],
      },
    }

    it('should return true for existing simple value', () => {
      const result = hasValue(testObj, 'user.name')
      expect(result).toBe(true)
    })

    it('should return true for existing array value', () => {
      const result = hasValue(testObj, 'user.addresses[0].street')
      expect(result).toBe(true)
    })

    it('should return false for non-existent path', () => {
      const result = hasValue(testObj, 'user.addresses[1].street')
      expect(result).toBe(false)
    })

    it('should return false for undefined value', () => {
      const result = hasValue(testObj, 'user.addresses[0].zip')
      expect(result).toBe(false)
    })
  })

  describe('deleteValue', () => {
    it('should delete a simple value', () => {
      const obj = {
        user: {
          name: 'John Doe',
        },
      }
      const result = deleteValue(obj, 'user.name')
      expect(result).toEqual({
        user: {},
      })
    })

    it('should delete a value from an array', () => {
      const obj = {
        user: {
          addresses: [
            {
              street: '123 Main St',
              city: 'Springfield',
            },
          ],
        },
      }
      const result = deleteValue(obj, 'user.addresses[0].street')
      expect(result).toEqual({
        user: {
          addresses: [
            {
              city: 'Springfield',
            },
          ],
        },
      })
    })

    it('should handle non-existent path gracefully', () => {
      const obj = {
        user: {
          name: 'John Doe',
        },
      }
      const result = deleteValue(obj, 'user.addresses[0].street')
      expect(result).toEqual(obj)
    })

    it('should delete entire array element when last property', () => {
      const obj = {
        user: {
          addresses: [
            {
              street: '123 Main St',
            },
          ],
        },
      }
      const result = deleteValue(obj, 'user.addresses[0]')
      expect(result).toEqual({
        user: {
          addresses: [],
        },
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty paths', () => {
      const obj: NestedObject = {}
      expect(() => setValue(obj, '', 'value')).toThrow()
      expect(() => getValue(obj, '')).toThrow()
      expect(() => hasValue(obj, '')).toThrow()
      expect(() => deleteValue(obj, '')).toThrow()
    })

    it('should handle invalid paths', () => {
      const obj: NestedObject = {}
      expect(() => setValue(obj, 'user..name', 'value')).toThrow()
      expect(() => getValue(obj, 'user..name')).toThrow()
      expect(() => hasValue(obj, 'user..name')).toThrow()
      expect(() => deleteValue(obj, 'user..name')).toThrow()
    })

    it('should handle null/undefined objects', () => {
      const nullObj: NestedObject | null = null
      expect(() => setValue(nullObj, 'user.name', 'value')).toThrow()
      expect(() => getValue(nullObj, 'user.name')).toThrow()
      expect(() => hasValue(nullObj, 'user.name')).toThrow()
      expect(() => deleteValue(nullObj, 'user.name')).toThrow()
    })
  })
})
