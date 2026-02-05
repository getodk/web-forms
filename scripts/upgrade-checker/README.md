## Upgrade checker

This script is designed to test forms submitted with other xforms engines to see if the web-forms/xforms-engine can load the submissions, and edit them to produce the same xml.

WARNING: This should not be merged into main - it's a short lived branch that can be deleted once compatibility has been verified. The code is not production quality.

### Setup

1. Checkout this branch
2. Run `yarn && yarn build`

### Downloading forms

Run the script which will prompt for the server, login email, and password. This downloads forms, submissions, and attachments to the `.upgrade-checker-cache` in the web-forms root directory.

```sh
node index.js
```

The cache directory must be manually deleted before testing the next server.

### Running tests

Now run the test suite over the cached forms.

```sh
cd packages/scenario
npx vitest test/upgrade.test.ts --silent=false --passWithNoTests
```
