---
'@getodk/xforms-engine': minor
---

**BREAKING CHANGE**

The main engine entrypoint (formerly `initializeForm`) has been split into:

- `loadForm`, producing an intermediate result from which many instances of the same form can be created (with a `createInstance` method on that result)

- `createInstance`, a convenience wrapper composing the result from `loadForm` and its `createInstance` method to create a single instance; this entrypoint effectively restores the behavior of `initializeForm`

Some interfaces related to the former `initializeForm` have also been refined to reflect this change.
