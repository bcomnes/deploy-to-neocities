# async-folder-walker
[![Actions Status](https://github.com/bcomnes/async-folder-walker/workflows/tests/badge.svg)](https://github.com/bcomnes/async-folder-walker/actions)

A recursive async iterator of the files and directories in a given folder. Can take multiple folders, limit walk depth and filter based on path names and stat results.

![](https://repository-images.githubusercontent.com/223294839/43cf9600-0d3f-11ea-858e-81b08a14509f)

```
npm install async-folder-walker
```

## Usage

``` js
const { asyncFolderWalker, allFiles } = require('async-folder-walker')

async function iterateFiles () {
  const walker = asyncFolderWalker(['.git', 'node_modules'])
  for await (const file of walker) {
    console.log(file) // logs the file path!
  }
}

async function getAllFiles () {
  const allFilepaths = await allFiles(['.git', 'node_modules'])
  console.log(allFilepaths)
}

iterateFiles().then(() => getAllFiles())
```

## API

### `const { asyncFolderWalker, allFiles } = require('async-folder-walker')`

Import `asyncFolderWalker` or `allFiles`.

### `async-gen = asyncFolderWalker(paths, [opts])`

Return an async generator that will iterate over all of files inside of a directory. `paths` can be a string path or an Array of string paths.

You can iterate over each file and directory individually using a `for-await...of` loop.  Note, you must be inside an [async function statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

```js
const { asyncFolderWalker } = require('async-folder-walker');
async function iterateFiles () {
  const walker = asyncFolderWalker(['.git', 'node_modules']);
  for await (const file of walker) {
    console.log(file); // logs the file path!
  }
}

iterateFiles();
```

Opts include:

```js
{
  fs: require('fs'),
  pathFilter: filepath => true,
  statFilter st => true,
  maxDepth: Infinity,
  shaper: ({ root, filepath, stat, relname, basename }) => filepath
}
```

The `pathFilter` function allows you to filter files from additional async stat operations.  Return false to filter the file.

```js
{ // exclude node_modules
  pathFilter: filepath => !filepath.includes(node_modules)
}
```

The `statFilter` function allows you to filter files based on the internal stat operation.  Return false to filter the file.

```js
{ // exclude all directories:
  statFilter: st => !st.isDirectory()
}
```

The `shaper` function lets you change the shape of the returned value based on data accumulaed during the iteration.  To return the same shape as [okdistribute/folder-walker](https://github.com/okdistribute/folder-walker) use the following function:

```js
{ // Return the same shape as folder-walker
  shaper: fwData => fwData
}
````

Example of a fwData object for a directory:

```js
{
  root: '/Users/bret/repos/async-folder-walker/fixtures',
  filepath: '/Users/bret/repos/async-folder-walker/fixtures/sub-folder/sub-sub-folder',
  stat: Stats {
    dev: 16777220,
    mode: 16877,
    nlink: 3,
    uid: 501,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 30244023,
    size: 96,
    blocks: 0,
    atimeMs: 1574381262779.8396,
    mtimeMs: 1574380914743.5474,
    ctimeMs: 1574380914743.5474,
    birthtimeMs: 1574380905232.5996,
    atime: 2019-11-22T00:07:42.780Z,
    mtime: 2019-11-22T00:01:54.744Z,
    ctime: 2019-11-22T00:01:54.744Z,
    birthtime: 2019-11-22T00:01:45.233Z
  },
  relname: 'sub-folder/sub-sub-folder',
  basename: 'sub-sub-folder'
}
```

and another example for a file on windows:

```js
{
  root: 'D:\\a\\async-folder-walker\\async-folder-walker\\fixtures',
  filepath: 'D:\\a\\async-folder-walker\\async-folder-walker\\fixtures\\sub-folder\\sub-sub-folder\\sub-sub-folder-file.json',
  stat: Stats {
    dev: 1321874112,
    mode: 33206,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    blksize: 4096,
    ino: 562949953421580,
    size: 37,
    blocks: 0,
    atimeMs: 1577476819530.035,
    mtimeMs: 1577476819530.035,
    ctimeMs: 1577476819530.035,
    birthtimeMs: 1577476819530.035,
    atime: 2019-12-27T20:00:19.530Z,
    mtime: 2019-12-27T20:00:19.530Z,
    ctime: 2019-12-27T20:00:19.530Z,
    birthtime: 2019-12-27T20:00:19.530Z
  },
  relname: 'sub-folder\\sub-sub-folder\\sub-sub-folder-file.json',
  basename: 'sub-sub-folder-file.json'
}
```

The `stat` property is an instance of [fs.Stats](https://nodejs.org/api/fs.html#fs_class_fs_stats) so it has extra methods not listed here.

### `files = await allFiles(paths, [opts])`

Get an Array of all files inside of a directory.  `paths` can be a single string path or an array of string paths.

`opts` Is the same as `asyncFolderWalker`.

## See also

This module is effectivly a rewrite of [okdistribute/folder-walker](https://github.com/okdistribute/folder-walker) using async generators instead of Node streams, and a few tweaks to the underlying options to make the results a bit more flexible.

- [for-await...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

## License

MIT
