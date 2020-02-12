const fs = require('fs')
const { Writable, Readable } = require('../')

class FileWriteStream extends Writable {
  constructor (filename, mode) {
    super()
    this.filename = filename
    this.mode = mode
    this.fd = 0
  }

  _open (cb) {
    fs.open(this.filename, this.mode, (err, fd) => {
      if (err) return cb(err)
      this.fd = fd
      cb(null)
    })
  }

  _write (data, cb) {
    fs.write(this.fd, data, 0, data.length, null, (err, written) => {
      if (err) return cb(err)
      if (written !== data.length) return this._write(data.slice(written), cb)
      cb(null)
    })
  }

  _destroy (cb) {
    if (!this.fd) return cb()
    fs.close(this.fd, cb)
  }
}

class FileReadStream extends Readable {
  constructor (filename) {
    super()
    this.filename = filename
    this.fd = 0
  }

  _open (cb) {
    fs.open(this.filename, 'r', (err, fd) => {
      if (err) return cb(err)
      this.fd = fd
      cb(null)
    })
  }

  _read (cb) {
    let data = Buffer.alloc(16 * 1024)

    fs.read(this.fd, data, 0, data.length, null, (err, read) => {
      if (err) return cb(err)
      if (read !== data.length) data = data.slice(0, read)
      this.push(data.length ? data : null)
      cb(null)
    })
  }

  _destroy (cb) {
    if (!this.fd) return cb()
    fs.close(this.fd, cb)
  }
}

// copy this file as an example

const rs = new FileReadStream(__filename)
const ws = new FileWriteStream(`${__filename}.cpy`, 'w')

rs.pipe(ws, function (err) {
  console.log('file copied', err)
})
