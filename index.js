const core = require('@actions/core')
// const github = require('@actions/github')
// const Neocities = require('async-neocities')
const path = require('path')
const exec = require('child_process').exec

async function doDeploy () {
  // `who-to-greet` input defined in action metadata file
  const token = core.getInput('api-token')
  const distDir = core.getInput('dist-dir')
  const cleanup = core.getInput('cleanup')

  const time = (new Date()).toTimeString()
  core.setOutput('time', time)

  const client = new Neocities(token)

  console.log(process.cwd())
  console.log(path.join(process.cwd(), distDir))

  return new Promise((resolve, reject) => {
    exec('ls -la', (error, stdout, stderr) => {
      console.log(stdout)
      console.log(stderr)
      if (error !== null) {
        console.log(`exec error: ${error}`)
      }
      resolve()
    })
  })

  // return client.deploy()
}

doDeploy().then(() => {}).catch(err => {
  core.setFailed(err.message)
})
