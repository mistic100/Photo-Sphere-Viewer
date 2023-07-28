module.exports = {
    root: true,
    extends: [
        'eslint:recommended', 
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/stylistic',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'array-callback-return': 'error',
        'eqeqeq': 'error',
        'no-var': 'error',
        'prefer-const': ['error', { destructuring: 'all' }],
        '@typescript-eslint/no-duplicate-enum-values': 'error',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        "@typescript-eslint/array-type": ['error', { default: 'array-simple' }],
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
    ignorePatterns: ['**/dist/**/*', '*.js'],
};
