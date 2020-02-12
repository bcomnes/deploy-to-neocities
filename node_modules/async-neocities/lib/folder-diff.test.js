const afw = require('async-folder-walker')
const path = require('path')
const tap = require('tap')

const { neocitiesLocalDiff } = require('./folder-diff')

const remoteFiles = [
  {
    path: 'img',
    is_directory: true,
    updated_at: 'Thu, 21 Nov 2019 04:06:17 -0000'
  },
  {
    path: 'index.html',
    is_directory: false,
    size: 1094,
    updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
    sha1_hash: '7f15617e87d83218223662340f4052d9bb9d096d'
  },
  {
    path: 'neocities.png',
    is_directory: false,
    size: 13232,
    updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
    sha1_hash: 'fd2ee41b1922a39a716cacb88c323d613b0955e4'
  },
  {
    path: 'not_found.html',
    is_directory: false,
    size: 347,
    updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
    sha1_hash: 'd7f004e9d3b2eaaa8827f741356f1122dc9eb030'
  },
  {
    path: 'style.css',
    is_directory: false,
    size: 298,
    updated_at: 'Mon, 11 Nov 2019 22:23:16 -0000',
    sha1_hash: 'e516457acdb0d00710ab62cc257109ef67209ce8'
  }
]

tap.test('test differ', async t => {
  const localFiles = await afw.allFiles(path.join(__dirname, '../fixtures'), {
    shaper: f => f
  })

  const { filesToUpload, filesToDelete, filesSkipped } = await neocitiesLocalDiff(remoteFiles, localFiles)

  t.true(['tootzzz.png', 'toot.gif', 'cat.png'].every(path => {
    const found = filesToUpload.find(ftu => ftu.name === path)
    t.ok(found.path && found.name, 'each file to upload has a name and path')
    return found
  }), 'every file to upload is included')

  t.deepEqual(filesToDelete, [
    'not_found.html',
    'style.css'
  ], 'filesToDelete returned correctly')

  t.true(['neocities.png'].every(path => {
    const found = filesSkipped.find(fs => fs.relname === path)
    return found
  }), 'every file skipped is included')
})
