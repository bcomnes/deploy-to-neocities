# Contributing

## Development requirements

This project requires Node.js 24 or newer and npm 11 or newer.

Install dependencies and run the test suite with:

```console
npm i
npm test
```

The test suite includes linting, TypeScript checking, and Node's built-in test coverage. Changes to the action implementation should also rebuild the checked-in bundle:

```console
npm run build
```

The generated `dist/` directory is part of the GitHub Action and must be included in commits that change the action or its dependencies.

## Releasing

Changelog and release preparation are automated with `releasearoni`. Releases are published by the **Version and Release** GitHub Actions workflow:

- Ensure the change is merged into the default branch.
- Use the workflow's version inputs to select the release type.
- The workflow runs the test suite, updates the version and changelog, rebuilds the action bundle, creates the GitHub release, publishes the package, and maintains the `v3` major-version branch.

The release workflow invokes `npm run release`, which runs `releasearoni --no-npm-check --major-branch` for this GitHub Action package.

## Guidelines

- Patches, ideas, and changes are welcome.
- Features should be discussed in an issue before substantial implementation work begins.
- Keep changes consistent with the existing style.
- Add or update tests for changed behavior.
- Keep the checked-in `dist/` bundle synchronized with the source.
- Run `npm test` and `npm run build` before opening a pull request.
