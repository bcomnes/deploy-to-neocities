const core = require('@actions/core')
// const github = require('@actions/github')
const Neocities = require('async-neocities')
const path = require('path')
const ms = require('ms')
const assert = require('webassert').default
const fsp = require('fs').promises
const { minimatch } = require('minimatch')
const { stackWithCauses } = require('pony-cause')

let cleanup

async function doDeploy () {
  const token = core.getInput('api_token')
  const distDir = path.join(process.cwd(), core.getInput('dist_dir'))
  cleanup = JSON.parse(core.getInput('cleanup'))
  const protectedFilesGlob = core.getInput('protected_files')

  assert(typeof cleanup === 'boolean', 'Cleanup input must be a boolean "true" or "false"')
  const stat = await fsp.stat(distDir)
  assert(stat.isDirectory(), 'dist_dir must be a directory that exists')

  const client = new Neocities(token)

  const deployOpts = {
    cleanup,
    statsCb: Neocities.statsHandler()
  }

  if (protectedFilesGlob) deployOpts.protectedFileFilter = minimatch.filter(protectedFilesGlob)

  const stats = await client.deploy(distDir, deployOpts)

  console.log(`Deployed to Neocities in ${ms(stats.time)}:`)
  console.log(`    Uploaded ${stats.filesToUpload.length} files`)
  console.log(`    ${cleanup ? 'Deleted' : 'Orphaned'} ${stats.filesToDelete.length} files`)
  console.log(`    Skipped ${stats.filesSkipped.length} files`)
  console.log(`    ${stats.protectedFiles.length} protected files:`)
  if (stats.protectedFiles.length) {
    console.log(stats.protectedFiles)
  }
}

doDeploy().catch(err => {
  console.error(stackWithCauses(err))
  if (err.stats) {
    console.log('Files to upload: ')
    console.dir(err.stats.filesToUpload, { colors: true, depth: 999 })

    if (cleanup) {
      console.log('Files to delete: ')
      console.dir(err.stats.filesToDelete, { colors: true, depth: 999 })
    }
  }

  core.setFailed(err.message)
})
