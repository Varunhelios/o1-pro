/**
 * @description
 * Jest configuration file for the Learn Kannada app.
 * Configures Jest to work with TypeScript and Next.js for unit testing.
 *
 * Key features:
 * - Uses ts-jest preset for TypeScript support
 * - Sets test environment to Node.js
 * - Specifies test file location
 *
 * @notes
 * - Adjust roots if your test directory differs
 */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
}