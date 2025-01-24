---
"@getodk/xpath": patch
---

Choice list order randomization seed handling: better correspondence with JavaRosa behaviour,
including the addition of derivation of seeds from non-numeric inputs.
Previously, entering a non-integer in a form field seed input would result in an exception being thrown.
