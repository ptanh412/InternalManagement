// ============================================================
// ESLint Configuration for Unused Code Detection
// ============================================================

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Cảnh báo về biến không sử dụng
    'no-unused-vars': ['warn', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    // Cảnh báo về imports không sử dụng
    'no-unused-imports': 'off', // Sẽ cài plugin riêng nếu cần
    // Cảnh báo về code không thể đến được
    'no-unreachable': 'warn',
    // Cảnh báo về expressions không có tác dụng
    'no-unused-expressions': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
