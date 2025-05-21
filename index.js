import { XMLParser } from "fast-xml-parser";

/**
 * Define global attribute categories for convenience.
 * These will be allowed on applicable SVG elements.
 */
const coreAttributes = ["id", "xml:base", "xml:lang"];
// Note: 'xml:space' is omitted because it's deprecated in SVG 2.

const conditionalProcessingAttributes = ["requiredFeatures", "requiredExtensions", "systemLanguage"];

const eventAttributes = [
  // SVG 1.1 graphical event attributes
  "onfocusin",
  "onfocusout",
  "onactivate",
  "onclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onload",
];

const presentationAttributes = [
  // common stylistic attributes (from SVG 1.1 spec)
  "alignment-baseline",
  "baseline-shift",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "cursor",
  "direction",
  "display",
  "dominant-baseline",
  // 'enable-background' (deprecated in SVG 2, exclude from allowed list)
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "image-rendering",
  // 'kerning' is deprecated in SVG 2 (no longer supported)
  "letter-spacing",
  "lighting-color",
  "marker-end",
  "marker-mid",
  "marker-start",
  "mask",
  "opacity",
  "overflow",
  "pointer-events",
  "shape-rendering",
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "unicode-bidi",
  "visibility",
  "word-spacing",
  "writing-mode",
];

const globalAttributes = [
  ...coreAttributes,
  ...conditionalProcessingAttributes,
  ...eventAttributes,
  ...presentationAttributes,
  "class",
  "style", // common SVG attributes for CSS class and inline style
  // SVG 2 global attributes:
  "tabindex", // allow keyboard focus
  "role", // ARIA role (aria-* are handled separately below)
];

/**
 * Define allowed SVG elements, with their specific allowed attributes and required attributes.
 * Global attributes (core, event, presentation, etc.) are handled separately and need not be listed for each element.
 */
const allowedElements = {
  // Container elements
  svg: {
    requiredAttrs: ["xmlns"], // The root <svg> should have an xmlns declared
    allowedAttrs: ["xmlns", "width", "height", "viewBox", "preserveAspectRatio", "x", "y"],
    // Note: 'version' and 'baseProfile' from SVG 1.1 are omitted (deprecated in SVG 2)
  },
  g: {
    allowedAttrs: ["transform"], // group can have transform; other global attrs are allowed implicitly
  },
  defs: {
    allowedAttrs: [], // acts like a grouping container, no specific attributes of its own beyond global ones
  },
  symbol: {
    allowedAttrs: ["viewBox", "preserveAspectRatio", "refX", "refY"],
    // refX/refY were introduced to control positioning when used with <use>
  },
  use: {
    allowedAttrs: ["href", "x", "y", "width", "height"],
    // xlink:href deprecated; using href. width/height can override the original element's size.
  },
  image: {
    allowedAttrs: ["href", "x", "y", "width", "height", "preserveAspectRatio"],
    // In SVG2, <image> uses href instead of xlink:href.
  },
  a: {
    allowedAttrs: ["href", "target"],
    // <a> can be used to hyperlink (target is nonstandard in SVG 1.1 but allowed in HTML/SVG integration).
  },
  switch: {
    allowedAttrs: [], // <switch> has no specific attributes outside conditional processing (which are global)
  },
  foreignObject: {
    allowedAttrs: ["x", "y", "width", "height"],
    // Allows foreign (non-SVG) content inside. The validator will allow any children here.
  },

  // Graphics elements - shapes
  rect: {
    allowedAttrs: ["x", "y", "width", "height", "rx", "ry", "transform"],
    // fill, stroke, etc. are handled as presentation attributes globally
  },
  circle: {
    allowedAttrs: ["cx", "cy", "r", "transform"],
  },
  ellipse: {
    allowedAttrs: ["cx", "cy", "rx", "ry", "transform"],
  },
  line: {
    allowedAttrs: ["x1", "y1", "x2", "y2", "transform"],
  },
  polyline: {
    allowedAttrs: ["points", "transform"],
  },
  polygon: {
    allowedAttrs: ["points", "transform"],
  },
  path: {
    allowedAttrs: ["d", "transform"],
  },

  // Graphics elements - others
  text: {
    allowedAttrs: ["x", "y", "dx", "dy", "textLength", "lengthAdjust", "transform"],
    // presentation attributes like fill, font-family etc. apply but are global
  },
  tspan: {
    allowedAttrs: ["x", "y", "dx", "dy", "textLength", "lengthAdjust"],
    // <tspan> used for sub-text, can reposition similarly to <text>
  },
  textPath: {
    allowedAttrs: ["href", "startOffset", "method", "spacing"],
    // xlink:href replaced by href in SVG2.
  },
  tref: {
    allowedAttrs: ["href"],
    // <tref> is deprecated in SVG 2 (used to reference text by ID). We include for SVG 1.1 but will flag as deprecated if found.
  },

  // Paint server elements
  linearGradient: {
    allowedAttrs: ["id", "x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform", "spreadMethod", "href"],
    // 'id' is included here for clarity (though it's a core attribute), since gradients often have an id to reference.
    // xlink:href (deprecated) replaced by href to reference another gradient.
  },
  radialGradient: {
    allowedAttrs: ["id", "cx", "cy", "r", "fx", "fy", "fr", "gradientUnits", "gradientTransform", "spreadMethod", "href"],
    // 'fr' (focal radius) is an SVG 2 addition (for future mesh gradients; browsers may not support yet).
  },
  stop: {
    allowedAttrs: ["offset", "stop-color", "stop-opacity"],
    // stop-color and stop-opacity are presentation attributes but we list them for clarity.
  },
  pattern: {
    allowedAttrs: ["x", "y", "width", "height", "patternUnits", "patternContentUnits", "patternTransform", "viewBox", "preserveAspectRatio", "href"],
  },

  // Marker/Mask/Clip
  marker: {
    allowedAttrs: ["id", "refX", "refY", "markerUnits", "markerWidth", "markerHeight", "orient", "viewBox", "preserveAspectRatio"],
    // orient can be a specific angle or "auto" or "auto-start-reverse"
  },
  mask: {
    allowedAttrs: ["id", "x", "y", "width", "height", "maskUnits", "maskContentUnits"],
  },
  clipPath: {
    allowedAttrs: ["id", "clipPathUnits", "transform", "href"],
    // SVG2 allows clipPath to reference another via href (formerly xlink:href).
  },

  // Filter effects
  filter: {
    allowedAttrs: ["id", "x", "y", "width", "height", "filterUnits", "primitiveUnits", "href"],
  },
  feBlend: { allowedAttrs: ["in", "in2", "mode", "result"] },
  feColorMatrix: { allowedAttrs: ["in", "type", "values", "result"] },
  feComponentTransfer: { allowedAttrs: ["in", "result"] },
  feComposite: { allowedAttrs: ["in", "in2", "operator", "k1", "k2", "k3", "k4", "result"] },
  feConvolveMatrix: {
    allowedAttrs: ["in", "order", "kernelMatrix", "divisor", "bias", "targetX", "targetY", "edgeMode", "kernelUnitLength", "preserveAlpha", "result"],
  },
  feDiffuseLighting: { allowedAttrs: ["in", "surfaceScale", "diffuseConstant", "kernelUnitLength", "result"] },
  feDisplacementMap: { allowedAttrs: ["in", "in2", "scale", "xChannelSelector", "yChannelSelector", "result"] },
  feDistantLight: { allowedAttrs: ["azimuth", "elevation"] },
  feDropShadow: { allowedAttrs: ["dx", "dy", "stdDeviation", "flood-color", "flood-opacity", "result"] },
  feFlood: { allowedAttrs: ["flood-color", "flood-opacity", "result"] },
  feFuncA: { allowedAttrs: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"] },
  feFuncB: { allowedAttrs: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"] },
  feFuncG: { allowedAttrs: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"] },
  feFuncR: { allowedAttrs: ["type", "tableValues", "slope", "intercept", "amplitude", "exponent", "offset"] },
  feGaussianBlur: { allowedAttrs: ["in", "stdDeviation", "edgeMode", "result"] },
  feImage: { allowedAttrs: ["href", "x", "y", "width", "height", "preserveAspectRatio", "result"] },
  feMerge: { allowedAttrs: ["result"] },
  feMergeNode: { allowedAttrs: ["in"] },
  feMorphology: { allowedAttrs: ["in", "operator", "radius", "result"] },
  feOffset: { allowedAttrs: ["in", "dx", "dy", "result"] },
  fePointLight: { allowedAttrs: ["x", "y", "z"] },
  feSpecularLighting: { allowedAttrs: ["in", "surfaceScale", "specularConstant", "specularExponent", "kernelUnitLength", "result"] },
  feSpotLight: { allowedAttrs: ["x", "y", "z", "pointsAtX", "pointsAtY", "pointsAtZ", "specularExponent", "limitingConeAngle"] },
  feTile: { allowedAttrs: ["in", "result"] },
  feTurbulence: { allowedAttrs: ["baseFrequency", "numOctaves", "seed", "stitchTiles", "type", "result"] },

  // Animation elements (SMIL)
  animate: {
    allowedAttrs: [
      "attributeName",
      "attributeType",
      "from",
      "to",
      "by",
      "values",
      "dur",
      "begin",
      "end",
      "min",
      "max",
      "repeatCount",
      "repeatDur",
      "fill",
      "calcMode",
      "keyTimes",
      "keySplines",
      "additive",
      "accumulate",
    ],
  },
  animateTransform: {
    allowedAttrs: [
      "attributeName",
      "type",
      "from",
      "to",
      "by",
      "values",
      "dur",
      "begin",
      "end",
      "repeatCount",
      "repeatDur",
      "fill",
      "calcMode",
      "keyTimes",
      "keySplines",
      "additive",
      "accumulate",
    ],
    // animateTransform is specific for transformations, 'type' (translate/scale/rotate/skewX/skewY) is required.
  },
  animateMotion: {
    allowedAttrs: [
      "path",
      "href",
      "begin",
      "dur",
      "repeatCount",
      "repeatDur",
      "fill",
      "keyTimes",
      "keySplines",
      "calcMode",
      "values",
      "from",
      "to",
      "by",
      "rotate",
    ],
    // Note: animateMotion can either have a 'path' attribute or an <mpath> child to reference a path.
  },
  mpath: {
    allowedAttrs: ["href"],
    // Must be child of animateMotion. xlink:href deprecated in SVG2.
  },
  set: {
    allowedAttrs: ["attributeName", "to", "begin", "dur", "end", "repeatCount", "repeatDur", "fill"],
    // The <set> element (for discrete set of an attribute) uses a limited subset of animation attributes.
  },
  // SVG 2 new/discouraged animation:
  animateColor: {
    allowedAttrs: [
      "attributeName",
      "from",
      "to",
      "by",
      "values",
      "dur",
      "begin",
      "end",
      "repeatCount",
      "repeatDur",
      "fill",
      "calcMode",
      "keyTimes",
      "keySplines",
      "additive",
      "accumulate",
    ],
    // This element is deprecated in SVG 2; included for SVG 1.1 compatibility.
  },
  discard: {
    allowedAttrs: ["begin", "href"],
    // SVG 2's <discard> element to remove an element at a certain time.
  },

  // Descriptive (metadata) elements
  desc: { allowedAttrs: [] },
  title: { allowedAttrs: [] },
  metadata: { allowedAttrs: [] },

  // Style/Scripting
  style: {
    allowedAttrs: ["type", "media", "title"],
    // type should be "text/css". If omitted, browsers assume text/css for SVG <style>.
  },
  script: {
    allowedAttrs: ["href", "type"],
    // External script via href (xlink:href in 1.1) or inline script with possibly a type (like "application/ecmascript").
  },
  // NOTE: Elements like <audio>, <video>, <canvas>, <iframe>, <iframe> if used directly in SVG (SVG 2)
  // could be added here to recognize them. We treat them as valid foreign elements if encountered.
};

// List of deprecated elements (SVG 2) to flag specifically
const deprecatedElements = [
  "cursor",
  "font",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
  "hkern",
  "vkern",
  "glyph",
  "glyphRef",
  "tref",
  "animateColor",
];

// List of deprecated attributes to flag
const deprecatedAttributes = [
  "xlink:href", // use href instead
  "xlink:title", // use <title> element instead
  "xml:space", // use CSS white-space
  "enable-background", // deprecated presentation attribute
  "kerning", // deprecated presentation attribute
  "baseProfile", // removed from <svg>
  "version", // removed from <svg> in SVG 2 (no longer needed)
  "externalResourcesRequired", // removed in SVG 2
];

/**
 * Validates the transform attribute value.
 * Ensures the value consists of allowed transform functions with proper syntax.
 * Allowed functions: translate, scale, rotate, skewX, skewY, matrix.
 */
function isValidTransformValue(value) {
  const allowedFunctions = ["translate", "scale", "rotate", "skewX", "skewY", "matrix"];
  // Regex: one or more function calls, with no invalid chars between.
  const regex = new RegExp(`^(?:\\s*(?:${allowedFunctions.join("|")})\\s*\\([^\\)]*\\)\\s*)+$`)
  if (!regex.test(value)) {
    return {
      valid: false,
      error: `Invalid transform value: ${value}`,
    };
  }
  return { valid: true };
}

/**
 * Validates the SVG path "d" attribute value.
 * Checks that the path data consists only of allowed command letters and numbers.
 * This is a basic check and does not fully validate the sequence of commands.
 */
function isValidPathData(value) {
  const pathRegex = /^[MmZzLlHhVvCcSsQqTtAa0-9,\.\s\-+]+$/;
  if (!pathRegex.test(value)) {
    return {
      valid: false,
      error: `Invalid path data: ${value}`,
    };
  }
  return { valid: true };
}

/**
 * Validates a single attribute's value format based on its name.
 * Checks numeric formats, color formats, viewBox format, transform/path, etc.
 */
function isValidAttributeValue(attr, value) {
  // First handle attributes that are deprecated to provide a specialized message.
  if (deprecatedAttributes.includes(attr)) {
    return {
      valid: false,
      error: `Attribute "${attr}" is deprecated or not allowed`,
    };
  }

  // Numeric attributes (could be plain number or number with unit or percentage)
  const numericAttrs = ["width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2", "dx", "dy", "offset"];
  if (numericAttrs.includes(attr)) {
    // Pattern: number (int or float) optionally followed by a unit (px, em, %, etc.)
    if (!/^[-+]?\d*\.?\d+(%|[a-zA-Z]{2})?$/.test(value)) {
      // Note: This regex is simplified. It allows units like "cm", "mm" (2 letters) or "%" or none.
      return {
        valid: false,
        error: `Invalid numeric value for ${attr}: ${value}`,
      };
    }
    // Additional numeric constraints:
    const num = parseFloat(value);
    if (["width", "height", "r", "rx", "ry"].includes(attr)) {
      if (num < 0) {
        return {
          valid: false,
          error: `Invalid numeric value for ${attr}: ${value} (must be non-negative)`,
        };
      }
    }
  }

  // Color attributes (fill, stroke, etc.)
  if (["fill", "stroke", "stop-color", "flood-color"].includes(attr)) {
    // Allowed: 'none', 'currentColor', hex (#FFF or #FFFFFF), or alphabetic color names.
    const isHex = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
    const isColorName = /^[a-zA-Z]+$/.test(value);
    if (!(value === "none" || value === "currentColor" || isHex || isColorName)) {
      return {
        valid: false,
        error: `Invalid color value for ${attr}: ${value}`,
      };
    }
  }

  // Opacity attributes (opacity, fill-opacity, etc.) should be 0-1
  if (/opacity$/.test(attr)) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 1) {
      return {
        valid: false,
        error: `Invalid opacity value for ${attr}: ${value} (must be 0.0 to 1.0)`,
      };
    }
  }

  // The viewBox attribute: should be four numbers
  if (attr === "viewBox") {
    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 4 || parts.some((p) => isNaN(parseFloat(p)))) {
      return {
        valid: false,
        error: `Invalid viewBox format: ${value}. Should be four numbers`,
      };
    }
  }

  // The preserveAspectRatio attribute: validate format e.g. "xMidYMid meet/slice"
  if (attr === "preserveAspectRatio") {
    if (!/^(?:xMin|xMid|xMax)(?:YMin|YMid|YMax)\s+(?:meet|slice)$/.test(value)) {
      return {
        valid: false,
        error: `Invalid preserveAspectRatio value: ${value}`,
      };
    }
  }

  // Transform attribute: use helper
  if (attr === "transform") {
    return isValidTransformValue(value);
  }

  // Path data attribute: use helper
  if (attr === "d") {
    return isValidPathData(value);
  }

  // Everything else: assume valid by default (could add more cases as needed)
  return { valid: true };
}

/**
 * Validates the attributes of a specific element.
 * Checks for required attributes, allowed attributes, and correct value formats.
 */
function validateAttributes(elemName, attrs) {
  const result = { valid: true, errors: [] };

  // If element is not recognized in allowedElements, skip attribute checks (handled elsewhere).
  const definition = allowedElements[elemName];
  if (!definition) return result;

  // 1. Check required attributes presence.
  if (definition.requiredAttrs) {
    for (const reqAttr of definition.requiredAttrs) {
      if (!(reqAttr in attrs)) {
        result.valid = false;
        result.errors.push(`Required attribute "${reqAttr}" missing from <${elemName}>`);
      }
    }
  }

  // 2. Check each attribute is allowed and properly formatted.
  for (const attr in attrs) {
    const value = attrs[attr];
    // Global ARIA or data-* attributes: allow any aria-* or data-* on any element (SVG2).
    if (attr.startsWith("aria-") || attr.startsWith("data-")) {
      continue; // assume allowed, we could add specific validation for ARIA values if needed
    }
    if (attr === "role") {
      continue; // any role value is accepted as a token (further validation of ARIA roles is outside scope)
    }

    // Check if attribute is allowed either in element-specific list or in global lists.
    const attrAllowed = (definition.allowedAttrs && definition.allowedAttrs.includes(attr)) || globalAttributes.includes(attr);
    if (!attrAllowed) {
      result.valid = false;
      result.errors.push(`Attribute "${attr}" not allowed in <${elemName}>`);
      continue;
    }

    // Validate the attribute's value format if allowed.
    const valueCheck = isValidAttributeValue(attr, value);
    if (!valueCheck.valid) {
      result.valid = false;
      // Prefix the error with context of the element for clarity
      result.errors.push(`On <${elemName}>: ${valueCheck.error}`);
    }
  }

  return result;
}

/**
 * Determines if a given child element name is permitted under a given parent element name.
 * This enforces structural/hierarchical rules beyond the basic allowedElements definitions.
 */
function isAllowedChild(parentName, childName) {
  // Define special parent-child relationships:
  // Gradients can only contain <stop> (and animation/descriptive elements).
  if (parentName === "linearGradient" || parentName === "radialGradient") {
    const allowedChildren = ["stop", "animate", "animateTransform", "animateMotion", "animateColor", "set", "desc", "title", "metadata"];
    return allowedChildren.includes(childName);
  }
  // <stop> should only appear in gradients (linearGradient or radialGradient)
  if (childName === "stop") {
    if (!(parentName === "linearGradient" || parentName === "radialGradient")) {
      return false;
    }
  }
  // <mpath> only allowed inside <animateMotion>
  if (childName === "mpath") {
    if (parentName !== "animateMotion") {
      return false;
    }
  }
  // <animateMotion> cannot have <path> elements as children except via <mpath> (which is handled above).
  // In SVG, shapes generally cannot contain other shapes (they are not containers).
  if (["rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "image", "use"].includes(parentName)) {
    // Graphics elements (except text) should not have any children in markup (they are empty or only descriptive/animation).
    const allowedChildren = ["desc", "title", "metadata", "animate", "animateTransform", "animateMotion", "set"];
    return allowedChildren.includes(childName);
  }
  // <text> can have tspan, textPath, a (for links), and possibly <set>/<animate> and descriptive.
  if (parentName === "text") {
    const allowedChildren = ["tspan", "textPath", "a", "animate", "set", "animateTransform", "animateMotion", "desc", "title", "metadata"];
    return allowedChildren.includes(childName);
  }
  // <tspan> can contain other <tspan> or textPath? In SVG2, <tspan> is like a span of text, can contain other tspans or not?
  // We'll allow nested tspan and descriptive/animation.
  if (parentName === "tspan") {
    const allowedChildren = ["tspan", "animate", "set", "animateTransform", "animateMotion", "desc", "title", "metadata"];
    return allowedChildren.includes(childName);
  }
  // <textPath> should contain text content (tspan or text data), no shapes.
  if (parentName === "textPath") {
    const allowedChildren = ["tspan", "animate", "set", "animateTransform", "animateMotion", "desc", "title", "metadata"];
    return allowedChildren.includes(childName);
  }
  // <a> (link) is a container that can hold any graphics or text (acts like a <g> or <text> depending on context).
  if (parentName === "a") {
    // We allow anything that a <g> could contain.
    return true; // further checks will validate the child on its own
  }
  // <defs> can contain anything that <g> can (per SVG2 spec).
  if (parentName === "defs") {
    return true;
  }
  // <marker>, <mask>, <clipPath>, <pattern> are containers for shapes and groups (and descriptive/animation).
  if (["marker", "mask", "clipPath", "pattern"].includes(parentName)) {
    // We'll allow any element that is a graphics or container (not another marker/mask inside mask, etc., but shapes or <g>).
    // Simpler rule: disallow if child is a root-only element or something obviously wrong.
    // We'll rely on allowedElements for specifics and not block general shapes here.
    return true;
  }
  // <foreignObject>: allow any element (foreign content), skip strict SVG checks for its children.
  if (parentName === "foreignObject") {
    return true;
  }
  // By default, if we don't have a special rule, we allow it and rely on allowedElements existence + other attribute checks.
  return true;
}

/**
 * Recursively validates an element and its children in the parsed SVG JSON.
 * This will check the element's attributes and then enforce child element rules.
 */
function validateElement(elemName, elemObj, parentName = null) {
  const result = { valid: true, errors: [] };

  // Prepare attributes and children lists from the parsed object.
  const attrs = {};
  const children = [];
  for (const key in elemObj) {
    if (key.startsWith("@_")) {
      // Attribute found: strip the prefix used by fast-xml-parser.
      const attrName = key.slice(2);
      attrs[attrName] = elemObj[key];
    } else {
      // Child element found. It could be an array (multiple children with same tag) or single object.
      if (Array.isArray(elemObj[key])) {
        elemObj[key].forEach((childObj) => {
          children.push({ name: key, obj: childObj });
        });
      } else {
        children.push({ name: key, obj: elemObj[key] });
      }
    }
  }

  // If this element is explicitly marked deprecated in SVG 2, flag it.
  if (deprecatedElements.includes(elemName)) {
    result.valid = false;
    result.errors.push(`Element "<${elemName}>" is deprecated in SVG 2 and should not be used`);
  }

  // Validate this element's attributes.
  const attrCheck = validateAttributes(elemName, attrs);
  if (!attrCheck.valid) {
    result.valid = false;
    result.errors.push(...attrCheck.errors);
  }

  // Recursively validate child elements.
  for (const child of children) {
    const childName = child.name;
    const childObj = child.obj;
    // If child is a text node (string), we can ignore it (text content inside <text> for example).
    if (typeof childObj === "string") {
      continue;
    }
    // Check if the child element is recognized in SVG.
    if (!allowedElements.hasOwnProperty(childName)) {
      // Special case: check if childName is one of the HTML elements allowed in SVG 2 (video, audio, canvas, iframe, etc.).
      const htmlEmbedded = ["video", "audio", "canvas", "iframe", "iframe", "math", "html", "body", "div", "span"];
      if (htmlEmbedded.includes(childName)) {
        // We will treat this as valid foreign content (assuming inside foreignObject or allowed inline by SVG2).
        // Skip SVG-specific validation for this foreign element's subtree.
        continue;
      }
      result.valid = false;
      result.errors.push(`Element "<${childName}>" is not a valid SVG element`);
      // Still attempt to validate its children (in case it's a foreignObject content or similar).
    }

    // Check structural constraint: is this child allowed under the current element?
    if (parentName) {
      // if parentName is passed, use that; otherwise, for root parentName might be null.
    }
    if (elemName && !isAllowedChild(elemName, childName)) {
      result.valid = false;
      result.errors.push(`Element "<${childName}>" is not allowed as a child of <${elemName}>`);
    }

    // Recursively validate the child element.
    const childResult = validateElement(childName, childObj, elemName);
    if (!childResult.valid) {
      result.valid = false;
      result.errors.push(...childResult.errors);
    }
  }

  return result;
}

/**
 * Validates the provided SVG string.
 * Returns an object with isValid flag and an array of error messages (if any).
 */
export default function validateSVG(svgString) {
  const result = { isValid: false, errors: [] };

  if (typeof svgString !== "string") {
    result.errors.push("Input is not a string");
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

  // The top-level element must be <svg>.
  if (!jsonObj.svg) {
    result.errors.push("Root element is not <svg>");
    return result;
  }

  // Validate the <svg> element and its contents.
  const validationResult = validateElement("svg", jsonObj.svg);
  result.isValid = validationResult.valid;
  if (!validationResult.valid) {
    result.errors = validationResult.errors;
  }
  return result;
}
