---
'@getodk/xpath': patch
---

Round nanoseconds to nearest nano before calling BigInt to avoid RangeError when given a decimal
