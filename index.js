// index.js
import { XMLParser } from "fast-xml-parser";

// Define global attributes and presentation attributes
const globalAttrs = ["id", "class", "style", "lang", "xml:lang", "xml:space", "tabindex"];
const presentationAttrs = [
  "fill",
  "stroke",
  "stroke-width",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "display",
  "visibility",
  "pointer-events",
  "filter",
  "mask",
  "clip-path",
  "clip-rule",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
  "color",
];

// Define allowed SVG elements and their allowed (and required) attributes
// These are based on MDN documentation for each element.
const allowedElements = {
  svg: {
    requiredAttrs: ["xmlns"],
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "width", "height", "viewBox", "preserveAspectRatio", "xmlns", "version", "xmlns:xlink"],
  },
  g: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "transform"],
  },
  rect: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "width", "height", "rx", "ry", "transform"],
  },
  circle: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "cx", "cy", "r", "transform"],
  },
  ellipse: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "cx", "cy", "rx", "ry", "transform"],
  },
  line: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x1", "y1", "x2", "y2", "transform"],
  },
  polyline: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "points", "transform"],
  },
  polygon: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "points", "transform"],
  },
  path: {
    requiredAttrs: ["d"],
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "d", "transform"],
  },
  text: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "dx", "dy", "text-anchor", "transform"],
  },
  tspan: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "dx", "dy"],
  },
  textPath: {
    requiredAttrs: ["href"],
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "href", "startOffset", "method", "spacing"],
  },
  linearGradient: {
    requiredAttrs: ["id"],
    allowedAttrs: [...globalAttrs, "gradientUnits", "gradientTransform", "x1", "y1", "x2", "y2", "spreadMethod", "href"],
  },
  radialGradient: {
    requiredAttrs: ["id"],
    allowedAttrs: [...globalAttrs, "gradientUnits", "gradientTransform", "cx", "cy", "r", "fx", "fy", "spreadMethod", "href"],
  },
  stop: {
    requiredAttrs: ["offset"],
    allowedAttrs: [...globalAttrs, "offset", "stop-color", "stop-opacity"],
  },
  use: {
    requiredAttrs: ["href"],
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "width", "height", "href", "xlink:href", "transform"],
  },
  image: {
    requiredAttrs: ["href", "width", "height"],
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "x", "y", "width", "height", "href", "xlink:href", "preserveAspectRatio", "transform"],
  },
  a: {
    allowedAttrs: [...globalAttrs, ...presentationAttrs, "href", "xlink:href", "target", "download"],
  },
  defs: {
    allowedAttrs: [...globalAttrs],
  },
  symbol: {
    allowedAttrs: [...globalAttrs, "viewBox", "preserveAspectRatio"],
  },
  clipPath: {
    requiredAttrs: ["id"],
    allowedAttrs: [...globalAttrs, "clipPathUnits"],
  },
  mask: {
    requiredAttrs: ["id"],
    allowedAttrs: [...globalAttrs, "x", "y", "width", "height", "maskUnits", "maskContentUnits"],
  },
  filter: {
    requiredAttrs: ["id"],
    allowedAttrs: [...globalAttrs, "x", "y", "width", "height", "filterUnits", "primitiveUnits", "color-interpolation-filters"],
  },
  animate: {
    requiredAttrs: ["attributeName", "dur"],
    allowedAttrs: [
      ...globalAttrs,
      "attributeName",
      "attributeType",
      "from",
      "to",
      "by",
      "dur",
      "begin",
      "end",
      "repeatCount",
      "fill",
      "calcMode",
      "values",
      "keyTimes",
      "keySplines",
    ],
  },
  animateTransform: {
    requiredAttrs: ["attributeName", "type", "dur"],
    allowedAttrs: [
      ...globalAttrs,
      "attributeName",
      "type",
      "from",
      "to",
      "by",
      "dur",
      "begin",
      "end",
      "repeatCount",
      "fill",
      "calcMode",
      "values",
      "keyTimes",
      "keySplines",
    ],
  },
  set: {
    requiredAttrs: ["attributeName", "to", "dur"],
    allowedAttrs: [...globalAttrs, "attributeName", "to", "begin", "end", "fill"],
  },
  metadata: {
    allowedAttrs: [...globalAttrs],
  },
  title: {
    allowedAttrs: [...globalAttrs],
  },
  desc: {
    allowedAttrs: [...globalAttrs],
  },
  style: {
    allowedAttrs: [...globalAttrs, "type"],
  },
  script: {
    allowedAttrs: [...globalAttrs, "type", "href", "xlink:href"],
  },
  foreignObject: {
    allowedAttrs: [...globalAttrs, "x", "y", "width", "height", "transform"],
  },
  pattern: {
    allowedAttrs: [
      ...globalAttrs,
      "x",
      "y",
      "width",
      "height",
      "viewBox",
      "preserveAspectRatio",
      "xmlns",
      "version",
      "xmlns:xlink",
      "patternContentUnits",
      "patternTransform",
      "patternUnits",
      "href",
      "xlink:href",
    ],
  },
};

//////////////////////
// Attribute Value Validation Functions
//////////////////////

// Validate numeric values (allowing negative, decimals, units, and scientific notation)
function isValidNumericValue(value) {
  const numericRegex = /^-?\d+(\.\d+)?([eE][+\-]?\d+)?(px|pt|pc|mm|cm|in|em|ex|ch|rem|vw|vh|vmin|vmax|%)?$/;
  return numericRegex.test(value);
}

// Validate color values (hex, rgb/rgba, hsl/hsla, url() for paint servers, and CSS color names)
function isValidColorValue(value) {
  const colorRegex = /^(?:none|currentColor|inherit|transparent|url\(#.+\)|#[0-9A-Fa-f]{3,8}|(?:rgba?|hsla?)\([^)]*\)|[A-Za-z]+)$/;
  return colorRegex.test(value);
}

// Validate the transform attribute value
function isValidTransformValue(value) {
  const transformRegex = /^(?:\s*(?:translate|scale|rotate|skewX|skewY|matrix)\s*\([^)]*\)\s*)+$/;
  return transformRegex.test(value);
}

// Validate the path data (d attribute), including scientific notation
function isValidPathData(value) {
  const pathRegex = /^[MmZzLlHhVvCcSsQqTtAa0-9,.\s+\-Ee]+$/;
  return pathRegex.test(value);
}

// Validate overall attribute value based on attribute type
function isValidAttributeValue(attr, value) {
  const numericAttrs = ["width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2"];
  if (numericAttrs.includes(attr)) {
    if (!isValidNumericValue(value)) {
      return { valid: false, error: `Invalid numeric value for ${attr}: ${value}` };
    }
    const nonNegative = ["width", "height", "r", "rx", "ry"];
    if (nonNegative.includes(attr) && parseFloat(value) < 0) {
      return { valid: false, error: `${attr} should not be negative: ${value}` };
    }
  }

  if (["fill", "stroke", "stop-color", "flood-color", "lighting-color"].includes(attr)) {
    if (!isValidColorValue(value)) {
      return { valid: false, error: `Invalid color value for ${attr}: ${value}` };
    }
  }

  if (attr === "viewBox") {
    const parts = value.trim().split(/[ ,]+/);
    if (parts.length !== 4 || parts.some((p) => isNaN(parseFloat(p)))) {
      return { valid: false, error: `Invalid viewBox format: ${value}. Should be 4 numbers.` };
    }
  }

  if (attr === "transform" || attr === "gradientTransform" || attr === "patternTransform") {
    if (!isValidTransformValue(value)) {
      return { valid: false, error: `Invalid transform value: ${value}` };
    }
  }

  if (attr === "d") {
    if (!isValidPathData(value)) {
      return { valid: false, error: `Invalid path data: ${value}` };
    }
    if (value.trim() === "") {
      return { valid: false, error: "Path data is empty." };
    }
  }

  // For other attributes (e.g., href) we simply treat the value as a string.
  return { valid: true };
}

//////////////////////
// Element Validation Functions
//////////////////////

// Validate the attributes of a specific element and collect all errors
function validateAttributes(elemName, attrs) {
  const definition = allowedElements[elemName];
  const result = { valid: true, errors: [] };

  if (!definition) {
    result.valid = false;
    result.errors.push(`Element "${elemName}" is not allowed.`);
    return result;
  }

  // Check for required attributes
  if (definition.requiredAttrs) {
    for (const reqAttr of definition.requiredAttrs) {
      if (!(reqAttr in attrs)) {
        result.valid = false;
        result.errors.push(`Required attribute "${reqAttr}" missing from <${elemName}>.`);
      }
    }
  }

  // Validate each attribute's value
  for (const attr in attrs) {
    // Allow global attributes, data- attributes, and event attributes
    if (!definition.allowedAttrs.includes(attr) && !globalAttrs.includes(attr) && !attr.startsWith("data-") && !/^on[A-Za-z]+$/.test(attr)) {
      result.valid = false;
      result.errors.push(`Attribute "${attr}" is not allowed in <${elemName}>.`);
      continue;
    }
    const valueResult = isValidAttributeValue(attr, attrs[attr]);
    if (!valueResult.valid) {
      result.valid = false;
      result.errors.push(`On <${elemName}>: ${valueResult.error}`);
    }
  }

  return result;
}

// Recursively validate an element and its children, collecting all violations
function validateElement(elemName, elemObj, parentName = null) {
  // Exclude validation of content inside <foreignObject>
  if (elemName === "foreignObject") {
    return { valid: true, errors: [] };
  }

  const attrs = {};
  const children = [];
  const result = { valid: true, errors: [] };

  // Separate attributes (prefixed with "@_") and child elements
  for (const key in elemObj) {
    if (key.startsWith("@_")) {
      const attrName = key.slice(2);
      attrs[attrName] = elemObj[key];
    } else {
      if (Array.isArray(elemObj[key])) {
        elemObj[key].forEach((child) => {
          children.push({ name: key, obj: child });
        });
      } else {
        children.push({ name: key, obj: elemObj[key] });
      }
    }
  }

  // Validate the attributes of the current element
  const attrResult = validateAttributes(elemName, attrs);
  if (!attrResult.valid) {
    result.valid = false;
    result.errors.push(...attrResult.errors);
  }

  // Example: <stop> elements must be inside <linearGradient> or <radialGradient>
  if (elemName === "stop" && parentName !== "linearGradient" && parentName !== "radialGradient") {
    result.valid = false;
    result.errors.push(`<stop> must be inside a <linearGradient> or <radialGradient>.`);
  }

  // Recursively validate each child element
  for (const child of children) {
    if (typeof child.obj === "string") continue;
    if (!allowedElements.hasOwnProperty(child.name)) {
      result.valid = false;
      result.errors.push(`Element "${child.name}" is not allowed in <${elemName}>.`);
      continue;
    }
    const childResult = validateElement(child.name, child.obj, elemName);
    if (!childResult.valid) {
      result.valid = false;
      result.errors.push(...childResult.errors);
    }
  }

  return result;
}

//////////////////////
// Main Validation Function
//////////////////////

/**
 * Validates the provided SVG string.
 * If validation passes, returns { isValid: true, errors: [] }.
 * If there are violations, returns { isValid: false, errors: [error messages] }.
 *
 * @param {string} svgString - The SVG content as a string
 * @returns {object} - Validation result object containing isValid flag and errors array
 */
export default function validateSVG(svgString) {
  const result = { isValid: false, errors: [] };

  if (typeof svgString !== "string") {
    result.errors.push("Input is not a string.");
    return result;
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });

  let jsonObj;
  try {
    jsonObj = parser.parse(svgString);
  } catch (error) {
    result.errors.push(`XML parsing error: ${error.message}`);
    return result;
  }

  if (!jsonObj.svg) {
    result.errors.push("Root element is not <svg>.");
    return result;
  }

  const validationResult = validateElement("svg", jsonObj.svg);
  result.isValid = validationResult.valid;
  result.errors = validationResult.errors;
  return result;
}
