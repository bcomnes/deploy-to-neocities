const tape = require('tape')
const { Readable } = require('../')

tape('streams are async iterators', async function (t) {
  const data = ['a', 'b', 'c', null]
  const expected = data.slice(0)

  const r = new Readable({
    read (cb) {
      this.push(data.shift())
      cb(null)
    }
  })

  for await (const chunk of r) {
    t.same(chunk, expected.shift())
  }

  t.same(expected, [null])
  t.end()
})
