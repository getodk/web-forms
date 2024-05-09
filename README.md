# ODK Web Forms

With ODK Web Forms, you can define forms with powerful logic using the spreadsheet-based [XLSForm standard](https://docs.getodk.org/xlsform/). Use [our Vue-based frontend](/packages/ui-vue/) or build your own user experience around [the engine](/packages/xforms-engine/)!

> [!IMPORTANT]
> ODK Web Forms is currently pre-release. We don't yet guarantee that its interfaces are stable and it is missing many features that are available in XLSForm form definitions.




https://github.com/getodk/web-forms/assets/447837/9b25e1bc-d209-462c-8e9e-3259bd8c5aa6



## Packages

> [!NOTE]
> Comprehensive usage and development instructions are coming soon! For now, you can see each package's README. Please be sure to run `yarn` commands from the project root.

- [ui-vue](/packages/ui-vue): form-filling frontend built with Vue
- [xforms-engine](/packages/xforms-engine): implementation of the [ODK XForms specification](https://getodk.github.io/xforms-spec/)
- [xpath](/packages/xpath): XPath evaluator with ODK XForms extensions
- [scenario](/packages/scenario): engine client used to express tests on forms
- [ui-solid](/packages/ui-solid): form-filling frontend built with Solid, likely not as up-to-date as the Vue client

## Project status

ODK Web Forms is developed by the [ODK team](https://getodk.org/).

The ODK Web Forms frontend is designed to provide a similar user experience to the [ODK Collect](https://play.google.com/store/apps/details?id=org.odk.collect.android) mobile data collection app. Our short-term goal is to use it to replace [Enketo](https://github.com/enketo/enketo/) in the [ODK Central form server](https://github.com/getodk/central) for web-based form filling and editing existing submissions.

Longer-term, we hope to use the engine to replace [JavaRosa](https://github.com/getodk/javarosa) to power ODK Collect, so that we can maintain a single correct and extensible form engine.

Here are some of our high-level priorities to get to a production-ready state:

- Adapt tests from JavaRosa and Enketo and get them passing to ensure alignment with the [ODK XForms spec](https://getodk.github.io/xforms-spec/)
- Implement all types and appearances defined in [XLSForm](https://xlsform.org/en/ref-table/)
- Define a thoughtful interface for host applications that balances ease of use and flexibility

We welcome discussion about the project [on the ODK forum](https://forum.getodk.org/)! The forum is generally the preferred place for questions, issue reports, and feature requests unless you have information to add to an existing issue.

## Q&A

### Why not evolve [Enketo](https://github.com/enketo/enketo/)?

Enketo is critical infrastructure for a number of organizations and used in many different ways. As its maintainer, we found deeper changes to be challenging because they often led to regressions, many times in functionality that we don't use ourselves. We hope that the narrower scope of ODK Web Forms (in particular, no transformation step and no standalone service) will allow us to iterate quickly and align more closely with Collect while allowing organizations that have built infrastructure around Enketo to continue using it as they prefer.

### What will happen to [Enketo](https://github.com/enketo/enketo/)?

We are committed to continuing its maintenance through the end of 2024. We are actively seeking new maintainers and will offer some transitional support.

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

### When are you going to add XYZ?

If there's specific functionality you're eager to see, please let us know [on the ODK forum](https://forum.getodk.org/). You can see what we're currently prioritizing on [the project board](https://github.com/orgs/getodk/projects/10/views/1) and the [ODK roadmap](https://getodk.org/roadmap).

### The default theme looks very... gray. Will I be able to customize it?

We will be adding color and more styling soon. We intend to expose a way to do basic theming as well as a no-styles option to let advanced users define their own styling.

## Related projects

### In the ODK ecosystem

- [JavaRosa](https://github.com/getodk/javarosa) is the reference implementation for [ODK XForms](https://getodk.github.io/xforms-spec/). It powers the [Collect mobile application](https://github.com/getodk/collect/).
- [Enketo](https://github.com/enketo/enketo) is an ODK XForms web form application that has been maintained by the ODK team since 2021.
- [XLSForm](https://github.com/xlsform/pyxform) is a standard for developing ODK XForms using spreadsheets.

### Outside the ODK ecosystem

- [Orbeon forms](https://www.orbeon.com/) is a web form system that uses the W3C XForms standard.
- [Fore](https://github.com/Jinntec/Fore) is an XForms-inspired framework for defining frontend applications.
