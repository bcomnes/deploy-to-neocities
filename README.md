# deploy-to-neocities

[![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/bcomnes/deploy-to-neocities)](https://github.com/bcomnes/deploy-to-neocities)
[![Actions Status](https://github.com/bcomnes/deploy-to-neocities/workflows/tests/badge.svg)](https://github.com/bcomnes/deploy-to-neocities/actions)
[![Marketplace link](https://img.shields.io/badge/github%20marketplace-deploy--to--neocities-brightgreen)](https://github.com/marketplace/actions/deploy-to-neocities)

<center><img src="static/logo.png"></center>

Efficiently deploy a website to [Neocities][nc] using [Github actions](https://github.com/features/actions).

## Usage

```yaml
name: Deploy to neocities

# only run on changes to master
on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
    # Set up any tools and build steps here
    # This example uses a Node.js toolchain to build a site
    - name: Use Node.js
      uses: actions/setup-node@v1
      with:
        node-version: 12
    - name: Install deps and build
      run: |
        npm i
        npm run build
    # When the dist_dir is ready, deploy it to neocities
    - name: Deploy to neocities
      uses: bcomnes/deploy-to-neocities@v1
      with:
        api_token: ${{ secrets.NEOCITIES_API_TOKEN }}
        cleanup: false
        dist_dir: public
```

- 💻 [Example YML](.github/workflows/neocities.yml)
- 🌎 [Example Deploy](https://deploy-to-neocities.neocities.org)

Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

Get your sites API token and set a [secret][sec] called `NEOCITIES_API_TOKEN`.  Set the `api_token` input on your `deploy-to-neocities` action to `NEOCITIES_API_TOKEN`.

```
https://neocities.org/settings/{{sitename}}#api_key
```

During your workflow, generate the files you want to deploy to [Neocities][nc] into a `dist_dir` directory.  You can use any tools that can be installed or brought into the Github actions environment.

Once the build is complete, `deploy-to-neocities` will efficiently upload all new and all changed files to Neocities.  Any files on Neocities that don't exist in the `dist_dir` are considered 'orphaned' files.  To destructively remove these 'orphaned' files, set the `cleanup` input to `true`.

You most likely only want to run this on the `master` branch so that only changes committed to `master` result in website updates.  Running a test build that does not deploy on all branches and PRs can help catch changes that will break the build.

### Inputs

- `api_token` (**REQUIRED**): The API token for your [Neocities][nc] website to deploy to.
- `dist_dir`: The directory to deploy to [Neocities][nc]. Default: `public`.
- `cleanup`:  Boolean string (`true` or `false`).  If `true`, `deploy-to-neocities` will destructively delete files found on [Neocities][nc] not found in your `dist_dir`.  Default: `false`.

### Outputs

None.

## FAQ

### Why should I deploy to Neocities?

[Neocities][nc] offers a bunch of nice properties:

- Neocities CDN uses a pure [anycast](https://en.wikipedia.org/wiki/Anycast) network providing efficient content serving no matter where your visitors are located around the world.
- Anycast doesn't require special DNS records to achieve geolocation routing characteristics.  Simple `A` and `AAAA` records are all you need.
- Neocities owns its own [ARIN](https://en.wikipedia.org/wiki/American_Registry_for_Internet_Numbers) IP block and has its own [BGP](https://en.wikipedia.org/wiki/Border_Gateway_Protocol) peering agreements, eliminating entire layers of bureaucracy between your content and the rest of the Internet typical of all major cloud providers.
- Far faster cold cache access than other popular static hosting services.  Perfect for personal websites, projects and other infrequently accessed documents.
- Simple and understandable feature set.  You can hand upload and edit files along side built/deployed assets.
- First class IPv6 support.
- Fun, friendly, creative and organic community with an [interesting social network](https://neocities.org/browse).
- Independent, sustainable and altruistic service run by [@kyledrake](https://github.com/kyledrake/) and word on the street is that the service is profitable.
- [Affordable and predictable pricing](https://neocities.org/supporter).  There is a generous free tier and you can get custom domains and additional sites for $5/mo.
- Offers simple, Google-free site analytics.
- Makes accepting tips a breeze.
- Bring your own CI environment, or don't.
- Cute cat logo.
- [Support the distributed web](https://neocities.org/distributed-web). Built in IPFS support.
- [Beginner friendly docs](https://neocities.org/tutorials) for learning how to make your own websites.

### What are some of the drawbacks compared to Netlify/Zeit?

- Not appropriate for hyper traffic commercial sites most likely.
- No concept of a Deploy or atomicity when changing files.
- Most features of these services are not included. Neocities is just static file hosting and a few basic features around that.
- Doesn't offer support.
- No deploy previews.
- No Github Deploys API support (yet).


## See also

- [async-neocities](https://ghub.io/async-neocities): diffing engine used for action.
- [Neocities API Docs](https://neocities.org/api)
- [neocities/neocities-node](https://github.com/neocities/neocities-node): Official Node API

[qs]: https://ghub.io/qs
[nf]: https://ghub.io/node-fetch
[fd]: https://ghub.io/form-data
[nc]: https://neocities.org
[sec]: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
