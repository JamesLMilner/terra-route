console.log("===== Using ts-jest ======");

export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/docs/",
    "<rootDir>/dist/",
    "<rootDir>/demo/",
    "<rootDir>/coverage/",
    "<rootDir>/src/fixtures.ts",
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["<rootDir>/src/fixtures.ts"],
  collectCoverageFrom: ["./src/**"],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  }
};
