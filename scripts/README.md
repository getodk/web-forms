# Scripts

This directory contains utility scripts to support the **ODK Web Forms** project workflows, mostly run via Yarn.

## Overview

The folder includes scripts for:

- Updating the feature matrix
- Synchronizing dependency versions in `examples/*` folders to match workspace package versions

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- [Yarn](https://yarnpkg.com/) installed (the project uses Yarn as the package manager)

Install dependencies before running scripts:

```bash
yarn install
```

## Available Scripts

### `update-feature-matrix`

Updates the feature matrix data used by the project.

**Run:**

```bash
node feature-matrix/render.js
```

### `sync-examples-dependencies`

Updates the dependencies' versions in the `examples/*` folders to match the versions of the workspace packages.

**Usage:**

This script should be run **after** running:

```bash
yarn changeset version
```

so that the release pull request includes all the updated versions together.

**Run:**

```bash
node deps/update-example-versions.js
```

## Contributing

- When adding new scripts, please add an entry here with a description and usage instructions.
- Keep scripts consistent and well-documented.
