async function handleResponse (response) {
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

class HTTPError extends Error {
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

class TextHTTPError extends HTTPError {
  constructor (response, data) {
    super(response);
    this.data = data;
  }
}

class JSONHTTPError extends HTTPError {
  constructor (response, json) {
    super(response);
    this.json = json;
  }
}

module.exports = {
  handleResponse,
  HTTPError,
  TextHTTPError,
  JSONHTTPError
};
