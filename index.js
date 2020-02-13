const core = require('@actions/core')
// const github = require('@actions/github')
const Neocities = require('async-neocities')
const path = require('path')
const prettyTime = require('pretty-time')
const assert = require('nanoassert')

async function doDeploy () {
  const token = core.getInput('apiToken')
  const distDir = path.join(process.cwd(), core.getInput('distDir'))
  const cleanup = JSON.parse(core.getInput('cleanup'))
  assert(typeof cleanup === 'boolean', 'Cleanup input must be a boolean "true" or "false"')
  console.log(typeof cleanup)

  const client = new Neocities(token)

  const stats = await client.deploy(distDir, {
    cleanup,
    statsCb: Neocities.statsHandler()
  })

  console.log(`Deployed to Neocities in ${prettyTime([0, stats.time])}:`)
  console.log(`    Uploaded ${stats.filesToUpload.length} files`)
  console.log(`    ${cleanup ? 'Deleted' : 'Orphaned'} ${stats.filesToDelete.length} files`)
  console.log(`    Skipped ${stats.filesSkipped.length} files`)
}

doDeploy().catch(err => {
  console.error(err)
  core.setFailed(err.message)
})
