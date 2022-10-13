// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['./test/setupTests.js'],

  // The test environment that will be used for testing
  testEnvironment: 'node',
  transformIgnorePatterns: [
    "node_modules/(?!(oclif)/)"
  ],
};
