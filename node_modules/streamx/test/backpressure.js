const tape = require('tape')
const { Writable, Readable } = require('../')

tape('write backpressure', function (t) {
  const ws = new Writable()

  for (let i = 0; i < 15; i++) {
    t.ok(ws.write('a'), 'not backpressured')
    t.notOk(Writable.isBackpressured(ws), 'static check')
  }

  t.notOk(ws.write('a'), 'backpressured')
  t.ok(Writable.isBackpressured(ws), 'static check')

  t.end()
})

tape('write backpressure with drain', function (t) {
  const ws = new Writable()

  for (let i = 0; i < 15; i++) {
    t.ok(ws.write('a'), 'not backpressured')
    t.notOk(Writable.isBackpressured(ws), 'static check')
  }

  t.notOk(ws.write('a'), 'backpressured')
  t.ok(Writable.isBackpressured(ws), 'static check')

  ws.on('drain', function () {
    t.notOk(Writable.isBackpressured(ws))
    t.end()
  })
})

tape('write backpressure with destroy', function (t) {
  const ws = new Writable()

  ws.write('a')
  ws.destroy()

  t.ok(Writable.isBackpressured(ws))
  t.end()
})

tape('write backpressure with end', function (t) {
  const ws = new Writable()

  ws.write('a')
  ws.end()

  t.ok(Writable.isBackpressured(ws))
  t.end()
})

tape('read backpressure', function (t) {
  const rs = new Readable()

  for (let i = 0; i < 15; i++) {
    t.ok(rs.push('a'), 'not backpressured')
    t.notOk(Readable.isBackpressured(rs), 'static check')
  }

  t.notOk(rs.push('a'), 'backpressured')
  t.ok(Readable.isBackpressured(rs), 'static check')

  t.end()
})

tape('read backpressure with later read', function (t) {
  const rs = new Readable()

  for (let i = 0; i < 15; i++) {
    t.ok(rs.push('a'), 'not backpressured')
    t.notOk(Readable.isBackpressured(rs), 'static check')
  }

  t.notOk(rs.push('a'), 'backpressured')
  t.ok(Readable.isBackpressured(rs), 'static check')

  rs.once('readable', function () {
    rs.read()
    t.notOk(Readable.isBackpressured(rs))
    t.end()
  })
})

tape('read backpressure with destroy', function (t) {
  const rs = new Readable()

  rs.push('a')
  rs.destroy()

  t.ok(Readable.isBackpressured(rs))
  t.end()
})

tape('read backpressure with push(null)', function (t) {
  const rs = new Readable()

  rs.push('a')
  rs.push(null)

  t.ok(Readable.isBackpressured(rs))
  t.end()
})
