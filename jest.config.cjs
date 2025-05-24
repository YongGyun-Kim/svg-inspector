module.exports = {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  moduleFileExtensions: ["js"],
  verbose: true,
  collectCoverageFrom: ["index.js", "!**/node_modules/**", "!**/tests/**"],
  coverageReporters: ["text", "lcov"],
  coverageDirectory: "coverage",
};
