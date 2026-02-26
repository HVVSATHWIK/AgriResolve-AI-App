/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind directives
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'variants',
          'responsive',
          'screen',
          'config',
        ],
      },
    ],

    // Tailwind v4 commonly uses `@import "tailwindcss";`
    'import-notation': 'string',
  },
};
