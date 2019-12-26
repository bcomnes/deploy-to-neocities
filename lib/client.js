const assert = require('nanoassert')
const fetch = require('node-fetch')
const { URL } = require('url')
const qs = require('qs')
const os = require('os')
const { createReadStream } = require('fs')
const FormData = require('form-data')
const { handleResponse } = require('fetch-errors')
const pkg = require('../package.json')

const defaultURL = 'https://neocities.org'

class NeocitiesAPIClient {
  static getKey (sitename, password, opts) {
    assert(sitename, 'must pass sitename as first arg')
    assert(typeof sitename === 'string', 'user arg must be a string')
    assert(password, 'must pass a password as the second arg')
    assert(typeof password, 'password arg must be a string')

    opts = Object.assign({
      url: defaultURL
    }, opts)

    return fetch()
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

  upload (files) {
    const formEntries = files.map(({ name, path }) => {
      return {
        name,
        value: createReadStream(path)
      }
    })

    return this.post('upload', formEntries).then(handleResponse)
  }

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
   * @param  {Object} args Querystring arguments to include
   * @return {Promise} Fetch request promise
   */
  info (queries) {
    // args.sitename: sitename to get info on
    return this.get('info', queries).then(handleResponse)
  }

  deploy (folder) {
    throw new Error('NOT IMPLEMENTED')
  }
}
module.exports = { NeocitiesAPIClient }
