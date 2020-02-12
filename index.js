const core = require('@actions/core')
// const github = require('@actions/github')
const Neocities = require('async-neocities')
const path = require('path')
const prettyTime = require('pretty-time')
const prettyBytes = require('pretty-bytes')

async function doDeploy () {
  const token = core.getInput('api-token')
  const distDir = path.join(process.cwd(), core.getInput('dist-dir'))
  const cleanup = core.getInput('cleanup')

  const client = new Neocities(token)

  const finalStats = await client.deploy(distDir, {
    cleanup,
    statsCb: statsHandler({ cleanup, distDir })
  })

  return finalStats
}

doDeploy().then((finalStats) => {}).catch(err => {
  core.setFailed(err.message)
})

function statsHandler (opts = {}) {
  return (stats) => {
    switch (stats.stage) {
      case 'inspecting': {
        switch (stats.status) {
          case 'start': {
            core.startGroup('Inspecting')
            console.log(`Inspecting local (${opts.distDir}) and remote files...`)
            break
          }
          case 'progress': {
            break
          }
          case 'stop': {
            console.log(`Done inspecting local and remote files in ${prettyTime([0, stats.timer.elapsed])}`)
            const { tasks: { localScan, remoteScan } } = stats
            console.log(`Scanned ${localScan.numberOfFiles} local files (${prettyBytes(localScan.totalSize)}) in ${prettyTime([0, localScan.timer.elapsed])}`)
            console.log(`Scanned ${remoteScan.numberOfFiles} remote files (${prettyBytes(remoteScan.totalSize)}) in ${prettyTime([0, remoteScan.timer.elapsed])}`)
            core.endGroup()
            break
          }
        }
        break
      }
      case 'diffing': {
        switch (stats.status) {
          case 'start': {
            core.startGroup('Diffing files')
            console.log('Diffing local and remote files...')
            break
          }
          case 'progress': {
            // No progress on diffing
            break
          }
          case 'stop': {
            const { tasks: { diffing } } = stats
            console.log(`Done diffing local and remote files in ${prettyTime([0, stats.timer.elapsed])}`)
            console.log(`${diffing.uploadCount} files to upload`)
            console.log(`${diffing.deleteCount} ` + opts.cleanup ? 'files to delete' : 'orphaned files')
            console.log(`${diffing.skipCoount} files to skip`)
            core.endGroup()
            break
          }
        }
        break
      }
      case 'applying': {
        switch (stats.status) {
          case 'start': {
            core.startGroup('Applying diff')
            console.log('Uploading changes' + opts.cleanup ? ' and deleting orphaned files...' : '...')
            break
          }
          case 'progress': {
            break
          }
          case 'stop': {
            const { tasks: { uploadFiles, deleteFiles, skippedFiles } } = stats
            console.log('Done uploading changes' + opts.cleanup ? ' and deleting orphaned files' : '' + ` in ${prettyTime([0, stats.timer.elapsed])}`)
            console.log(`Average upload speed: ${prettyBytes(uploadFiles.speed)}/s`)
            if (opts.cleanup) console.log(`Average delete speed: ${prettyBytes(deleteFiles.speed)}/s`)
            console.log(`Skipped ${skippedFiles.count} files (${prettyBytes(skippedFiles.size)})`)
            core.endGroup()
            break
          }
        }
        break
      }
      default: {
        console.log(stats)
      }
    }
  }
}
