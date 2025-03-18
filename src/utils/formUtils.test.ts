import { describe, expect, it } from 'vitest'

import { processFormData } from './formUtils'

describe('processFormData', () => {
  // Helper function to create a FormData object from a record
  function createFormData(data: Record<string, string>): FormData {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })
    return formData
  }

  it('should process simple fields correctly', () => {
    const formData = createFormData({
      name: 'John Doe',
      email: 'john@example.com',
      age: '30',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      age: '30',
    })
  })

  it('should process radio buttons correctly', () => {
    const formData = createFormData({
      contactMethod: 'email',
      subscribe: 'yes',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      contactMethod: 'email',
      subscribe: 'yes',
    })
  })

  it('should process simple arrays correctly', () => {
    const formData = createFormData({
      'tags[0]': 'javascript',
      'tags[1]': 'react',
      'tags[2]': 'typescript',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      tags: ['javascript', 'react', 'typescript'],
    })
  })

  it('should filter out empty array values', () => {
    const formData = createFormData({
      'tags[0]': 'javascript',
      'tags[1]': '',
      'tags[2]': 'typescript',
      'tags[3]': '   ',
      'tags[4]': 'react',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      tags: ['javascript', 'typescript', 'react'],
    })
  })

  it('should process arrays of objects correctly', () => {
    const formData = createFormData({
      'profile[0].name': 'John Doe',
      'profile[0].email': 'john@example.com',
      'profile[1].name': 'Jane Smith',
      'profile[1].email': 'jane@example.com',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      profile: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ],
    })
  })

  it('should filter out empty objects in arrays', () => {
    const formData = createFormData({
      'profile[0].name': 'John Doe',
      'profile[0].email': 'john@example.com',
      'profile[1].name': '',
      'profile[1].email': '',
      'profile[2].name': 'Jane Smith',
      'profile[2].email': 'jane@example.com',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      profile: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ],
    })
  })

  it('should process nested objects correctly', () => {
    const formData = createFormData({
      'user.name': 'John Doe',
      'user.contact.email': 'john@example.com',
      'user.contact.phone': '123-456-7890',
      'user.address.street': '123 Main St',
      'user.address.city': 'Anytown',
      'user.address.zip': '12345',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      user: {
        name: 'John Doe',
        contact: {
          email: 'john@example.com',
          phone: '123-456-7890',
        },
        address: {
          street: '123 Main St',
          city: 'Anytown',
          zip: '12345',
        },
      },
    })
  })

  it('should handle complex mixed structures', () => {
    const formData = createFormData({
      contactMethod: 'email',
      'profile[0].name': 'John Doe',
      'profile[0].email': 'john@example.com',
      'profile[1].name': 'Jane Smith',
      'profile[1].email': 'jane@example.com',
      'ssns[0]': '123-45-6789',
      'ssns[1]': '987-65-4321',
      'user.address.street': '123 Main St',
      'user.address.city': 'Anytown',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      contactMethod: 'email',
      profile: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ],
      ssns: ['123-45-6789', '987-65-4321'],
      user: {
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
      },
    })
  })

  it('should handle sparse arrays correctly', () => {
    const formData = createFormData({
      'items[0]': 'First',
      'items[2]': 'Third',
      'items[5]': 'Sixth',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      items: ['First', 'Third', 'Sixth'],
    })
  })

  it('should handle deeply nested array objects', () => {
    const formData = createFormData({
      'data[0].items[0].name': 'Item 1',
      'data[0].items[0].price': '10.99',
      'data[0].items[1].name': 'Item 2',
      'data[0].items[1].price': '20.99',
      'data[1].items[0].name': 'Item 3',
      'data[1].items[0].price': '30.99',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      data: [
        {
          items: [
            { name: 'Item 1', price: '10.99' },
            { name: 'Item 2', price: '20.99' },
          ],
        },
        {
          items: [{ name: 'Item 3', price: '30.99' }],
        },
      ],
    })
  })

  it('should handle empty form data', () => {
    const formData = new FormData()
    const result = processFormData(formData)
    expect(result).toEqual({})
  })

  it('should handle nested arrays within objects', () => {
    const formData = createFormData({
      'profile[0].name': 'John Doe',
      'profile[0].tags[0]': 'developer',
      'profile[0].tags[1]': 'javascript',
      'profile[1].name': 'Jane Smith',
      'profile[1].tags[0]': 'designer',
      'profile[1].tags[1]': 'ui/ux',
      'profile[1].tags[2]': 'figma',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      profile: [
        {
          name: 'John Doe',
          tags: ['developer', 'javascript'],
        },
        {
          name: 'Jane Smith',
          tags: ['designer', 'ui/ux', 'figma'],
        },
      ],
    })
  })

  it('should handle arrays of preference objects within profiles', () => {
    const formData = createFormData({
      'profile[0].name': 'John Doe',
      'profile[0].prefs[0].email': 'daily',
      'profile[0].prefs[1].sms': 'weekly',
      'profile[1].name': 'Jane Smith',
      'profile[1].prefs[0].email': 'weekly',
      'profile[1].prefs[1].sms': 'never',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      profile: [
        {
          name: 'John Doe',
          prefs: [{ email: 'daily' }, { sms: 'weekly' }],
        },
        {
          name: 'Jane Smith',
          prefs: [{ email: 'weekly' }, { sms: 'never' }],
        },
      ],
    })
  })

  it('should handle the example form from the application', () => {
    const formData = createFormData({
      contactMethod: 'email',
      'profile[0].name': 'John Doe',
      'profile[0].email': 'john@example.com',
      'profile[1].name': 'Jane Smith',
      'profile[1].email': 'jane@example.com',
      'profile[2].name': '',
      'profile[2].email': '',
      'ssns[0]': '123-45-6789',
      'ssns[1]': '987-65-4321',
      'ssns[2]': '',
    })

    const result = processFormData(formData)

    expect(result).toEqual({
      contactMethod: 'email',
      profile: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ],
      ssns: ['123-45-6789', '987-65-4321'],
    })
  })

  // JSON Object Tests
  describe('JSON Object Tests', () => {
    it('should process simple JSON fields correctly', () => {
      const jsonData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '30',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: '30',
      })
    })

    it('should process JSON arrays correctly', () => {
      const jsonData = {
        'tags[0]': 'javascript',
        'tags[1]': 'react',
        'tags[2]': 'typescript',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        tags: ['javascript', 'react', 'typescript'],
      })
    })

    it('should process JSON arrays of objects correctly', () => {
      const jsonData = {
        'profile[0].name': 'John Doe',
        'profile[0].email': 'john@example.com',
        'profile[1].name': 'Jane Smith',
        'profile[1].email': 'jane@example.com',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        profile: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
      })
    })

    it('should process nested JSON objects correctly', () => {
      const jsonData = {
        'user.name': 'John Doe',
        'user.contact.email': 'john@example.com',
        'user.contact.phone': '123-456-7890',
        'user.address.street': '123 Main St',
        'user.address.city': 'Anytown',
        'user.address.zip': '12345',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '123-456-7890',
          },
          address: {
            street: '123 Main St',
            city: 'Anytown',
            zip: '12345',
          },
        },
      })
    })

    it('should handle complex mixed JSON structures', () => {
      const jsonData = {
        name: 'my-app',
        'profiles[0].first_name': 'John',
        'profiles[0].last_name': 'Doe',
        'profiles[0].email': 'john.doe@example.com',
        'profiles[0].phone': '+1234567890',
        'profiles[0].address.street': '123 Main St',
        'profiles[0].address.city': 'Anytown',
        'tags[0]': 'tag1',
        'tags[1]': 'tag2',
        'tags[2]': 'tag3',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        name: 'my-app',
        profiles: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'Anytown',
            },
          },
        ],
        tags: ['tag1', 'tag2', 'tag3'],
      })
    })

    it('should handle nested arrays within JSON objects', () => {
      const jsonData = {
        'profile[0].name': 'John Doe',
        'profile[0].tags[0]': 'developer',
        'profile[0].tags[1]': 'javascript',
        'profile[1].name': 'Jane Smith',
        'profile[1].tags[0]': 'designer',
        'profile[1].tags[1]': 'ui/ux',
        'profile[1].tags[2]': 'figma',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        profile: [
          {
            name: 'John Doe',
            tags: ['developer', 'javascript'],
          },
          {
            name: 'Jane Smith',
            tags: ['designer', 'ui/ux', 'figma'],
          },
        ],
      })
    })

    it('should handle deeply nested array objects in JSON', () => {
      const jsonData = {
        'data[0].items[0].name': 'Item 1',
        'data[0].items[0].price': '10.99',
        'data[0].items[1].name': 'Item 2',
        'data[0].items[1].price': '20.99',
        'data[1].items[0].name': 'Item 3',
        'data[1].items[0].price': '30.99',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        data: [
          {
            items: [
              { name: 'Item 1', price: '10.99' },
              { name: 'Item 2', price: '20.99' },
            ],
          },
          {
            items: [{ name: 'Item 3', price: '30.99' }],
          },
        ],
      })
    })

    it('should filter out empty values in JSON objects', () => {
      const jsonData = {
        'profile[0].name': 'John Doe',
        'profile[0].email': 'john@example.com',
        'profile[1].name': '',
        'profile[1].email': '',
        'profile[2].name': 'Jane Smith',
        'profile[2].email': 'jane@example.com',
        'tags[0]': 'javascript',
        'tags[1]': '',
        'tags[2]': 'typescript',
        'tags[3]': '   ',
      }

      const result = processFormData(jsonData)

      expect(result).toEqual({
        profile: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
        tags: ['javascript', 'typescript'],
      })
    })
  })
})
