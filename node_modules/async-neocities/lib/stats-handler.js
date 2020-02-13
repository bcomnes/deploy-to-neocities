const prettyBytes = require('pretty-bytes')

// Progress API constants
const START = 'start'
const PROGRESS = 'progress' // progress updates
const STOP = 'stop'
const SKIP = 'skip'

function statsHandler (opts = {}) {
  let progressInterval
  const lastStats = {}

  return (stats) => {
    switch (stats.status) {
      case START: {
        console.log(`Starting ${stats.stage} stage...`)
        break
      }
      case STOP: {
        console.log(`Finished ${stats.stage} stage.`)
        break
      }
      case SKIP: {
        console.log(`Skipping ${stats.stage} stage.`)
        break
      }
      case PROGRESS: {
        progressHandler(stats)
        break
      }
      default: {
      }
    }
  }

  function progressHandler (stats) {
    Object.assign(lastStats, stats)
    if (!stats.complete && stats.progress < 1) {
      if (!progressInterval) {
        progressInterval = setInterval(logProgress, 500, lastStats)
        logProgress(lastStats)
      }
    } else {
      if (progressInterval) clearInterval(progressInterval)
    }
  }

  function logProgress (stats) {
    let logLine = `Stage ${stats.stage}: ${stats.progress * 100}%`
    if (stats.bytesWritten != null && stats.totalBytes != null) {
      logLine = logLine + ` (${prettyBytes(stats.bytesWritten)} / ${prettyBytes(stats.totalBytes)})`
    }
    console.log(logLine)
  }
}

module.exports = statsHandler
