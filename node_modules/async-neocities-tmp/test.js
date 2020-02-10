const tap = require('tap')

const { readFileSync } = require('fs')
const { resolve } = require('path')
const NeocitiesAPIClient = require('.')

let token = process.env.NEOCITIES_API_TOKEN
let fakeToken = false

if (!token) {
  try {
    const config = JSON.parse(readFileSync(resolve(__dirname, 'config.json')))
    token = config.token
    tap.test('token loaded', async t => {
      t.ok(token)
    })
  } catch (e) {
    console.warn('error loading config.json')
    console.warn('using fake token, live tests disabled')
    fakeToken = true
    token = '123456'
  }
}

tap.test('basic client api', async t => {
  const client = new NeocitiesAPIClient(token)

  t.ok(client.info, 'info method available')
  t.ok(client.list, 'list method available')
  t.ok(client.get, 'get method available')
  t.ok(client.post, 'post method available')
})

if (!fakeToken) {
  tap.test('can get info about site', async t => {
    const client = new NeocitiesAPIClient(token)

    const info = await client.info()
    // console.log(info)
    t.equal(info.result, 'success', 'info requesst successfull')
    const list = await client.list()
    // console.log(list)
    t.equal(list.result, 'success', 'list result successfull')
  })

  // test('form data works the way I think', t => {
  //   const form = new FormData();
  //   const p = resolve(__dirname, 'package.json');
  //   form.append('package.json', next => next(createReadStream(p)));
  //
  //   const concatStream = concat((data) => {
  //     console.log(data);
  //     t.end();
  //   });
  //
  //   form.on('error', (err) => {
  //     t.error(err);
  //   });
  //   form.pipe(concatStream);
  // });

  tap.test('can upload and delete files', async t => {
    const client = new NeocitiesAPIClient(token)

    const uploadResults = await client.upload([
      {
        name: 'toot.gif',
        path: resolve(__dirname, 'fixtures/toot.gif')
      },
      {
        name: 'img/tootzzz.png',
        path: resolve(__dirname, 'fixtures/tootzzz.png')
      }
    ])

    // console.log(uploadResults)
    t.equal(uploadResults.result, 'success', 'list result successfull')

    const deleteResults = await client.delete([
      'toot.gif',
      'img/tootzzz.png'
    ])
    // console.log(deleteResults)
    t.equal(deleteResults.result, 'success', 'list result successfull')
  })
}
