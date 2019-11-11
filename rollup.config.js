
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

export default [
  {
    input: 'main.js',
    output: [
      { file: 'dist/bundle.cjs.js', format: 'cjs' }
    ],
    plugins: [
      resolve(),
      commonjs(),
      globals(),
      builtins()
    ]
  }
]
