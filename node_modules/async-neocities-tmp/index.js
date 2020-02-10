const assert = require('nanoassert')
const fetch = require('node-fetch')
const { URL } = require('url')
const qs = require('qs')
const os = require('os')
const path = require('path')
const { createReadStream } = require('fs')
const FormData = require('form-data')
const { handleResponse } = require('fetch-errors')
const afw = require('async-folder-walker')
const pkg = require('./package.json')
const { neocitiesLocalDiff } = require('./lib/folder-diff')

const defaultURL = 'https://neocities.org'

class NeocitiesAPIClient {
  static getKey (sitename, password, opts) {
    assert(sitename, 'must pass sitename as first arg')
    assert(typeof sitename === 'string', 'user arg must be a string')
    assert(password, 'must pass a password as the second arg')
    assert(typeof password, 'password arg must be a string')

    opts = Object.assign({
      baseURL: defaultURL
    }, opts)

    const baseURL = opts.baseURL
    delete opts.baseURL

    const url = new URL('/api/key', baseURL)
    url.username = sitename
    url.password = password
    return fetch(url, opts)
  }

  constructor (apiKey, opts) {
    assert(apiKey, 'must pass apiKey as first argument')
    assert(typeof apiKey === 'string', 'apiKey must be a string')
    opts = Object.assign({
      url: defaultURL
    })

    this.opts = opts
    this.url = opts.url
    this.apiKey = apiKey
  }

  get defaultHeaders () {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': `deploy-to-neocities/${pkg.version} (${os.type()})`
    }
  }

  /**
   * Generic get request to neocities
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
   * Generic post request to neocities
   */
  post (endpoint, formEntries, opts) {
    assert(endpoint, 'must pass endpoint as first argument')
    const form = new FormData()
    opts = Object.assign({
      method: 'POST',
      body: form
    }, opts)

    for (const { name, value } of formEntries) {
      form.append(name, value)
    }

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
  upload (files) {
    const formEntries = files.map(({ name, path }) => {
      return {
        name,
        value: createReadStream(path)
      }
    })

    return this.post('upload', formEntries).then(handleResponse)
  }

  /**
   * delete files from your website
   */
  delete (filenames) {
    assert(filenames, 'filenames is a required first argument')
    assert(Array.isArray(filenames), 'filenames argument must be an array of file paths in your website')

    const formEntries = filenames.map(file => ({
      name: 'filenames[]',
      value: file
    }))

    return this.post('delete', formEntries).then(handleResponse)
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
   * Deploy a folder to neocities, skipping already uploaded files and optionally cleaning orphaned files.
   * @param  {String} folder         The path of the folder to deploy.
   * @param  {Object} opts           Options object.
   * @param  {Boolean} opts.cleanup  Boolean to delete orphaned files nor not.  Defaults to false.
   * @param  {Boolean} opts.statsCb  Get access to stat info before uploading is complete.
   * @return {Promise}               Promise containing stats about the deploy
   */
  async deploy (folder, opts) {
    opts = {
      cleanup: false, // delete remote orphaned files
      statsCb: () => {},
      ...opts
    }
    const getRemoteFiles = this.list()
    const [localFiles, remoteFiles] = Promise.all([
      afw.allFiles(path.join(folder), { shaper: f => f }),
      getRemoteFiles
    ])

    const { filesToUpload, filesToDelete, filesSkipped } = await neocitiesLocalDiff(remoteFiles, localFiles)
    opts.statsCb({ filesToUpload, filesToDelete, filesSkipped })
    const work = []
    const uploadJob = this.upload(filesToUpload)
    work.push(uploadJob)
    if (opts.cleanup) {
      const deleteJob = this.delete(filesToDelete)
      work.push(deleteJob)
    }

    await work

    return { filesToUpload, filesToDelete, filesSkipped }
  }
}
module.exports = NeocitiesAPIClient
