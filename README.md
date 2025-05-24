# SVG Inspector

SVG Inspector is a comprehensive SVG validator for Node.js that strictly adheres to the W3C SVG 1.1 (Second Edition) and SVG 2 specifications. It validates SVG files by checking proper elements, attributes, structure, and value formats. All rule violations are reported with detailed error messages.

![CI](https://github.com/YongGyun-Kim/svg-inspector/actions/workflows/ci.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/svg-inspector.svg)](https://www.npmjs.com/package/svg-inspector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Comprehensive Element & Attribute Validation:**  
  Supports nearly all SVG elements (shapes, gradients, filters, animations, text, etc.) and validates each element's allowed and required attributes.

- **Attribute Value Checks:**  
  Validates numeric values (with units, decimals, and scientific notation), color formats (hex, color names, and paint server references), transforms, and path data against the SVG specifications.

- **Structural Validation:**  
  Ensures proper hierarchical relationships (e.g., `<stop>` elements must be within `<linearGradient>` or `<radialGradient>`, and `<mpath>` elements must be children of `<animateMotion>`).

- **Deprecated Feature Detection:**  
  Flags deprecated elements and attributes from SVG 1.1 (such as `<font>`, `<cursor>`, and `xlink:href`) to help you keep your SVG up to date with SVG 2 standards.

- **Detailed Error Reporting:**  
  Collects and returns all errors found in the SVG file, allowing you to easily identify and fix issues.

## Installation

Install SVG Inspector via npm:

```sh
npm install svg-inspector
```

## Usage

```js
const validateSVG = require("svg-inspector");
// For ES Modules, you can import it as:
// import validateSVG from 'svg-inspector';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect x="10" y="10" width="80" height="80" fill="#FF0000"/>
</svg>
`;

const result = validateSVG(svgContent);

if (result.isValid) {
  console.log("SVG is valid.");
} else {
  console.error("SVG is invalid:");
  console.error(result.errors);
}
```

In this example, the validateSVG function processes the provided SVG string. If the SVG complies with all the W3C SVG 1.1 and SVG 2 rules, it logs that the SVG is valid; otherwise, it outputs a list of all detected errors.

## API

validateSVG(svgString: string): ValidationResult
• svgString: A string containing the SVG content to be validated.
• Returns: An object with the following properties:
• isValid (boolean): true if the SVG complies with the specifications; otherwise, false.
• errors (string[]): An array of error messages detailing all detected violations.

## TypeScript Support

The module includes type definitions. You can import them as follows:

```ts
declare module "svg-inspector" {
  /**
   * Interface for the result of SVG validation.
   */
  export interface ValidationResult {
    /**
     * True if the SVG complies with the specifications, false otherwise.
     */
    isValid: boolean;
    /**
     * An array of error messages detailing all rule violations.
     */
    errors: string[];
  }

  /**
   * Validates the provided SVG string against the W3C SVG 1.1 and SVG 2 specifications.
   *
   * @param svgString - The SVG content as a string.
   * @returns A ValidationResult object containing a boolean flag and an array of errors.
   */
  export default function validateSVG(svgString: string): ValidationResult;
}
```

## Testing

The library includes comprehensive test coverage to ensure reliability. To run the tests:

```sh
npm test
```

To generate a test coverage report:

```sh
npm run test:coverage
```

The test suite includes:

- Basic functionality tests
- Element validation tests
- Attribute validation tests
- Advanced SVG feature tests (gradients, paths, transforms)
- Edge case tests
- File-based tests

## Code Quality

This project uses ESLint to enforce code quality and style guidelines. To run the linter:

```sh
npm run lint
```

To automatically fix linting issues:

```sh
npm run lint:fix
```

## Continuous Integration

We use GitHub Actions for continuous integration. The following checks are run on each push and pull request:

- Code linting
- Test execution on multiple Node.js versions (16.x, 18.x, 20.x)
- Test coverage reporting

## Contributing

Contributions are welcome! Please open an issue or submit a pull request with any suggestions, improvements, or bug fixes.

## Known Issues

- The validator currently has limited support for validating `url()` references in attributes like `fill` and `stroke`.
- Some complex filter effects might not be fully validated according to the specification.

## License

This project is licensed under the MIT License.

## Acknowledgments

• This module is designed to strictly follow the W3C SVG 1.1 (Second Edition) and SVG 2 specifications.

• Special thanks to the maintainers of the SVG specifications and the MDN documentation for providing comprehensive and detailed resources.

---

Feel free to adjust any sections as needed for your project.
