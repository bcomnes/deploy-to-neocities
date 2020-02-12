const eos = require('end-of-stream')
const tape = require('tape')
const stream = require('../')
const finished = require('stream').finished

run(eos)
run(finished)

function run (eos) {
  if (!eos) return
  const name = eos === finished ? 'nodeStream.finished' : 'eos'
  tape(name + ' readable', function (t) {
    const r = new stream.Readable()
    let ended = false

    r.on('end', function () {
      ended = true
    })

    eos(r, function (err) {
      t.error(err, 'no error')
      t.ok(ended)
      t.end()
    })

    r.push('hello')
    r.push(null)
    r.resume()
  })

  tape(name + ' readable destroy', function (t) {
    const r = new stream.Readable()
    let ended = false

    r.on('end', function () {
      ended = true
    })

    eos(r, function (err) {
      t.ok(err, 'had error')
      t.notOk(ended)
      t.end()
    })

    r.push('hello')
    r.push(null)
    r.resume()
    r.destroy()
  })

  tape(name + ' writable', function (t) {
    const w = new stream.Writable()
    let finished = false

    w.on('finish', function () {
      finished = true
    })

    eos(w, function (err) {
      t.error(err, 'no error')
      t.ok(finished)
      t.end()
    })

    w.write('hello')
    w.end()
  })

  tape(name + ' writable destroy', function (t) {
    const w = new stream.Writable()
    let finished = false

    w.on('finish', function () {
      finished = true
    })

    eos(w, function (err) {
      t.ok(err, 'had error')
      t.notOk(finished)
      t.end()
    })

    w.write('hello')
    w.end()
    w.destroy()
  })

  tape(name + ' duplex', function (t) {
    const s = new stream.Duplex()
    let ended = false
    let finished = false

    s.on('end', () => { ended = true })
    s.on('finish', () => { finished = true })

    eos(s, function (err) {
      t.error(err, 'no error')
      t.ok(ended)
      t.ok(finished)
      t.end()
    })

    s.push('hello')
    s.push(null)
    s.resume()
    s.end()
  })

  tape(name + ' duplex + deferred s.end()', function (t) {
    const s = new stream.Duplex()
    let ended = false
    let finished = false

    s.on('end', function () {
      ended = true
      setImmediate(() => s.end())
    })

    s.on('finish', () => { finished = true })

    eos(s, function (err) {
      t.error(err, 'no error')
      t.ok(ended)
      t.ok(finished)
      t.end()
    })

    s.push('hello')
    s.push(null)
    s.resume()
  })

  tape(name + ' duplex + deferred s.push(null)', function (t) {
    const s = new stream.Duplex()
    let ended = false
    let finished = false

    s.on('finish', function () {
      finished = true
      setImmediate(() => s.push(null))
    })

    s.on('end', () => { ended = true })

    eos(s, function (err) {
      t.error(err, 'no error')
      t.ok(ended)
      t.ok(finished)
      t.end()
    })

    s.push('hello')
    s.end()
    s.resume()
  })

  tape(name + ' duplex destroy', function (t) {
    const s = new stream.Duplex()
    let ended = false
    let finished = false

    s.on('end', () => { ended = true })
    s.on('finish', () => { finished = true })

    eos(s, function (err) {
      t.ok(err, 'had error')
      t.notOk(ended)
      t.notOk(finished)
      t.end()
    })

    s.push('hello')
    s.push(null)
    s.resume()
    s.end()
    s.destroy()
  })
}
