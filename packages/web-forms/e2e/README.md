# E2E Tests for `@getodk/web-forms`

This directory contains end-to-end (E2E) tests for the `@getodk/web-forms` package, which powers form filling and submission editing of ODK forms in a web browser. These tests use [Playwright](https://playwright.dev/) to simulate user interactions and ensure the package works as expected in real-world scenarios.

## Folder Structure

The E2E tests are located in `packages/web-forms/e2e/`. Here's the structure and purpose of each directory:

```
e2e/
├── fixtures/         # Sample forms and data for testing.
├── page-objects/     # Page Object Model structure for e2e tests, organizing UI abstractions into pages and reusable controls.
    ├── controls/     # Reusable controls such as form fields, UI components, etc.
        ├── GeopointComponent.ts  # Example of a reusable control for the geopoint question type.
    ├── pages/        # Full page representations.
        ├── FormPage.ts           # Example of a full page representation for a form.
├── specs/            # Test specification files.
        ├── geopoint.test.ts      # Example of a test file for the geopoint question type.
```

### Key Components

- **Fixtures**: Reusable test data (e.g., sample XForms) to simulate real-world use cases. Add new forms here as needed.
- **Page Objects**: Implements the [Page Object Model (POM)](https://playwright.dev/docs/pom) pattern to encapsulate UI interactions, enhancing test readability and maintainability.
- **Specs**: Test files organized by feature (e.g., rendering, submission). Name new tests descriptively to reflect their coverage.

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

3. **Add new tests**
   - Create fixtures in `fixtures/` if needed.
   - Update or add Page Objects in `page-objects/` for new UI elements.
   - Write tests in `specs/` with descriptive names.

## Contributing

- Keep tests focused: one feature per file.
- Use POM methods in `pages-objects/` for UI actions.
- Add fixtures for new scenarios instead of hardcoding data.
