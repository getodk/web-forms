---
"@getodk/scenario": patch
"@getodk/xforms-engine": patch
---

Several repeat-related fixes:

- Fix: most cases of inconsistent children state in Solid-based clients
- Fix: many cases of incomplete functionality on/within N > 1 repeat instances
- Fix: computation of bind states (`relevant` especially) before values, properly clear non-relevant default values
- Fix: timing inconsistency of some computations on init, adding repeat instances
- Fix: application of `relevant` state where expression is on repeat itself
