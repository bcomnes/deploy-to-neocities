# async-neocities
[![Actions Status](https://github.com/bcomnes/async-neocities/workflows/tests/badge.svg)](https://github.com/bcomnes/async-neocities/actions)

WIP - nothing to see here

```
npm install async-neocities
```

## Usage

``` js
const path = require('path')
const Neocities = require('async-neocities')

async function deploySite () {
  const token = await Neocities.getKey('sitename', 'password')

  const client = new Neocities(token)

  console.log(await client.list()) // site files
  console.log(await client.info()) // site info

  return client.deploy(path.join(__dirname, './site-contents'))
}

deploySite.then(info => { console.log('done deploying site!') })
  .catch(e => { throw e })
```

## License

MIT
