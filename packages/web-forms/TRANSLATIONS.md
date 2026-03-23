# Translations

## How it works

Translation strings are defined in `.i18n.json` files co-located with their components. At build time, these files are merged into `locales/strings_en.json`, which serves as the English baseline and is eagerly loaded at runtime. Translations for other locales are fetch from Transifex and then loaded lazily when the user switches language.

## Key naming convention

Keys follow a 3-part dot-separated pattern:

```
component.feature.type
```

- **component**: camelCase name of the Vue component that owns the string (e.g. `odkWebForm`)
- **feature**: the feature or section within that component (e.g. `submit`, `validation`)
- **type**: what kind of string it is. Use one of:
  - `label`: button or field label
  - `title`: heading or title
  - `placeholder`: input placeholder
  - `message`: informational message
  - `error`: error message

An easy way to remember: **who → where → kind** (which component? which feature? what type of string?).

### Examples

| Key                            | Description                 |
| ------------------------------ | --------------------------- |
| `odkWebForm.submit.label`      | Submit button label         |
| `odkWebForm.validation.error`  | Validation error banner     |

## Adding a string

1. Create or open the `.i18n.json` file next to the component.
2. Add an entry using the `component.feature.type` key convention:

```json
{
  "myComponent.someFeature.label": {
    "string": "English text here",
    "comment": "Context for translators: when and where this string appears."
  }
}
```

3. Run `build:translations` to regenerate `locales/strings_en.json`. This also runs automatically as part of the build.
4. Use the string in the component via `formatMessage({ id: 'myComponent.someFeature.label' })`.

## Developer comments

The `comment` optinal field is for translators. Explain:

- Where the string appears in the UI
- Any placeholders (e.g. `{count}` is the number of violations)
- Any constraints (e.g. keep it short, it appears on a button)
