# ODK Web Forms

With ODK Web Forms, you can define forms with powerful logic using the spreadsheet-based [XLSForm standard](https://docs.getodk.org/xlsform/). Use [our Vue-based frontend](/packages/web-forms/) or build your own user experience around [the engine](/packages/xforms-engine/)!

The packages are available [on npm](https://www.npmjs.com/search?q=getodk).

> [!WARNING]
> This repository is archived

Development of ODK Web Forms has moved to the [ODK Central Frontend](https://github.com/getodk/central-frontend) repository. This allows us to write end-to-end tests that cover the full form-filling experience, which speeds up development and helps us catch regressions early. We timed this change to coincide with Web Forms becoming the default for new forms in ODK Central.

We continue to publish the following packages to npm:

- [`@getodk/web-forms`](https://www.npmjs.com/package/@getodk/web-forms) — Vue component for form filling
- [`@getodk/xforms-engine`](https://www.npmjs.com/package/@getodk/xforms-engine) — XForms engine
- [`@getodk/xpath`](https://www.npmjs.com/package/@getodk/xpath) — XPath evaluator with ODK XForms extensions
- [`@getodk/tree-sitter-xpath`](https://www.npmjs.com/package/@getodk/tree-sitter-xpath) — XPath grammar for tree-sitter

**For fork maintainers:** if you maintain a fork of this repository or of Central Frontend with local changes, you should be able to migrate those changes without manually recreating moved files. We recommend planning your update after the Central v2026.2 release in June 2026. For more details and guidance, see the [announcement on the ODK forum](https://forum.getodk.org/t/migrating-web-forms-code-to-central-frontend-repository/58177).

### Feature matrix

The Feature Matrix has moved. View the updated version [here](https://github.com/getodk/central-frontend/tree/master/packages/web-forms#feature-matrix).

## Q&A

### Why not evolve [Enketo](https://github.com/enketo/enketo/)?

Enketo is critical infrastructure for a number of organizations and used in many different ways. As its maintainer, we found deeper changes to be challenging because they often led to regressions, many times in functionality that we don't use ourselves. We hope that the narrower scope of ODK Web Forms (in particular, no transformation step and no standalone service) will allow us to iterate quickly and align more closely with Collect while allowing organizations that have built infrastructure around Enketo to continue using it as they prefer.

### Why not build a web frontend around [JavaRosa](https://github.com/getodk/javarosa/)?

After many years of maintaining JavaRosa and a few maintaining Enketo, we have learned a lot about how we'd like to structure an ODK XForms engine to isolate concerns and reduce the risk of regressions. We believe a fresh start will give us an opportunity to build strong patterns that will allow for a faster development pace with fewer bugs and performance issues.

### Why use web technologies?

There exist more and more ways to run code written with web technologies in different environments and web technologies continue to increase in popularity. We believe this choice will give us a lot of flexibility in how these packages can be used.

### Why have a strong separation between the form engine and its frontend?

We aspire to use the engine to drive other kinds of frontends such as test runners and eventually mobile applications. Additionally, our experience maintaining JavaRosa and Enketo suggests that blurring the engine/frontend line can be the cause of many surprising bugs that are hard to troubleshoot.

### Why Vue and PrimeVue?

Vue powers [Central frontend](https://github.com/getodk/central-frontend/) where it has served us well. For Web Forms, we've selected to use a component library to help us build a consistent, accessible, and user-friendly experience in minimal time. We chose PrimeVue for its development pace, approach to extensibility, and dedication to backwards compatibility.

### Why not use browsers' XPath parser and evaluator (e.g. [Enketo's wrapper around them](https://github.com/enketo/enketo/tree/main/packages/openrosa-xpath-evaluator))?

We want to be able to use this code in browsers but also in backends and eventually wrapped by mobile applications. Taking control of XPath evaluation gives us more portability and also has the advantage of giving us the opportunity to make targeted performance improvements.

### Why not build an engine that operates directly on XLSForms?

While XLSForm is a powerful form authoring format, it doesn't have clearly defined engine semantics or a formal specification. An XLSForm engine would have to refer to the underlying ODK XForms specification for much of its behavior and represent the form in a way that's appropriate for XPath querying.

### Why move development to Central Frontend?

Developing Web Forms inside Central Frontend allows us to write end-to-end tests covering the full form-filling experience in its primary distribution environment. This speeds up development and helps us catch regressions early. See the [announcement on the ODK forum](https://forum.getodk.org/t/migrating-web-forms-code-to-central-frontend-repository/58177) for more details.
