---
"@getodk/xforms-engine": minor
---

The `xf:distance` XPath function now accepts multiple arguments. This makes it easier to compute the distance between multiple points within a form's primary instance. Previously, to achieve this, you'd have to introduce a `calculate` which concatenates those points together, then call the distance function with a reference to that `calculate` as the argument.
