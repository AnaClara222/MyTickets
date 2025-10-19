export default {
  preset: "ts-jest/presets/default-esm", 
  extensionsToTreatAsEsm: [".ts"],
  moduleDirectories: ["node_modules", "src"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true }],
  },
  testMatch: ["<rootDir>/tests/**/*.(test|spec).ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!@faker-js/faker/)"
  ],
};