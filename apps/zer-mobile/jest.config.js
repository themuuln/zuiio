/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", { configFile: "./jest.babel.config.js" }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|expo(nent)?|@expo(nent)?/.*|@zuiio/.*|zustand/.*|@tanstack/.*))",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@react-native-async-storage/async-storage$":
      "@react-native-async-storage/async-storage/jest/async-storage-mock",
    "\\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$": "<rootDir>/jest/file-mock.js",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  clearMocks: true,
};
