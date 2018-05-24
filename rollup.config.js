export default {
  input: 'dist/es6/elements.js', // rollup requires ES input
  output: {
    format: 'umd',
    name: '@yellicode/elements',
    file: 'dist/bundles/elements.umd.js'
  },
  external: ['@yellicode/core', 'lodash'] // https://github.com/rollup/rollup/wiki/Troubleshooting#treating-module-as-external-dependency
}