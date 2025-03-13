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
     * Validates the provided SVG string against the W3C SVG 1.1 (Second Edition) and SVG 2 specifications.
     *
     * The function checks for proper elements, attributes, structure, and value formats.
     * It collects and returns all violations as detailed error messages.
     *
     * @param svgString - The SVG content as a string.
     * @returns A ValidationResult object containing a boolean flag and an array of errors.
     */
    export default function validateSVG(svgString: string): ValidationResult;
  }