const { handleResponse } = require('fetch-errors')
const { createReadStream } = require('fs')
const afw = require('async-folder-walker')
const FormData = require('form-data')
const assert = require('nanoassert')
const fetch = require('node-fetch')
const { URL } = require('url')
const qs = require('qs')
const os = require('os')

const { neocitiesLocalDiff } = require('./lib/folder-diff')
const pkg = require('./package.json')
const SimpleTimer = require('./lib/timer')
const { getStreamLength, meterStream } = require('./lib/stream-meter')

const defaultURL = 'https://neocities.org'

// Progress API constants
const START = 'start'
const PROGRESS = 'progress' // progress updates
const STOP = 'stop'
// Progress stages
const INSPECTING = 'inspecting'
const DIFFING = 'diffing'
const APPLYING = 'applying'

/**
 * NeocitiesAPIClient class representing a neocities api client.
 */
class NeocitiesAPIClient {
  /**
   * getKey returns an apiKey from a sitename and password.
   * @param  {String} sitename   username/sitename to log into.
   * @param  {String} password   password to log in with.
   * @param  {Object} [opts]     Options object.
   * @param  {Object} [opts.url=https://neocities.org]  Base URL to request to.
   * @return {Promise<String>}    An api key for the sitename..
   */
  static getKey (sitename, password, opts) {
    assert(sitename, 'must pass sitename as first arg')
    assert(typeof sitename === 'string', 'user arg must be a string')
    assert(password, 'must pass a password as the second arg')
    assert(typeof password, 'password arg must be a string')

    opts = Object.assign({
      url: defaultURL
    }, opts)

    const baseURL = opts.url
    delete opts.url

    const url = new URL('/api/key', baseURL)
    url.username = sitename
    url.password = password
    return fetch(url, opts)
  }

  /**
   * Create an async-neocities api client.
   * @param  {string} apiKey                             An apiKey to make requests with.
   * @param  {Object} [opts]                             Options object.
   * @param  {Object} [opts.url=https://neocities.org]   Base URL to make requests to.
   * @return {Object}                                    An api client instance.
   */
  constructor (apiKey, opts) {
    assert(apiKey, 'must pass apiKey as first argument')
    assert(typeof apiKey === 'string', 'apiKey must be a string')
    opts = Object.assign({
      url: defaultURL
    })

    this.url = opts.url
    this.apiKey = apiKey
  }

  get defaultHeaders () {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': `async-neocities/${pkg.version} (${os.type()})`
    }
  }

  /**
   * Generic GET request to neocities.
   * @param  {String} endpoint An endpoint path to GET request.
   * @param  {Object} [quieries] An object that gets added to the request in the form of a query string.
   * @param  {Object} [opts] Options object.
   * @param  {String} [opts.method=GET] The http method to use.
   * @param  {Object} [opts.headers] Headers to include in the request.
   * @return {Object} The parsed JSON from the request response.
   */
  get (endpoint, quieries, opts) {
    assert(endpoint, 'must pass endpoint as first argument')
    opts = Object.assign({
      method: 'GET'
    }, opts)
    opts.headers = Object.assign({}, this.defaultHeaders, opts.headers)

    let path = `/api/${endpoint}`
    if (quieries) path += `?${qs.stringify(quieries)}`

    const url = new URL(path, this.url)
    return fetch(url, opts)
  }

  /**
   * Low level POST request to neocities with FormData.
   * @param  {String} endpoint    The endpoint to make the request to.
   * @param  {Array.<{name: String, value: String}>} formEntries Array of form entries.
   * @param  {Object} [opts]        Options object.
   * @param  {String} [opts.method=POST] HTTP Method.
   * @param  {Object} [opts.headers]  Additional headers to send.
   * @return {Object}             The parsed JSON response object.
   */
  async post (endpoint, formEntries, opts) {
    assert(endpoint, 'must pass endpoint as first argument')
    assert(formEntries, 'must pass formEntries as second argument')

    function createForm () {
      const form = new FormData()
      for (const { name, value } of formEntries) {
        form.append(name, value)
      }

      return form
    }

    opts = Object.assign({
      method: 'POST',
      statsCb: () => {}
    }, opts)
    const statsCb = opts.statsCb
    delete opts.statsCb

    const stats = {
      totalBytes: await getStreamLength(createForm()),
      bytesWritten: 0
    }
    statsCb(stats)

    const form = createForm()

    opts.body = meterStream(form, bytesRead => {
      stats.bytesWritten = bytesRead
      statsCb(stats)
    })

    opts.headers = Object.assign(
      {},
      this.defaultHeaders,
      form.getHeaders(),
      opts.headers)

    const url = new URL(`/api/${endpoint}`, this.url)
    return fetch(url, opts)
  }

  /**
   * Upload files to neocities
   */
  upload (files, opts = {}) {
    opts = {
      statsCb: () => {},
      ...opts
    }
    const formEntries = files.map(({ name, path }) => {
      const streamCtor = (next) => next(createReadStream(path))
      streamCtor.path = path
      return {
        name,
        value: streamCtor
      }
    })

    return this.post('upload', formEntries, { statsCb: opts.statsCb }).then(handleResponse)
  }

  /**
   * delete files from your website
   */
  delete (filenames, opts = {}) {
    assert(filenames, 'filenames is a required first argument')
    assert(Array.isArray(filenames), 'filenames argument must be an array of file paths in your website')
    opts = {
      statsCb: () => {},
      ...opts
    }

    const formEntries = filenames.map(file => ({
      name: 'filenames[]',
      value: file
    }))

    return this.post('delete', formEntries, { statsCb: opts.statsCb }).then(handleResponse)
  }

  list (queries) {
    // args.path: Path to list
    return this.get('list', queries).then(handleResponse)
  }

  /**
   * info returns info on your site, or optionally on a sitename querystrign
   * @param  {Object} args Querystring arguments to include (e.g. sitename)
   * @return {Promise} Fetch request promise
   */
  info (queries) {
    // args.sitename: sitename to get info on
    return this.get('info', queries).then(handleResponse)
  }

  /**
   * Deploy a directory to neocities, skipping already uploaded files and optionally cleaning orphaned files.
   * @param  {String} directory      The path of the directory to deploy.
   * @param  {Object} opts           Options object.
   * @param  {Boolean} opts.cleanup  Boolean to delete orphaned files nor not.  Defaults to false.
   * @param  {Boolean} opts.statsCb  Get access to stat info before uploading is complete.
   * @return {Promise}               Promise containing stats about the deploy
   */
  async deploy (directory, opts) {
    opts = {
      cleanup: false, // delete remote orphaned files
      statsCb: () => {},
      ...opts
    }

    const statsCb = opts.statsCb
    const startDeployTime = Date.now()
    const totalTime = new SimpleTimer(startDeployTime)

    // Inspection stage stats initializer
    const inspectionStats = {
      stage: INSPECTING,
      status: START,
      timer: new SimpleTimer(startDeployTime),
      totalTime,
      tasks: {
        localScan: {
          numberOfFiles: 0,
          totalSize: 0,
          timer: new SimpleTimer(startDeployTime)
        },
        remoteScan: {
          numberOfFiles: 0,
          totalSize: 0,
          timer: new SimpleTimer(startDeployTime)
        }
      }
    }
    const sendInspectionUpdate = (status) => {
      if (status) inspectionStats.status = status
      statsCb(inspectionStats)
    }
    sendInspectionUpdate(START)

    // Remote scan timers
    const remoteScanJob = this.list()
    remoteScanJob.then(({ files }) => { // Comes in the form of a response object
      const { tasks: { remoteScan } } = inspectionStats
      remoteScan.numberOfFiles = files.length
      remoteScan.totalSize = files.reduce((accum, cur) => {
        return accum + cur.size || 0
      }, 0)
      remoteScan.timer.stop()
      sendInspectionUpdate(PROGRESS)
    })

    // Local scan timers and progress accumulator
    const localScanJob = progressAccum(
      afw.asyncFolderWalker(directory, { shaper: f => f })
    )
    async function progressAccum (iterator) {
      const localFiles = []
      const { tasks: { localScan } } = inspectionStats

      for await (const file of iterator) {
        localFiles.push(file)
        localScan.numberOfFiles += 1
        localScan.totalSize += file.stat.blksize
        sendInspectionUpdate(PROGRESS)
      }
      return localFiles
    }
    localScanJob.then(files => {
      const { tasks: { localScan } } = inspectionStats
      localScan.timer.stop()
      sendInspectionUpdate(PROGRESS)
    })

    // Inspection stage finalizer
    const [localFiles, remoteFiles] = await Promise.all([
      localScanJob,
      this.list().then(res => res.files)
    ])
    inspectionStats.timer.stop()
    sendInspectionUpdate(STOP)

    // DIFFING STAGE

    const diffingStats = {
      stage: DIFFING,
      status: START,
      timer: new SimpleTimer(Date.now()),
      totalTime,
      tasks: {
        diffing: {
          uploadCount: 0,
          deleteCount: 0,
          skipCount: 0
        }
      }
    }
    statsCb(diffingStats)

    const { tasks: { diffing } } = diffingStats
    const { filesToUpload, filesToDelete, filesSkipped } = await neocitiesLocalDiff(remoteFiles, localFiles)
    diffingStats.timer.stop()
    diffingStats.status = STOP
    diffing.uploadCount = filesToUpload.length
    diffing.deleteCount = filesToDelete.length
    diffing.skipCount = filesSkipped.length
    statsCb(diffingStats)

    const applyingStartTime = Date.now()
    const applyingStats = {
      stage: APPLYING,
      status: START,
      timer: new SimpleTimer(applyingStartTime),
      totalTime,
      tasks: {
        uploadFiles: {
          timer: new SimpleTimer(applyingStartTime),
          bytesWritten: 0,
          totalBytes: 0,
          get percent () {
            return this.totalBytes === 0 ? 0 : this.bytesWritten / this.totalBytes
          },
          get speed () {
            return this.bytesWritten / this.timer.elapsed
          }
        },
        deleteFiles: {
          timer: new SimpleTimer(applyingStartTime),
          bytesWritten: 0,
          totalBytes: 0,
          get percent () {
            return this.totalBytes === 0 ? 0 : this.bytesWritten / this.totalBytes
          },
          get speed () {
            return this.bytesWritten / this.timer.elapsed
          }
        },
        skippedFiles: {
          count: filesSkipped.length,
          size: filesSkipped.reduce((accum, file) => accum + file.stat.blksize, 0)
        }
      }
    }
    const sendApplyingUpdate = (status) => {
      if (status) applyingStats.status = status
      statsCb(applyingStats)
    }
    sendApplyingUpdate(START)

    const work = []
    const { tasks: { uploadFiles, deleteFiles } } = applyingStats

    if (filesToUpload.length > 0) {
      const uploadJob = this.upload(filesToUpload, {
        statsCb: ({ bytesWritten, totalBytes }) => {
          uploadFiles.bytesWritten = bytesWritten
          uploadFiles.totalBytes = totalBytes
          sendApplyingUpdate(PROGRESS)
        }
      })
      work.push(uploadJob)
      uploadJob.then(res => {
        uploadFiles.timer.stop()
        sendApplyingUpdate(PROGRESS)
      })
    } else {
      uploadFiles.timer.stop()
    }

    if (opts.cleanup && filesToDelete.length > 0) {
      const deleteJob = this.delete(filesToDelete, {
        statsCb: ({ bytesWritten, totalBytes }) => {
          deleteFiles.bytesWritten = bytesWritten
          deleteFiles.totalBytes = totalBytes
          sendApplyingUpdate(PROGRESS)
        }
      })
      work.push(deleteJob)
      deleteJob.then(res => {
        deleteFiles.timer.stop()
        sendApplyingUpdate(PROGRESS)
      })
    } else {
      deleteFiles.timer.stop()
    }

    await Promise.all(work)
    applyingStats.timer.stop()
    sendApplyingUpdate(STOP)

    totalTime.stop()

    const statsSummary = {
      time: totalTime,
      inspectionStats,
      diffingStats,
      applyingStats
    }

    return statsSummary
  }
}

module.exports = NeocitiesAPIClient
