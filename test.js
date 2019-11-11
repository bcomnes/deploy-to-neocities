import tape from 'tape'
import ptape from 'tape-promise'
import { thing } from './main'
const test = ptape(tape)

test('a test', async t => {
  console.log(thing)
  t.ok('pass')
})
