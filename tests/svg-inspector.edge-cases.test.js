import validateSVG from "../index.js";

describe("SVG Inspector 엣지 케이스 테스트", () => {
  test("문자열이 아닌 입력을 검증합니다", () => {
    const nonStringInputs = [null, undefined, 123, {}, [], () => {}];

    nonStringInputs.forEach((input) => {
      const result = validateSVG(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBe("Input is not a string");
    });
  });

  test("매우 큰 SVG를 검증합니다", () => {
    // 많은 수의 rect 요소가 있는 SVG를 생성합니다
    let largeContent = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">\n';
    for (let i = 0; i < 100; i++) {
      largeContent += `  <rect x="${i * 10}" y="${i * 10}" width="8" height="8" fill="#${i % 10}${i % 10}${i % 10}" />\n`;
    }
    largeContent += "</svg>";

    const result = validateSVG(largeContent);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test("중첩된 그룹이 있는 SVG를 검증합니다", () => {
    // 깊이 중첩된 그룹 구조를 가진 SVG를 생성합니다
    let deeplyNestedContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n';
    deeplyNestedContent += '  <g transform="translate(10,10)">\n';
    for (let i = 0; i < 10; i++) {
      deeplyNestedContent += `    ${"  ".repeat(i)}<g transform="translate(1,1)">\n`;
    }
    deeplyNestedContent += `    ${"  ".repeat(10)}<rect x="0" y="0" width="10" height="10" />\n`;
    for (let i = 9; i >= 0; i--) {
      deeplyNestedContent += `    ${"  ".repeat(i)}</g>\n`;
    }
    deeplyNestedContent += "  </g>\n";
    deeplyNestedContent += "</svg>";

    const result = validateSVG(deeplyNestedContent);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test("특수 문자가 포함된 SVG를 검증합니다", () => {
    const svgWithSpecialChars = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <text x="10" y="20">특수 문자: &lt; &gt; &amp; &quot; &apos;</text>
      </svg>
    `;

    const result = validateSVG(svgWithSpecialChars);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test("CDATA 섹션이 포함된 SVG를 검증합니다", () => {
    const svgWithCDATA = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <script type="text/javascript"><![CDATA[
          function showAlert() {
            alert("SVG with embedded script");
          }
        ]]></script>
        <rect x="10" y="10" width="80" height="80" onclick="showAlert()" />
      </svg>
    `;

    const result = validateSVG(svgWithCDATA);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test("foreignObject가 포함된 SVG를 검증합니다", () => {
    const svgWithForeignObject = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <foreignObject x="10" y="10" width="80" height="80">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <p>This is HTML inside SVG</p>
            <button>Click me</button>
          </div>
        </foreignObject>
      </svg>
    `;

    const result = validateSVG(svgWithForeignObject);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test("주석이 포함된 SVG를 검증합니다", () => {
    const svgWithComments = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <!-- This is a comment -->
        <rect x="10" y="10" width="80" height="80" />
        <!-- 
          Another multi-line 
          comment 
        -->
      </svg>
    `;

    const result = validateSVG(svgWithComments);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
