export default {
  input: 'dist/es6/model.js', // rollup requires ES input
  output: {
    format: 'umd',
    name: '@yellicode/model',
    file: 'dist/bundles/model.umd.js'
  },
  external: ['@yellicode/core', 'lodash'] // https://github.com/rollup/rollup/wiki/Troubleshooting#treating-module-as-external-dependency
}