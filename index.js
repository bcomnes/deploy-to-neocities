const core = require('@actions/core')
// const github = require('@actions/github')
const Neocities = require('async-neocities')
const path = require('path')
const exec = require('child_process').exec

async function doDeploy () {
  const token = core.getInput('api-token')
  const distDir = path.join(process.cwd(), core.getInput('dist-dir'))
  const cleanup = core.getInput('cleanup')

  const time = (new Date()).toTimeString()
  core.setOutput('time', time)

  const client = new Neocities(token)

  return client.deploy(distDir, {
    cleanup,
    statusCb: console.log
  })
}

doDeploy().then(() => {}).catch(err => {
  console.error(err)
  core.setFailed(err.message)
})
