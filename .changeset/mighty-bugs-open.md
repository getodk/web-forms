---
'@getodk/web-forms': patch
---

Added `max-characters` property to `InputNumeric` for `InputDecimal` and `InputInteger` to set maximum values.
Replaced PrimeVue's `InputNumeric` with `InputText` in `InputNumbersAppearance` for extra-long numbers, using regex to validate characters (digits, comma, dot, minus).
Refactored `InputNumeric` to use render key for UI refresh, simplifying code and fixing comma issue by setting min/max fractional digits to zero for integers.
