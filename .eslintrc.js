// SEE: http://eslint.org/docs/user-guide/configuring
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['standard', 'prettier'],
  plugins: ['import', 'prettier'],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error'
  }
}
