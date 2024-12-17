---
"@getodk/xpath": patch
---

Distance function can now accepts multiple arguments.
This makes it easier to compute the distance between multiple points within a form's primary instance.
Previously, to achieve this, you'd have to introduce a calculate which concatenates those points together,
and then call the distance function with a reference to that calculate as the argument.
