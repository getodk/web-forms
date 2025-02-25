# E2E Tests for `@getodk/web-forms`

This directory contains end-to-end (E2E) tests for the `@getodk/web-forms` package, which powers form filling and submission editing of ODK forms in a web browser. These tests use [Playwright](https://playwright.dev/) to simulate user interactions and ensure the package works as expected in real-world scenarios.

## Folder Structure

The E2E tests are located in `packages/web-forms/e2e/`. Here's the structure and purpose of each directory:

```
e2e/
├── fixtures/            # Sample forms and data for testing
├── page-objects/        # Page Object Models for reusable UI interactions
│   ├── form-page.js     # Methods for form-related actions
│   ├── preview-page.js  # Methods for the preview page related actions
├── specs/               # Test specification files
```

### Key Components

- **Fixtures**: Reusable test data (e.g., sample XForms) to simulate real-world use cases. Add new forms here as needed.
- **Page Objects**: Uses the [Page Object Model (POM)](https://playwright.dev/docs/pom) pattern to encapsulate UI interactions, making tests cleaner and easier to maintain.
- **Specs**: Test files organized by feature (e.g., rendering, submission). Name new tests descriptively to reflect what they cover.

## Getting Started

1. **Build the project**
   In the root folder run:

   ```bash
   yarn build
   ```

2. **Run tests**
   Execute all E2E tests:

   ```bash
    yarn workspace @getodk/web-forms test:e2e
   ```

   Or run specific tests:

   ```bash
   yarn workspace @getodk/web-forms test:e2e <filepath, e.g. e2e/specs/geopoint.test.ts>
   ```

3. **Add New Tests**
   - Create fixtures in `fixtures/` if needed.
   - Update or add Page Objects in `page-objects/` for new UI elements.
   - Write tests in `specs/` with descriptive names.

## Contributing

- Keep tests focused: one feature per file.
- Use POM methods in `pages-objects/` for UI actions.
- Add fixtures for new scenarios instead of hardcoding data.
