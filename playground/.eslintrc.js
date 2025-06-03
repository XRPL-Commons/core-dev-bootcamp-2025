module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest", // Allows the use of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"], // Uses the linting rules from @typescript-eslint/eslint-plugin
  plugins: ["prettier"],
  env: {
    node: true, // Enable Node.js global variables
  },
};
