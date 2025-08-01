# ODK Web Forms

With ODK Web Forms, you can define forms with powerful logic using the spreadsheet-based [XLSForm standard](https://docs.getodk.org/xlsform/). Use [our Vue-based frontend](/packages/web-forms/) or build your own user experience around [the engine](/packages/xforms-engine/)!

You can try a preview [on the ODK website](https://getodk.org/web-forms-preview/). This gets updated nightly to reflect `main`.

> [!IMPORTANT]
> ODK Web Forms is currently pre-release. We don't yet guarantee that its interfaces are stable and it is missing many features that are available in XLSForm form definitions.

https://github.com/getodk/web-forms/assets/447837/9b25e1bc-d209-462c-8e9e-3259bd8c5aa6

## Project status

ODK Web Forms is developed by the [ODK team](https://getodk.org/).

The ODK Web Forms frontend is designed to provide a similar user experience to the [ODK Collect](https://play.google.com/store/apps/details?id=org.odk.collect.android) mobile data collection app. Our short-term goal is to use it to replace [Enketo](https://github.com/enketo/enketo/) in the [ODK Central form server](https://github.com/getodk/central) for web-based form filling and editing existing submissions.

Longer-term, we hope to use the engine to replace [JavaRosa](https://github.com/getodk/javarosa) to power ODK Collect, so that we can maintain a single correct and extensible form engine.

Here are some of our high-level priorities to get to a production-ready state:

- Adapt tests from JavaRosa and Enketo and get them passing to ensure alignment with the [ODK XForms spec](https://getodk.github.io/xforms-spec/)
- Implement all types and appearances defined in [XLSForm](https://xlsform.org/en/ref-table/)
- Define a thoughtful interface for host applications that balances ease of use and flexibility

### Feature matrix

This section is auto generated. Please update `feature-matrix.json` and then run `yarn feature-matrix` from the repository's root to update it.

<!-- autogen: feature-matrix -->

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Question types (basic functionality)<br/>🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 38\%

  </summary>
  <br/>

| Feature <img width=250px/> | Progress |
| -------------------------- | :------: |
| text                       |    ✅    |
| integer                    |    ✅    |
| decimal                    |    ✅    |
| note                       |    ✅    |
| select_one                 |    ✅    |
| select_multiple            |    ✅    |
| select\_\*\_from_file      |    ✅    |
| repeat                     |    ✅    |
| group                      |    ✅    |
| geopoint                   |    🚧    |
| geotrace                   |          |
| geoshape                   |          |
| start-geopoint             |          |
| range                      |    ✅    |
| image                      |    ✅    |
| barcode                    |          |
| audio                      |          |
| background-audio           |          |
| video                      |          |
| file                       |          |
| date                       |    🚧    |
| time                       |          |
| datetime                   |          |
| rank                       |    ✅    |
| csv-external               |    ✅    |
| acknowledge                |    🚧    |
| start                      |          |
| end                        |          |
| today                      |          |
| deviceid                   |          |
| username                   |          |
| phonenumber                |          |
| email                      |          |
| audit                      |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Appearances<br/>🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 33\%

  </summary>
  <br/>

| Feature <img width=250px/> | Progress |
| -------------------------- | :------: |
| numbers                    |    ✅    |
| multiline                  |    ✅    |
| url                        |          |
| ex:                        |          |
| thousands-sep              |    ✅    |
| bearing                    |          |
| vertical                   |          |
| no-ticks                   |          |
| picker                     |          |
| rating                     |          |
| new                        |          |
| new-front                  |          |
| draw                       |          |
| annotate                   |          |
| signature                  |          |
| no-calendar                |          |
| month-year                 |          |
| year                       |          |
| ethiopian                  |          |
| coptic                     |          |
| islamic                    |          |
| bikram-sambat              |          |
| myanmar                    |          |
| persian                    |          |
| placement-map              |          |
| maps                       |          |
| hide-input                 |          |
| minimal                    |    ✅    |
| search / autocomplete      |    ✅    |
| quick                      |          |
| columns-pack               |    ✅    |
| columns                    |    ✅    |
| columns-n                  |    ✅    |
| no-buttons                 |    ✅    |
| image-map                  |          |
| likert                     |    ✅    |
| map                        |          |
| field-list                 |    ✅    |
| label                      |    ✅    |
| list-nolabel               |    ✅    |
| list                       |    ✅    |
| counter                    |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Parameters<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 70\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                                       | Progress |
| -------------------------------------------------------------------------------------------------------------------------------- | :------: |
| randomize                                                                                                                        |    ✅    |
| seed                                                                                                                             |    ✅    |
| value                                                                                                                            |    ✅    |
| label                                                                                                                            |    ✅    |
| rows                                                                                                                             |    ✅    |
| geopoint capture-accuracy, warning-accur<br/>acy, allow-mock-accuracy                                                            |    ✅    |
| range start, end, step                                                                                                           |    ✅    |
| image max-pixels                                                                                                                 |          |
| audio quality                                                                                                                    |          |
| Audit: location-priority, location-min-i<br/>nterval, location-max-age, track-changes<br/>, track-changes-reasons, identify-user |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Form Logic<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 76\%

  </summary>
  <br/>

| Feature <img width=250px/> | Progress |
| -------------------------- | :------: |
| calculate                  |    ✅    |
| relevant                   |    ✅    |
| required                   |    ✅    |
| required message           |    ✅    |
| custom constraint          |    ✅    |
| constraint message         |    ✅    |
| read only                  |    ✅    |
| trigger                    |          |
| choice filter              |    ✅    |
| default                    |    ✅    |
| query parameter            |          |
| repeat_count               |    ✅    |
| create or update Entities  |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Descriptions and Annotations<br/>🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 21\%

  </summary>
  <br/>

| Feature <img width=250px/>                     | Progress |
| ---------------------------------------------- | :------: |
| label                                          |    ✅    |
| hint                                           |    ✅    |
| guidance hint                                  |          |
| form translations                              |    ✅    |
| form translations with ref to other fiel<br/>d |          |
| Markdown                                       |          |
| Inline HTML                                    |          |
| Form attachments                               |          |
| image                                          |    🚧    |
| big-image                                      |          |
| audio                                          |          |
| video                                          |          |
| secondary instance (last saved)                |          |
| autoplay                                       |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Theme and Layouts<br/>🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 18\%

  </summary>
  <br/>

| Feature <img width=250px/> | Progress |
| -------------------------- | :------: |
| grid                       |          |
| pages                      |          |
| logo                       |          |
| application translations   |          |
| theme color                |          |
| Submissions                |          |
| preview                    |    ✅    |
| send                       |    ✅    |
| view                       |          |
| edit                       |          |
| attachments                |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Offline capabilities<br/>⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0\%

  </summary>
  <br/>

| Feature <img width=250px/>   | Progress |
| ---------------------------- | :------: |
| List of projects & forms     |          |
| local persistence (single)   |          |
| save as draft                |          |
| offline entities             |          |
| MBtiles / offline map layers |          |
| Data encryption              |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### XPath<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 95\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                      | Progress |
| --------------------------------------------------------------------------------------------------------------- | :------: |
| operators                                                                                                       |    ✅    |
| predicates                                                                                                      |    ✅    |
| axes                                                                                                            |    ✅    |
| string(\* arg)                                                                                                  |    ✅    |
| concat(string arg*\|node-set arg*)                                                                              |    ✅    |
| join(string separator, node-set nodes\*)                                                                        |    ✅    |
| substr(string value, number start, numbe<br/>r end?)                                                            |    ✅    |
| substring-before(string, string)                                                                                |    ✅    |
| substring-after(string, string)                                                                                 |    ✅    |
| translate(string, string, string)                                                                               |    ✅    |
| string-length(string arg)                                                                                       |    ✅    |
| normalize-space(string arg?)                                                                                    |    ✅    |
| contains(string haystack, string needle)                                                                        |    ✅    |
| starts-with(string haystack, string need<br/>le)                                                                |    ✅    |
| ends-with(string haystack, string needle<br/>)                                                                  |    ✅    |
| uuid(number?)                                                                                                   |    ✅    |
| digest(string src, string algorithm, str<br/>ing encoding?)                                                     |    ✅    |
| pulldata(string instance_id, string desi<br/>red_element, string query_element, strin<br/>g query)              |          |
| if(boolean condition, _ then, _ else)                                                                           |    ✅    |
| coalesce(string arg1, string arg2)                                                                              |    ✅    |
| once(string calc)                                                                                               |    ✅    |
| true()                                                                                                          |    ✅    |
| false()                                                                                                         |    ✅    |
| boolean(\* arg)                                                                                                 |    ✅    |
| boolean-from-string(string arg)                                                                                 |    ✅    |
| not(boolean arg)                                                                                                |    ✅    |
| regex(string value, string expression)                                                                          |    ✅    |
| checklist(number min, number max, string<br/> v\*)                                                              |    ✅    |
| weighted-checklist(number min, number ma<br/>x, [string v, string w]\*)                                         |    ✅    |
| number(\* arg)                                                                                                  |    ✅    |
| random()                                                                                                        |    ✅    |
| int(number arg)                                                                                                 |    ✅    |
| sum(node-set arg)                                                                                               |    ✅    |
| max(node-set arg\*)                                                                                             |    ✅    |
| min(node-set arg\*)                                                                                             |    ✅    |
| round(number arg, number decimals?)                                                                             |    ✅    |
| pow(number value, number power)                                                                                 |    ✅    |
| log(number arg)                                                                                                 |    ✅    |
| log10(number arg)                                                                                               |    ✅    |
| abs(number arg)                                                                                                 |    ✅    |
| sin(number arg)                                                                                                 |    ✅    |
| cos(number arg)                                                                                                 |    ✅    |
| tan(number arg)                                                                                                 |    ✅    |
| asin(number arg)                                                                                                |    ✅    |
| acos(number arg)                                                                                                |    ✅    |
| atan(number arg)                                                                                                |    ✅    |
| atan2(number arg, number arg)                                                                                   |    ✅    |
| sqrt(number arg)                                                                                                |    ✅    |
| exp(number arg)                                                                                                 |    ✅    |
| exp10(number arg)                                                                                               |    ✅    |
| pi()                                                                                                            |    ✅    |
| count(node-set arg)                                                                                             |    ✅    |
| count-non-empty(node-set arg)                                                                                   |    ✅    |
| position(node arg?)                                                                                             |    ✅    |
| instance(string id)                                                                                             |    ✅    |
| current()                                                                                                       |    ✅    |
| randomize(node-set arg, number seed)                                                                            |    ✅    |
| today()                                                                                                         |    ✅    |
| now()                                                                                                           |    ✅    |
| format-date(date value, string format)                                                                          |    ✅    |
| format-date-time(dateTime value, string <br/>format)                                                            |    ✅    |
| date(\* value)                                                                                                  |    ✅    |
| decimal-date-time(dateTime value)                                                                               |    ✅    |
| decimal-time(time value)                                                                                        |    ✅    |
| selected(string list, string value)                                                                             |    ✅    |
| selected-at(string list, number index)                                                                          |    ✅    |
| count-selected(node node)                                                                                       |    ✅    |
| jr:choice-name(node node, string value)                                                                         |          |
| jr:itext(string id)                                                                                             |    ✅    |
| indexed-repeat(node-set arg, node-set re<br/>peat1, number index1, [node-set repeatN,<br/> number indexN]{0,2}) |    ✅    |
| area(node-set ns\|geoshape gs)                                                                                  |    ✅    |
| distance(node-set ns\|geoshape gs\|geotr<br/>ace gt\|(geopoint\|string) arg\*)                                  |    ✅    |
| base64-decode(base64Binary input)                                                                               |          |

</details>

<!-- /autogen: feature-matrix -->

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
- [Enketo](https://github.com/enketo/enketo) is an ODK XForms web form application that was maintained by the ODK team from 2021 to 2024.
- [XLSForm](https://github.com/xlsform/pyxform) is a standard for developing ODK XForms using spreadsheets.

### Outside the ODK ecosystem

- [Orbeon forms](https://www.orbeon.com/) is a web form system that uses the W3C XForms standard.
- [Fore](https://github.com/Jinntec/Fore) is an XForms-inspired framework for defining frontend applications.

## Contributing to the Project

Thank you for contributing! Follow these guidelines for smooth collaboration.

### Requirements

We use [Volta](https://volta.sh/) to ensure consistent `node` and `yarn` versions. Published packages are available [on NPM](https://www.npmjs.com/search?q=getodk).

### Running locally

To run ODK Web Forms from this repository:

```sh
yarn
yarn build
yarn workspace @getodk/web-forms dev
```

This repository uses yarn workspaces, so to run an npm script in any of the packages:

```sh
yarn workspace @getodk/<package-name> <script-name>
```

So instead of `cd packages/web-forms && yarn test`, run `yarn workspace @getodk/web-forms test`.

### Running tests

```sh
yarn
yarn build
TZ=America/Phoenix CI=true npx turbo run test --concurrency=1
```

### Packages

- [web-forms](/packages/web-forms): form-filling frontend built with Vue
- [xforms-engine](/packages/xforms-engine): implementation of the [ODK XForms specification](https://getodk.github.io/xforms-spec/)
- [xpath](/packages/xpath): XPath evaluator with ODK XForms extensions
- [scenario](/packages/scenario): engine client used to express tests on forms

### Naming convention

- Use `kebab-case` for folders, stylesheets, images, and JSON files.
- Use `PascalCase` for TypeScript or JavaScript files that primarily export a class or type.
  - For files with multiple exports use `kebab-case`.
- Use the same name as the component or file being tested for test files, with a `.test.ts` suffix.
  - Example: `InputText.test.ts`, `InitializeFormState.test.ts`

### Commit message

Consider using [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<issue>): <description>

<optional body>

<optional footer>
```

- **Type**: `feat`, `fix`, `docs`, `test`, `chore`, `perf`.
- **Issue**: Reference ticket (e.g., `#33`).
- **Description**: ≤50 chars, lowercase, present tense (e.g., `add geopoint input`).
- **Body**: List changes (e.g., `- add geopoint.xml`).
- **Footer**: Use `Co-authored-by: @<username>` for credits to another contributor.

**Example**:

```
feat(#33): add input components

- Add geopoint input in Vue
- Add XPath evaluator

Co-authored-by: @jane_doe
```

## Pull Requests

- **Squash and Merge:** After approval, and when possible "squash and merge" your PR to maintain a clean commit history.
- **Keep PRs Focused:** Break large changes into smaller, focused PRs to simplify review and reduce merge conflicts.
- **Code Style:** Adhere to the project's linting and formatting rules (e.g., ESLint, Prettier). Avoid skipping lint rules.
- **Testing:** Include unit and/or integration tests for new features or bug fixes.
- **PR Description:**
  - Reference related issues (e.g., Fixes #123).
  - Clearly describe the changes, their purpose, and any impact on existing functionality.
  - If applicable, include screenshot and videos of your testing.

Contact maintainers with questions. Happy contributing!

## Releases

If you'd like to try the functionality available on `main`, see the preview [on the ODK website](https://getodk.org/web-forms-preview/) which is updated daily. We try to release frequently and if there's functionality on `main` that you need but isn't released yet, please file an issue to request a release!

### Release process

1. Run `yarn changeset version` to generate changelog files and version bumps from the changeset files
1. Verify that the changelogs look good, commit changes, open a PR, merge the PR
1. Push tags for each package in the format `package@x.x.x`. A Github action will publish the packages on NPM
1. Update dependencies to kick off the new release cycle. We do this so that dependency updates get verified implicitly during development.
