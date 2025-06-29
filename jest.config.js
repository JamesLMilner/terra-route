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
    "<rootDir>/scratch/",
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["<rootDir>/src/test-utils", "<rootDir>/src/heap/heap.d.ts",],
  collectCoverageFrom: ["./src/**"],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  }
};
