---
"@getodk/xpath": patch
---

Improved consistency with Collect/JavaRosa:


- `area` and `distance` handle a trailing semicolon in serialized semicolon-separated `geopoint` lists
- `distance` produces an error for invalid input
- `area` returns `0` for invalid input
