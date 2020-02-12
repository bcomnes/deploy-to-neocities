const tape = require('tape')
const { Writable } = require('../')

tape('opens before writes', function (t) {
  t.plan(2)
  const trace = []
  const stream = new Writable({
    open (cb) {
      trace.push('open')
      return cb(null)
    },
    write (data, cb) {
      trace.push('write')
      return cb(null)
    }
  })
  stream.on('close', () => {
    t.equals(trace.length, 2)
    t.equals(trace[0], 'open')
  })
  stream.write('data')
  stream.end()
})

tape('drain', function (t) {
  const stream = new Writable({
    highWaterMark: 1,
    write (data, cb) {
      cb(null)
    }
  })

  t.notOk(stream.write('a'))
  stream.on('drain', function () {
    t.pass('drained')
    t.end()
  })
})

tape('drain multi write', function (t) {
  t.plan(4)

  const stream = new Writable({
    highWaterMark: 1,
    write (data, cb) {
      cb(null)
    }
  })

  t.notOk(stream.write('a'))
  t.notOk(stream.write('a'))
  t.notOk(stream.write('a'))
  stream.on('drain', function () {
    t.pass('drained')
    t.end()
  })
})

tape('drain async write', function (t) {
  let flushed = false

  const stream = new Writable({
    highWaterMark: 1,
    write (data, cb) {
      setImmediate(function () {
        flushed = true
        cb(null)
      })
    }
  })

  t.notOk(stream.write('a'))
  t.notOk(flushed)
  stream.on('drain', function () {
    t.ok(flushed)
    t.end()
  })
})

tape('writev', function (t) {
  const expected = [[], ['ho']]

  const s = new Writable({
    writev (batch, cb) {
      t.same(batch, expected.shift())
      cb(null)
    }
  })

  for (let i = 0; i < 100; i++) {
    expected[0].push('hi-' + i)
    s.write('hi-' + i)
  }

  s.on('drain', function () {
    s.write('ho')
    s.end()
  })

  s.on('finish', function () {
    t.end()
  })
})
