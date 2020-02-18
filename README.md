# deploy-to-neocities

[![Actions Status](https://github.com/bcomnes/deploy-to-neocities/workflows/tests/badge.svg)](https://github.com/bcomnes/deploy-to-neocities/actions)

<center><img src="logo.png"></center>

Efficiently deploy a website to [Neocities][nc].

### Pre-requisites
Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

Get your sites API token and set a [secret][sec] called `NEOCITIES_API_TOKEN`.  Set the `api_token` input on your `deploy-to-neocities` action to `NEOCITIES_API_TOKEN`.

```
https://neocities.org/settings/{{sitename}}#api_key
```

During your workflow, generate the files you want to deploy to [Neocities][nc] into a `distDir` directory.  You can use any tools that can be installed or brought into the Github actions environment.

This `dist_dir` should be specified as the `distDir` input.  Once the build is complete, the `deploy-to-neocities` action will efficiently upload all new and all changed files to Neocities.  Any files on Neocities that don't exist in the `distDir` are considdered 'orphaned' files.  To destrucively remove these 'orphaned' files, set the `cleanup` input to `true`.

You most likely only want to run this on the `master` branch so that only changes commited to `master` result in website updates.

### Inputs

- `api_token` (**REQUIRED**): The api token for your [Neocities][nc] website to deploy to.
- `dist_dir`: The directory to deploy to [Neocities][nc]. Default: `public`.
- `cleanup`:  Boolean string (`true` or `false`).  If `true`, `deploy-to-neocities` will destructively delete files found on [Neocoties][nc] not found in your `dist_dir`.  Default: `false`.

### Outputs

None.

## See also

- [async-neocities](https://ghub.io/async-neocities): diffing engine used for action.
- [Neocities API Docs](https://neocities.org/api)
- [neocities/neocities-node](https://github.com/neocities/neocities-node): Node api

[qs]: https://ghub.io/qs
[nf]: https://ghub.io/node-fetch
[fd]: https://ghub.io/form-data
[nc]: https://neocities.org
[sec]: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
