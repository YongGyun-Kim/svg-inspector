// index.js
import { XMLParser } from "fast-xml-parser";

/**
 * Define allowed attributes and required attributes for each SVG element.
 */
const allowedElements = {
  svg: {
    // The <svg> element must have the xmlns attribute.
    requiredAttrs: ["xmlns"],
    allowedAttrs: ["xmlns", "width", "height", "viewBox"],
  },
  g: {
    allowedAttrs: ["transform"],
  },
  rect: {
    allowedAttrs: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "transform"],
  },
  circle: {
    allowedAttrs: ["cx", "cy", "r", "fill", "stroke", "transform"],
  },
  ellipse: {
    allowedAttrs: ["cx", "cy", "rx", "ry", "fill", "stroke", "transform"],
  },
  line: {
    allowedAttrs: ["x1", "y1", "x2", "y2", "stroke", "transform"],
  },
  polyline: {
    allowedAttrs: ["points", "fill", "stroke", "transform"],
  },
  polygon: {
    allowedAttrs: ["points", "fill", "stroke", "transform"],
  },
  path: {
    allowedAttrs: ["d", "fill", "stroke", "transform"],
  },
  text: {
    allowedAttrs: ["x", "y", "dx", "dy", "text-anchor", "fill", "stroke", "transform"],
  },
  defs: {
    allowedAttrs: [],
  },
  // Additional elements can be defined here if needed.
};

/**
 * Validates the transform attribute value.
 * This is a simplified check that ensures the value consists of allowed transform functions
 * (translate, scale, rotate, skewX, skewY, matrix) with parameters inside parentheses.
 *
 * @param {string} value - The transform attribute value.
 * @returns {boolean} - Returns true if the transform value is valid.
 */
function isValidTransformValue(value) {
  const allowedFunctions = ["translate", "scale", "rotate", "skewX", "skewY", "matrix"];
  // This regex checks that the string consists of one or more allowed functions followed by parentheses containing any characters except a closing parenthesis.
  const regex = new RegExp(`^(\\s*(?:${allowedFunctions.join("|")})\\s*\$begin:math:text$[^\\$end:math:text$]+\\)\\s*)+$`);
  return regex.test(value);
}

/**
 * Validates the SVG path "d" attribute value.
 * This is a simplified check that ensures the path data consists of allowed command letters and numbers.
 *
 * @param {string} value - The d attribute value.
 * @returns {boolean} - Returns true if the path data is in a valid format.
 */
function isValidPathData(value) {
  // Allowed commands: M, m, Z, z, L, l, H, h, V, v, C, c, S, s, Q, q, T, t, A, a.
  // This regex is a basic check and does not cover all edge cases.
  const pathRegex = /^[MmZzLlHhVvCcSsQqTtAa0-9,\.\s\-+]+$/;
  return pathRegex.test(value);
}

/**
 * Validates the format of attribute values.
 * It checks for numerical values with optional units, color formats, transform and path data formats, etc.
 *
 * @param {string} attr - The attribute name.
 * @param {string} value - The attribute value.
 * @returns {boolean} - Returns true if the attribute value is valid.
 */
function isValidAttributeValue(attr, value) {
  // Attributes that should have numeric values (or numbers with units)
  const numericAttrs = ["width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2"];
  if (numericAttrs.includes(attr)) {
    // Allow numbers, decimals, and optional units.
    if (!/^\d+(\.\d+)?(px|em|rem|%)?$/.test(value)) {
      return false;
    }
  }

  // Color related attributes: allow 'none', 'currentColor', hex colors, or simple color names.
  if (attr === "fill" || attr === "stroke") {
    if (!(value === "none" || value === "currentColor" || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) || /^[a-zA-Z]+$/.test(value))) {
      return false;
    }
  }

  // The viewBox attribute must consist of 4 numbers (separated by spaces or commas).
  if (attr === "viewBox") {
    const parts = value.trim().split(/[ ,]+/);
    if (parts.length !== 4 || parts.some((p) => isNaN(parseFloat(p)))) {
      return false;
    }
  }

  // Validate transform attribute.
  if (attr === "transform") {
    return isValidTransformValue(value);
  }

  // Validate path data (d attribute).
  if (attr === "d") {
    return isValidPathData(value);
  }

  // Additional attribute validations can be implemented here.

  return true;
}

/**
 * Validates the attributes of a specific element.
 * It checks for:
 * - Existence of required attributes.
 * - Whether each attribute is in the allowed list.
 * - Whether the attribute value matches the required format.
 *
 * @param {string} elemName - The element name (e.g., "rect")
 * @param {object} attrs - The attributes object of the element.
 * @returns {boolean} - Returns true if all attributes are valid, false otherwise.
 */
function validateAttributes(elemName, attrs) {
  const definition = allowedElements[elemName];
  // If the element is not defined in the allowed list, return false.
  if (!definition) {
    return false;
  }

  // Check for required attributes.
  if (definition.requiredAttrs) {
    for (const reqAttr of definition.requiredAttrs) {
      if (!(reqAttr in attrs)) return false;
    }
  }

  // Validate each attribute against the allowed list and value format.
  for (const attr in attrs) {
    if (!definition.allowedAttrs.includes(attr)) {
      return false;
    }
    if (!isValidAttributeValue(attr, attrs[attr])) {
      return false;
    }
  }
  return true;
}

/**
 * Recursively validates an element and its children in the parsed SVG JSON.
 *
 * @param {string} elemName - The element name (e.g., "svg", "rect", etc.)
 * @param {object} elemObj - The JSON object representation of the element.
 * @returns {boolean} - Returns true if the element and all its children are valid, false otherwise.
 */
function validateElement(elemName, elemObj) {
  // In fast-xml-parser, attributes are prefixed with "@_".
  const attrs = {};
  const children = [];

  // Iterate over each key in the element object.
  for (const key in elemObj) {
    if (key.startsWith("@_")) {
      // Attribute: remove "@_" prefix.
      const attrName = key.slice(2);
      attrs[attrName] = elemObj[key];
    } else {
      // Child elements: the key represents the element name.
      // Child elements can be a single object or an array.
      if (Array.isArray(elemObj[key])) {
        elemObj[key].forEach((child) => {
          children.push({ name: key, obj: child });
        });
      } else {
        children.push({ name: key, obj: elemObj[key] });
      }
    }
  }

  // Validate the current element's attributes.
  if (!validateAttributes(elemName, attrs)) {
    return false;
  }

  // Recursively validate each child element.
  for (const child of children) {
    // If the child is simple text, skip it.
    if (typeof child.obj === "string") continue;
    // If the element is not in the allowed list, fail validation.
    if (!allowedElements.hasOwnProperty(child.name)) {
      return false;
    }
    if (!validateElement(child.name, child.obj)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates the provided SVG string.
 * Returns true if the SVG passes all validations; otherwise, returns false.
 *
 * @param {string} svgString - The SVG content as a string.
 * @returns {boolean} - True if the SVG is valid, false otherwise.
 */
export default function validateSVG(svgString) {
  if (typeof svgString !== "string") return false;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });

  let jsonObj;
  try {
    jsonObj = parser.parse(svgString);
  } catch (error) {
    return false;
  }

  // Check if the root element is <svg>.
  if (!jsonObj.svg) return false;

  return validateElement("svg", jsonObj.svg);
}
