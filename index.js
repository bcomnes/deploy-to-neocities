import core from '@actions/core'
import {
  NeocitiesAPIClient,
  printDeployText,
  printPreviewText,
  printResultsErrorDump,
  SimpleTimer
} from 'async-neocities'
import path from 'node:path'
import assert from 'node:assert'
import fs from 'node:fs/promises'
import { minimatch } from 'minimatch'

async function run () {
  const key = core.getInput('api_key') || core.getInput('api_token')
  const distDir = path.join(process.cwd(), core.getInput('dist_dir'))
  const cleanup = JSON.parse(core.getInput('cleanup'))
  const neocitiesSupporter = JSON.parse(core.getInput('neocities_supporter'))
  const previewDeploy = JSON.parse(core.getInput('preview_before_deploy'))
  const protectedFilesGlob = core.getInput('protected_files')

  assert(typeof cleanup === 'boolean', '`cleanup` input must be a boolean "true" or "false"')
  assert(typeof neocitiesSupporter === 'boolean', '`neocities_supporter` input must be a boolean "true" or "false"')
  assert(typeof previewDeploy === 'boolean', '`preview_before_deploy` input must be a boolean "true" or "false"')

  const stat = await fs.stat(distDir)

  assert(stat.isDirectory(), '`dist_dir` input must be a path to a directory that exists')

  const client = new NeocitiesAPIClient(key)

  if (previewDeploy) {
    const previewTimer = new SimpleTimer()
    console.log('Running deploy preview prior to deployment...\n\n')

    const diff = await client.previewDeploy({
      directory: distDir,
      includeUnsupportedFiles: neocitiesSupporter,
      protectedFileFilter: protectedFilesGlob ? minimatch.filter(protectedFilesGlob) : undefined
    })

    previewTimer.stop()

    printPreviewText({
      diff,
      timer: previewTimer,
      cleanup,
      includeUnsupportedFiles: neocitiesSupporter
    })
  }

  const deployTimer = new SimpleTimer()
  console.log('Deploying to Neocities...')

  const results = await client.deploy({
    directory: distDir,
    cleanup,
    includeUnsupportedFiles: neocitiesSupporter,
    protectedFileFilter: protectedFilesGlob ? minimatch.filter(protectedFilesGlob) : undefined
  })

  deployTimer.stop()

  if (results.errors.length > 0) {
    printResultsErrorDump({
      results,
      timer: deployTimer
    })
    core.setFailed('The deploy completed with errors.')
  } else {
    printDeployText({
      results,
      timer: deployTimer,
      cleanup,
      includeUnsupportedFiles: neocitiesSupporter
    })
  }
}

run().catch(err => {
  console.log('Unexpected error/throw during deployment:\n\n')
  console.dir(err, { colors: true, depth: 999 })
  core.setFailed(err instanceof Error ? err.message : `An unexpected error occurred during deployment: ${err}`)
})
