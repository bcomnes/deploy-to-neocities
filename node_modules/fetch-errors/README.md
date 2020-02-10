# fetch-errors
[![Actions Status](https://github.com/bcomnes/fetch-errors/workflows/tests/badge.svg)](https://github.com/bcomnes/fetch-errors/actions)

Error subclasses for Text and JSON `fetch` response bodies, and a `handleResponse` fuction to handle fetch responses cleanly.

```
npm install fetch-errors
```

## Usage

``` js
const {
  HTTPError,
  TextHTTPError,
  JSONHTTPError,
  handleResponse
} = require('fetch-errors');

window.fetch('https://api.github.com/users/bcomnes/repos')
  .then(handleResponse)
  .then(json => { console.log(json); })
  .catch(err => {
    switch (err.constructor) {
      case JSONHTTPError: {
        console.error(err.message);
        console.error(err.status);
        console.error(err.json);
        console.error(err.stack);
        break;
      }
      case TextHTTPError: {
        console.error(err.message);
        console.error(err.status);
        console.error(err.data);
        console.error(err.stack);
        break;
      }
      case HTTPError: {
        console.error(err.message);
        console.error(err.status);
        console.error(err.stack);
        break;
      }
      default: {
        console.error(err);
        break;
      }
    }
  });
```

## API

### `async handleResponse(response)`

Parse JSON or text bodies of [`fetch`][fetch] [`Response`][response] objects.  Intended for APIs that return JSON, but falls back to `response.text()` body reading when the `json` `Content-type` is missing.  If `response.ok`, returns a JS object (if JSON), or the text content of the response body.  Otherwise, returns a `JSONHTTPError` or `TextHTTPError`.   If if `response.json()` or `resonse.text()` will throw their [native error]() objects.

### `class HTTPError extends Error`

Additional error properties from Error

```js
{
  stack, // stack trace of error
  status // status code of response
}
```

### `class TextHTTPError extends HTTPError`

Additional error properties from HTTPError

```js
{
  data // data of text response
}
```

### `class JSONHTTPError extends HTTPError`

Additional error properties from HTTPError

```js
{
  json // json of a JSON response
}
```

### See also

- [netlify/micro-api-client](https://github.com/netlify/micro-api-client): These errors were extracted from netlify/micro-api-client for individual use.


## License

MIT

[response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
