# Form Data Parser

A React application that demonstrates advanced form data processing with support for complex nested structures. This utility can parse form data with deeply nested fields, arrays, and objects using a consistent naming convention.

## Features

- Process form data with complex nested structures
- Support for arrays, objects, and mixed data types
- Automatic conversion of numeric indices to arrays
- Filtering of empty values and objects
- TypeScript type safety
- Comprehensive test coverage

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/form-data-parser.git
cd form-data-parser
npm install
```

## Usage

### Running the Development Server

Start the development server:

```bash
npm run dev
```

This will start the Vite development server, typically at http://localhost:5173.

### Building for Production

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build:

```bash
npm run preview
```

## Form Data Processing

The core functionality is in the `processFormData` utility, which converts form data with nested field names into structured JavaScript objects.

### Supported Field Naming Patterns

- Simple fields: `name`, `email`
- Arrays: `items[0]`, `items[1]`
- Objects: `user[name]`, `user[email]`
- Nested objects: `user[address][street]`, `user[address][city]`
- Arrays of objects: `profiles[0][name]`, `profiles[0][email]`
- Deeply nested structures: `data[0][items][0][name]`

### Example

HTML Form:

```html
<form>
  <input name="profile[0][name]" value="John Doe" />
  <input name="profile[0][email]" value="john@example.com" />
  <input name="profile[0][tags][0]" value="developer" />
  <input name="profile[0][tags][1]" value="javascript" />
  <input name="profile[1][name]" value="Jane Smith" />
  <input name="profile[1][email]" value="jane@example.com" />
</form>
```

JavaScript:

```javascript
const formData = new FormData(formElement)
const result = processFormData(formData)

// Result:
// {
//   profile: [
//     {
//       name: "John Doe",
//       email: "john@example.com",
//       tags: ["developer", "javascript"]
//     },
//     {
//       name: "Jane Smith",
//       email: "jane@example.com"
//     }
//   ]
// }
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Technology Stack

- React 19
- TypeScript
- Vite
- Vitest for testing

## License

MIT
