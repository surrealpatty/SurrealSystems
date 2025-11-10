module.exports = {
  env: {
    node: true,
    es2024: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'script',
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    // Enforce using the logger instead of console.*:
    'no-console': 'error',
    // tweak any rules you prefer
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
  },
};
