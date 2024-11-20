import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

export default neostandard({
  ignores: [
    ...resolveIgnoresFromGitignore(),
    'dist'
  ],
})
