const crypto = require('crypto')
const util = require('util')
const fs = require('fs')
const ppump = util.promisify(require('pump'))

/**
 * neocitiesLocalDiff returns an array of files to delete and update and some useful stats.
 */
async function neocitiesLocalDiff (neocitiesFiles, localListing, opts = {}) {
  opts = {
    ...opts
  }

  const localIndex = {}
  const ncIndex = {}

  const neoCitiesFiltered = neocitiesFiles.filter(f => !f.is_directory)
  neoCitiesFiltered.forEach(f => { ncIndex[f.path] = f }) // index
  const ncFiles = new Set(neoCitiesFiltered.map(f => f.path)) // shape

  const localListingFiltered = localListing.filter(f => !f.stat.isDirectory()) // files only
  localListingFiltered.forEach(f => { localIndex[f.relname] = f }) // index
  // TODO: convert windows to unix paths
  const localFiles = new Set(localListingFiltered.map(f => f.relname)) // shape

  const filesToAdd = difference(localFiles, ncFiles)
  const filesToDelete = difference(ncFiles, localFiles)

  const maybeUpdate = intersection(localFiles, ncFiles)
  const skipped = new Set()

  for (const p of maybeUpdate) {
    const local = localIndex[p]
    const remote = ncIndex[p]

    if (local.stat.size !== remote.size) { filesToAdd.add(p); continue }

    const localSha1 = await sha1FromPath(local.filepath)
    if (localSha1 !== remote.sha1_hash) { filesToAdd.add(p); continue }

    skipped.add(p)
  }

  return {
    filesToUpload: Array.from(filesToAdd).map(p => ({
      name: localIndex[p].relname,
      path: localIndex[p].filepath
    })),
    filesToDelete: Array.from(filesToDelete).map(p => ncIndex[p].path),
    filesSkipped: Array.from(skipped).map(p => localIndex[p])
  }
}

module.exports = {
  neocitiesLocalDiff
}

/**
 * sha1FromPath returns a sha1 hex from a path
 * @param  {String} p string of the path of the file to hash
 * @return {Promise<String>}   the hex representation of the sha1
 */
async function sha1FromPath (p) {
  const rs = fs.createReadStream(p)
  const hash = crypto.createHash('sha1')

  await ppump(rs, hash)

  return hash.digest('hex')
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations

/**
 * difference betwen setA and setB
 * @param  {Set} setA LHS set
 * @param  {Set} setB RHS set
 * @return {Set}      The difference Set
 */
function difference (setA, setB) {
  const _difference = new Set(setA)
  for (const elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

function intersection (setA, setB) {
  const _intersection = new Set()
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection
}

// [
//   {
//     path: 'img',
//     is_directory: true,
//     updated_at: 'Thu, 21 Nov 2019 04:06:17 -0000'
//   },
//   {
//     path: 'index.html',
//     is_directory: false,
//     size: 1094,
//     updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
//     sha1_hash: '7f15617e87d83218223662340f4052d9bb9d096d'
//   },
//   {
//     path: 'neocities.png',
//     is_directory: false,
//     size: 13232,
//     updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
//     sha1_hash: 'fd2ee41b1922a39a716cacb88c323d613b0955e4'
//   },
//   {
//     path: 'not_found.html',
//     is_directory: false,
//     size: 347,
//     updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
//     sha1_hash: 'd7f004e9d3b2eaaa8827f741356f1122dc9eb030'
//   },
//   {
//     path: 'style.css',
//     is_directory: false,
//     size: 298,
//     updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
//     sha1_hash: 'e516457acdb0d00710ab62cc257109ef67209ce8'
//   }
// ]

// [{
//   root: '/Users/bret/repos/async-folder-walker/fixtures',
//   filepath: '/Users/bret/repos/async-folder-walker/fixtures/sub-folder/sub-sub-folder',
//   stat: Stats {
//     dev: 16777220,
//     mode: 16877,
//     nlink: 3,
//     uid: 501,
//     gid: 20,
//     rdev: 0,
//     blksize: 4096,
//     ino: 30244023,
//     size: 96,
//     blocks: 0,
//     atimeMs: 1574381262779.8396,
//     mtimeMs: 1574380914743.5474,
//     ctimeMs: 1574380914743.5474,
//     birthtimeMs: 1574380905232.5996,
//     atime: 2019-11-22T00:07:42.780Z,
//     mtime: 2019-11-22T00:01:54.744Z,
//     ctime: 2019-11-22T00:01:54.744Z,
//     birthtime: 2019-11-22T00:01:45.233Z
//   },
//   relname: 'sub-folder/sub-sub-folder',
//   basename: 'sub-sub-folder'
// }]
