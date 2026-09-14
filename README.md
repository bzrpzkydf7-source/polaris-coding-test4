# Polaris — Practice Software Testing Automation Suite

Automated UI and API test suite for [practicesoftwaretesting.com](https://practicesoftwaretesting.com/),
built for the SDET take-home coding challenge in [`docs/`](docs). Covers all four
user stories with both UI and API tests, plus a small set of API contract
tests and UI/API cross-checks as the optional extension.

## Frameworks & libraries

- **[Playwright Test](https://playwright.dev/)** (`@playwright/test`) — test runner, browser automation, and API testing (`APIRequestContext`), all from one framework/dependency.
- **TypeScript** — the whole suite, including API clients and models, is typed; no `any`.
- No other runtime dependencies. Test data is a static JSON fixture; there's no database or backend of our own.

## Project structure

```
POM/          Page objects — locators + low-level page actions, one class per screen
steps/        Higher-level flows composed from POM methods (login, purchase, browse-to-product…)
Api/          API client wrappers around Playwright's request fixture (one class per resource)
Models/       Shared TypeScript types: user/API interfaces, ProductCategory and HttpStatus enums
TestData/     JSON fixtures (seeded user credentials)
tests/        Specs — one file per user story, plus tests/api/ for pure API contract tests
docs/         The original coding challenge brief, BUGS.md, and a saved HTML report
```

Tests call **steps**, steps call **POM**/**Api** methods, POM/Api hold the actual locators and
requests. A test file never reaches for a raw locator or fetch call itself — that keeps a
selector or endpoint change to a one-file fix.

## Setup

```bash
npm install
npx playwright install          # downloads the Chromium/Firefox/WebKit browser binaries
```

## Running the tests

```bash
npm test                # everything: all four browser projects + the API project
npm run test:ui         # UI tests only, Chromium only (the fastest useful default)
npm run test:api        # API contract tests only — no browser, ~1 second
npm run test:headed     # UI tests with a visible browser window
npm run test:debug      # Playwright Inspector: step through a test, pause, edit locators live
npm run test:ui-mode    # Playwright's UI Mode: watch mode, time-travel through each step
npm run report          open the HTML report from the last run
```

These map to plain `npx playwright test` invocations under the hood — see
`package.json` — so any flag documented below also works prefixed with
`npx playwright test`.

### Running from VS Code

The [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
extension (Microsoft) picks up this project's config automatically. Once installed, the Testing
panel in the sidebar lists every spec/test individually — run or debug a single test with a
click, set breakpoints in step code, and it opens the trace viewer for a failure inline. It's the
same test runner as the CLI, so pass/fail results always agree; it's just a faster loop for local
iteration than reaching for `--grep`.

### Filtering by tag

Every test is tagged with the user story it covers (matching [`docs/sdet-coding-task 4.md`](docs/sdet-coding-task%204.md)),
and API tests are additionally tagged `@api`:

| Tag | Covers |
|---|---|
| `@story-1-view-product-details` | Story 1 — View Product Details |
| `@story-2-view-invoice-after-purchase` | Story 2 — View Invoice After Purchase |
| `@story-3-filter-products-and-pagination` | Story 3 — Filter Products and Pagination |
| `@story-4-update-account-profile` | Story 4 — Update Fields in Account Profile |
| `@api` | Pure API contract tests, and the UI tests with a UI/API consistency check woven in |

```bash
npx playwright test --grep @story-2-view-invoice-after-purchase   # just one story, any project
npx playwright test --grep @api                                    # every API-related test
npx playwright test --grep-invert @api                             # everything except API tests
```

`login.spec.ts` predates the per-story tagging convention (it's foundational login coverage
rather than tied to one numbered story) and is untagged, so it always runs unless explicitly
excluded by path.

### Switching between the main site and the buggy site

[`playwright.config.ts`](playwright.config.ts) sets `baseURL` for the UI projects. To run
against the intentionally-buggy variant instead, swap the comment:

```ts
use: {
    baseURL: 'https://practicesoftwaretesting.com/',
    // baseURL: 'https://with-bugs.practicesoftwaretesting.com/',
}
```

Every test in `tests/*.spec.ts` (not `tests/api/`) passes on the main site. Run against the
buggy site to reproduce the failures documented in [`docs/BUGS.md`](docs/BUGS.md) — do **not** "fix" the
tests to make them pass there; let them fail and read the diff between expected and actual.

The API project's `baseURL` (`https://api.practicesoftwaretesting.com`) is separate and isn't
affected by this toggle, since the buggy site doesn't have its own API host.

## How the suite is put together

- **Projects, not just browsers.** [`playwright.config.ts`](playwright.config.ts) defines four
  projects: `chromium`/`firefox`/`webkit` for UI, and a dedicated `api` project with its own
  `baseURL` pointed at the API host and its own `testDir` (`tests/api`). The UI projects
  `testIgnore` that folder, so API tests never triple up across three browser engines they don't
  need.
- **Fixtures, mixed per test.** Most tests use the `page` fixture; the API contract tests use
  `request`; the UI/API consistency tests (in `User Story 1 productDetails.spec.ts` and
  `User Story 2 purchaseInvoice.spec.ts`) use **both in the same test** — drive the UI, then hit
  the API for the same resource and assert they agree.
- **Auth reuse via `storageState`.** `User Story 4 accountProfile.spec.ts` logs in once in a `beforeAll`,
  persists the session to `playwright/.auth/customer3.json`, and two of its four tests start
  already authenticated via `test.use({ storageState })` instead of repeating the full UI login —
  the two tests that actually exercise the login flow itself still do the real thing.
- **Web-first assertions, not manual waits.** No `waitForTimeout` anywhere in the suite;
  `expect(locator).toHaveText(...)` etc. auto-retry until the UI (or an async validation/lookup/
  page-hydration call) settles, which is what actually made several flows reliable — see the
  inline comments in `POM/AccountProfilePage.ts` and `POM/CheckoutPage.ts` for two cases where
  that mattered. The account-profile one was a real bug hunt: a form that renders empty and is
  asynchronously patched from a `GET /users/me` response was racing against automated fills fast
  enough to fill it before the patch landed, silently discarding the fill — found by pausing a
  failing test live with `page.pause()` and inspecting the frozen page, not by guessing.
  Locators prefer `getByRole`/`getByTestId` over CSS, per Playwright's own guidance.
- **`test.step` throughout**, structured as Given/When/Then, so a failure's report line and trace
  both show which phase broke, not just which test.
- **Serial mode where it has to be.** `User Story 4 accountProfile.spec.ts` opts into
  `test.describe.configure({ mode: 'serial' })` because several of its tests share one real,
  externally-shared demo account (`customer3`'s credentials are published in the site's own
  README) — serial mode stops our own sessions from racing each other on it, though it can't
  protect against another person's test run hitting the same account at the same time.

## Debugging and replaying a run

- **`page.pause()` + the Playwright Inspector**, for driving a real, headed browser interactively
  and freezing it at an exact point to inspect the live DOM, network tab, or console — this is how
  the account-profile hydration race mentioned above was actually diagnosed: pausing the test
  right after a submit whose effect wasn't showing up, and looking at what the page honestly had
  in each field at that moment, rather than guessing from logs alone.
  ```bash
  npx playwright test "User Story 4 accountProfile.spec.ts" --headed --debug
  ```
- **HTML report** (`npm run report`, or auto-opened by CI as an artifact): every test, every
  `test.step`, screenshots and traces for failures, all in one browsable page.
- **Trace viewer**: `trace: 'on-first-retry'` is set in config, so any test that fails and
  retries captures a full trace — DOM snapshots, network, console, and an action-by-action
  timeline you can scrub through. Open one directly:
  ```bash
  npx playwright show-trace test-results/<test-folder>/trace.zip
  ```
  or click straight through from the HTML report. On CI, retries are enabled (`retries: 2`) and
  the report is uploaded as a build artifact specifically so a failure can be replayed after the
  fact rather than re-run blind.
- **UI Mode** (`npm run test:ui-mode`) — the same trace timeline, live, while iterating locally:
  time-travel through a running/failed test, pick a locator visually, watch mode on file save.
- **Codegen**, for exploring the app or drafting a new flow: `npx playwright codegen https://practicesoftwaretesting.com/`.

## CI/CD

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs the full suite
(`npx playwright test` — all four projects) on every push and pull request against `main`, and
uploads the HTML report as a build artifact regardless of outcome. Because it's a normal GitHub
Actions workflow, it runs the same way against any branch or PR — nothing about it is specific to
`main` beyond the trigger filter, so pointing it at a feature branch (or adding one) is a one-line
change to the `on:` block.

One thing worth knowing before relying on this in anger: `forbidOnly: !!process.env.CI` is
already set, so an accidentally-committed `.only` fails the build instead of silently skipping
everything else — no action needed there, just worth knowing it's on.

## Known issues & limitations

- **`GET /categories/tree` returns 3 top-level categories; `ProductCategory` has 5.** `Special
  Tools` and `Rentals` are top-nav sections, not entries in this endpoint's taxonomy —
  `tests/api/categories.spec.ts` asserts a subset match rather than full equality, with a comment
  explaining why.
- **DOB field validation is excluded**, per the brief's note that it has a known issue.
- **Product/category/brand IDs regenerate** when this demo site's catalog data is rebuilt (it
  appears to happen roughly daily). Tests never hardcode an ID for that reason — they're always
  looked up live by name (UI) or via a fresh search call (API).

## Bug reports & saved test report

See [`docs/BUGS.md`](docs/BUGS.md) for the defects found by running this suite against the
intentionally-buggy site, with repro steps and expected-vs-actual for each.

[`docs/index - practicesoftwaretesting.html`](docs/index%20-%20practicesoftwaretesting.html) is a
saved HTML report from a full run against the main site (all projects, 65/65 passing) — download
it and open it locally to browse, since GitHub won't render it inline. `npm run report` regenerates
a live one from your own latest run instead.
