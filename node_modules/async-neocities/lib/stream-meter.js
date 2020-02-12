const { Writable, Transform } = require('streamx')
const pump = require('pump')
const pumpify = require('pumpify')

function getStreamLength (readable) {
  let length = 0

  const dummyLoad = new Writable({
    write (data, cb) {
      length += data.length
      cb(null)
    }
  })

  return new Promise((resolve, reject) => {
    pump(readable, dummyLoad, (err) => {
      if (err) return reject(err)
      resolve(length)
    })
  })
}

function meterStream (readable, statsCb) {
  let bytesRead = 0
  const meter = new Transform({
    transform (data, cb) {
      bytesRead += data.length
      statsCb(bytesRead)
      cb(null, data)
    }
  })
  return pumpify(readable, meter)
}

module.exports = {
  getStreamLength,
  meterStream
}
