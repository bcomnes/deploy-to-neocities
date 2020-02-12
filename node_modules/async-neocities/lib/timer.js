/**
 * Simple timer lets you record start and stop times, with an elapsed time getter.
 */
class SimpleTimer {
  constructor (startTime) {
    this.start = startTime || Date.now()
    this.end = null
    this.stopped = false
  }

  get elapsed () {
    if (this.stopped) {
      return this.end - this.start
    } else {
      return Date.now() - this.start
    }
  }

  stop () {
    if (this.stopped) return
    this.stopped = true
    this.end = Date.now()
  }

  toString () {
    return this.elapsed
  }

  toJSON () {
    return this.elapsed
  }
}

module.exports = SimpleTimer
