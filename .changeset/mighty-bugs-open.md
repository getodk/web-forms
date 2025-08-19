---
'@getodk/web-forms': patch
---

Limit integer fields to 9 characters.
Limit decimal fields to 15 characters.
Remove character limit and add support for the `thousands-sep` appearance in string fields with `numbers` appearance.
Improve handling of extra-long numbers by switching to a more reliable input field.
Fix an issue where commas in integer fields could cause errors.
