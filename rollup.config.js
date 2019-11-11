
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default [
  {
    input: 'main.js',
    output: [
      { file: 'dist/bundle.cjs.js', format: 'cjs' }
    ],
    plugins: [
      resolve({
        browser: false,
        preferBuiltins: true
      }),
      commonjs()
    ]
  }
]
