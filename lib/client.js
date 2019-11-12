import assert from 'nanoassert';
import fetch from 'node-fetch';
import { URL } from 'url';
import qs from 'qs';
import pkg from '../package.json';
import os from 'os';

const defaultURL = 'https://neocities.org/api';

export class NeocitiesAPIClient {
  static getKey (sitename, password, opts) {
    assert(sitename, 'must pass sitename as first arg');
    assert(typeof sitename === 'string', 'user arg must be a string');
    assert(password, 'must pass a password as the second arg');
    assert(typeof password, 'password arg must be a string');

    opts = Object.assign({
      url: defaultURL
    }, opts);

    return fetch();
  }

  constructor (apiKey, opts) {
    assert(apiKey, 'must pass apiKey as first argument');
    assert(typeof apiKey === 'string', 'apiKey must be a string');
    opts = Object.assign({
      url: defaultURL
    });

    this.opts = opts;
    this.url = opts.url;
    this.apiKey = apiKey;
  }

  request (endpoint, args, opts) {
    assert(endpoint, 'must pass endpoint as first argument');
    opts = Object.assign({}, opts);
    opts.headers = Object.assign({
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'User-Agent': `deploy-to-neocities/${pkg.version} (${os.type()})`
    }, opts.headers);

    let path = `/api/${endpoint}`;
    if (args) path += `?${qs.stringify(args)}`;

    const url = new URL(path, this.url);
    return fetch(url, opts);
  }

  get (endpoint, args, opts) {
    opts = Object.assign({
      method: 'GET'
    }, opts);
    return this.request(endpoint, args, opts);
  }

  post (endpoint, args, opts) {
    opts = Object.assign({
      method: 'POST'
    }, opts);
    return this.request(endpoint, args, opts);
  }

  upload (files) {
    throw new Error('NOT IMPLEMENTED');
  }

  deploy (folder) {
    throw new Error('NOT IMPLEMENTED');
  }

  delete (filenames) {
    const args = {
      filenames
    };

    return this.post('/delete', args);
  }

  list (args) {
    // args.path: Path to list
    return this.get('/list', args).then(handleResponse);
  }

  /**
   * @param  {Object} args Querystring arguments to include
   * @return {Promise} Fetch request promise
   */
  info (args) {
    // args.sitename: sitename to get info on
    return this.get('/info', args).then(handleResponse);
  }
}

export async function handleResponse (response) {
  const contentType = response.headers.get('Content-Type');
  const isJSON = contentType && contentType.match(/json/);
  const data = isJSON ? await response.json() : await response.text();
  if (response.ok) return data;
  else {
    return isJSON
      ? Promise.reject(new JSONHTTPError(response, data))
      : Promise.reject(new TextHTTPError(response, data));
  }
}

export class HTTPError extends Error {
  constructor (response) {
    super(response.statusText);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(response.statusText).stack;
    }
    this.status = response.status;
  }
}

export class TextHTTPError extends HTTPError {
  constructor (response, data) {
    super(response);
    this.data = data;
  }
}

export class JSONHTTPError extends HTTPError {
  constructor (response, json) {
    super(response);
    this.json = json;
  }
}
