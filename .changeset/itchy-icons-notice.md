---
"@getodk/scenario": minor
"@getodk/xforms-engine": minor
---

- Support tracking `current()` references in computations
- Support tracking references in computations where path references include predicates
- Improve support for repeat-based itemsets
- Improve relative path resolution across the board, fixing many computation update edge cases where expressions include complex path expressions
- Support relative `ref`/`nodeset` body attributes, as well as those with a `current()/` prefix
- Improve function call analysis in XPath expressions, particularly identification of functions called with no arguments
- Lay more mature foundation for general syntax analysis of XPath expressions
