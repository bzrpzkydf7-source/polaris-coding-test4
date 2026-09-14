# Bug Report Summary

Found by running the automated suite against the intentionally-buggy site
(`https://with-bugs.practicesoftwaretesting.com/`, set via `baseURL` in
[playwright.config.ts](../playwright.config.ts)) instead of the main site.

**Main site:** all 34 tests (`chromium` + `api` projects) pass cleanly — see
[main-site-report.html](main-site-report.html).

**Buggy site (permanent suite):** 15 failed, 7 did not run, 12 passed — see
[buggy-site-report/index.html](buggy-site-report/index.html) (a failed run's
HTML report references a `data/` folder of attachments, so this is the whole
report folder, not a single file, unlike the all-passing main-site report).
Tracing every failure back to its root cause gives **five distinct defects**
(Bugs 1–5 below), not fifteen — most of the blast radius comes from Bug 3
alone.

**Buggy site (temporary diagnostic):** the permanent suite's 7 "did not run"
tests meant User Story 4's actual subject — profile editing — had never
been exercised on this build at all, since Bob (the only account those tests
use) can't log in here (Bug 1). A throwaway diagnostic spec, logging in as
Jack instead, closed that blind spot and found three more defects (Bugs 6–8)
that the permanent suite structurally could not have reached.

`purchaseInvoice.spec.ts` and `accountProfile.spec.ts` deliberately run their
tests in order rather than in parallel, to protect their shared accounts from
racing each other (see the `test.describe.configure({ mode: 'default' })`
comment in each file) — `'default'` mode was chosen specifically because,
unlike `'serial'`, a failure in one test doesn't skip the rest of the file,
so every test still gets an independent result. The 7 that still don't run
are the tests inside `accountProfile.spec.ts`'s nested "reusing one
pre-authenticated session" describe: they depend on a `beforeAll` that logs
in as Bob to create a shared session file, and a failing `beforeAll` skips
the rest of its scope regardless of describe mode — expected, since there's
no valid session to test profile-editing against once Bug 1 blocks it.

Run with: `npx playwright test --project=chromium --project=api`
(swap `baseURL` back to `https://practicesoftwaretesting.com/` to confirm
these pass cleanly on the main site — the config here has been left pointed
at the main site).

---

## Bug 1: Login rejects valid credentials for a user with a non-default password

**Failing test:** [tests/login.spec.ts](../tests/login.spec.ts) —
`Login_withcustomer3Credentials_reachesExpectedLandingPage`

**Steps to reproduce:**
1. Go to `https://with-bugs.practicesoftwaretesting.com/auth/login`
2. Enter email `customer3@practicesoftwaretesting.com`, password `pass123`
   (Bob Smith — see [TestData/Users.json](../TestData/Users.json))
3. Submit the login form

**Expected:** Login succeeds and the user is redirected to `/account` (this
works on the main site with the same credentials).

**Actual:** The page reloads `/#/auth/login` and displays "Invalid email or
password". Every other seeded user (admin, customer, customer2 — all sharing
the password `welcome01`) logs in successfully. Bob is the only fixture user
with a different password, which points to a password-validation regression
specific to non-default passwords rather than a bad fixture.

Re-confirmed directly in-browser today, independent of the automated suite:
submitting Bob's real credentials on the buggy site's login form still shows
"Invalid email or password" and stays on `/auth/login`.

---

## Bug 2: Product image renders as a mislabeled placeholder

**Failing test:** [tests/User Story 1 productDetails.spec.ts](../tests/User%20Story%201%20productDetails.spec.ts) —
`ViewProductDetails_asLoggedInUser_showsNameDescriptionPriceImageAndEnabledAddToCart`

**Steps to reproduce:**
1. Log in and go to `https://with-bugs.practicesoftwaretesting.com/product/01M25C5M045X1K559GC86G4SK2`
   (Cordless Drill 20V), or navigate there via Categories → Power Tools → Cordless Drill 20V
2. Inspect the product image's accessible name (e.g. via a screen reader, or
   the browser's accessibility tree)

**Expected:** The image's accessible name (alt text) matches the product,
e.g. "Cordless Drill 20V" — as it does on the main site.

**Actual:** The alt text reads "A generic square placeholder image with
rounded corners in a figure." — a generic placeholder string, not the actual
product image/name. The element exists and occupies the same position, but
carries the wrong content and identity.

*Not independently re-verified in today's run* — the test that would exercise
this now fails earlier, at login, because it logs in as Bob and hits Bug 1
first. Included here from prior investigation; nothing suggests it's fixed.

---

## Bug 3: Logged-in account menu loses its documented test hook and shows broken text instead of the user's name

**Failing test:** [tests/login.spec.ts](../tests/login.spec.ts) —
`Logout_afterLogin_returnsToLoginPage`

**Steps to reproduce:**
1. Log in as admin (or any user)
2. Inspect the account menu button in the top navigation

**Expected:** The button carries `data-test="nav-menu"` and displays the
user's name (e.g. "John Doe"), as on the main site.

**Actual:** Login genuinely succeeds (URL redirects to `/#/admin/dashboard`
for admin, `/#/account` for others) with no error shown, but:
- The button's `data-test` has been **renamed to `nav-user-menu`**, not
  simply removed — any automation targeting the documented `nav-menu` hook
  (ours included — [POM/LoginPage.ts](../POM/LoginPage.ts)) cannot find it.
- Its visible label reads **"User Data not found"** instead of the logged-in
  user's actual name, for every account tested (admin and Jack/customer2).

The dropdown itself still opens and its items (`nav-my-profile`,
`nav-sign-out`, etc.) still work once you know to target `nav-user-menu`
instead — this is a broken hook and a broken display, not a broken feature.
It's still high-impact: this one bug accounts for most of today's UI test
failures, since `login()` waits on the old `nav-menu` hook to confirm a
session started, cascading into every UI test that begins by logging in —
including the first test in each of the two ordered-execution files
(`accountProfile.spec.ts`, `purchaseInvoice.spec.ts`), which is why the rest
of those files' tests don't get to run.

---

## Bug 4: Top-level category filters are missing from the product listing

**Failing test:** [tests/User Story 3 productFiltering.spec.ts](../tests/User%20Story%203%20productFiltering.spec.ts) —
`FilterByCategory_thenClear_updatesThenRestoresProductListAndLinksToDetails`

**Steps to reproduce:**
1. Go to `https://with-bugs.practicesoftwaretesting.com/` (product listing)
2. Look at the "By category:" filter panel

**Expected:** Both top-level categories and their sub-categories are listed
as checkboxes — on the main site this is 19 checkboxes, including "Hand
Tools" and "Power Tools" alongside their children (Hammer, Screwdriver,
Grinder, Drill, etc.).

**Actual:** Only 10 checkboxes render — exactly the sub-categories (Hammer,
Hand Saw, Wrench, Screwdriver, Pliers, Grinder, Sander, Saw, Drill, Other).
The two top-level category checkboxes ("Hand Tools", "Power Tools") are
missing entirely from the DOM, confirmed by comparing the rendered
`data-test="category-*"` elements on both sites side by side. A user (or
test) can no longer filter by a top-level category at all — only by its
individual sub-categories.

---

## Bug 5: Pagination controls do not render on the product listing

**Failing tests:** [tests/User Story 3 productFiltering.spec.ts](../tests/User%20Story%203%20productFiltering.spec.ts) —
`GoToNextPage_showsDifferentProducts` (times out after 30s clicking a button
that never appears) and `OnFirstPage_previousPageControlIsDisabled`

**Steps to reproduce:**
1. Go to `https://with-bugs.practicesoftwaretesting.com/` (product listing)
2. Look for Previous/Next page controls below the product grid

**Expected:** `[data-test="pagination-next"]` and `[data-test="pagination-prev"]`
render below the results (as they do on the main site, which lists more
products than fit on one page), letting the user page through the catalog.

**Actual:** Neither element exists in the DOM at all — confirmed via direct
DOM query, not just a slow render. The page-1 product count (9) matches the
main site's page size exactly, so the catalog isn't simply "too small to
paginate" — the pagination component itself isn't rendering. Users are
confined to page 1 of the catalog with no way to reach further products.

---

## Bug 6: Direct navigation to any non-root path returns 404

**Steps to reproduce:**
1. Go directly to `https://with-bugs.practicesoftwaretesting.com/account/profile`
   (or `/checkout`, or `/auth/login` — any path other than `/`)

**Expected:** The app loads normally, as it does on the main site (which
supports direct path-based routing — confirmed by comparison).

**Actual:** The server returns a bare "404 Not Found" page. Only the root
(`/`) and hash-based routes (`/#/account/profile`) work; the app now appears
to rely entirely on hash-based routing with no server-side rewrite/fallback
for direct paths. This breaks bookmarking, refreshing on a non-home route,
and sharing a direct link to any page. It also means any Playwright
`page.goto('/some/path')` call (e.g. `AccountProfilePage.goto()`,
`CheckoutPage.open()`) 404s here — the permanent suite never actually hit
this because those tests fail earlier at login (Bug 3) or navigate via
in-app clicks instead.

---

## Bug 7: Profile page's First name and Last name fields are bound to the wrong data

**Found via:** a temporary diagnostic (`tests/_temp-profileDiagnostic.spec.ts`,
not part of the permanent suite — Bob/customer3 can't log in at all on this
site per Bug 1, so User Story 4's actual subject, profile editing, had never
been exercised here until this check logged in as Jack/customer2 instead)

**Steps to reproduce:**
1. Log in as Jack (customer2) and open the Profile page
2. Compare the First name / Last name boxes against `GET /users/me`
   (`first_name: "Jack", last_name: "Howe"`)

**Expected:** The box labeled "First name" shows "Jack"; the box labeled
"Last name" shows "Howe".

**Actual:** They're swapped — the "First name" box shows "Howe" and holds
`formcontrolname="last_name"` despite its `id`/`data-test` both saying
`first_name`/`first-name` and its `<label>` reading "First name" (confirmed
via Playwright's resolved-element output, not just the displayed value — the
Angular form control binding itself is wrong, not just a display swap). A
save from this page would submit each name into the other field.

One related, likely-connected symptom: clearing the "Last name" box (which
per the swap is actually bound to `first_name`) and submitting does **not**
show the "please correct the highlighted fields" validation banner that the
main site shows for the same action — required-field validation for the name
fields appears to not be wired correctly either. Note this is more limited
than it may look: only the two name fields are affected — the phone field's
minimum-length validation was independently re-tested here and still blocks
correctly, so validation logic elsewhere on this form is intact.

---

## Bug 8: Profile page's Street and Postal code fields are missing entirely

**Found via:** the same temporary diagnostic as Bug 7

**Steps to reproduce:**
1. Log in as Jack (customer2) and open the Profile page
2. Look for the Street and Postal code inputs

**Expected:** Both render as fillable inputs, as on the main site (Jack's
real street, per the API, is "Test street 654").

**Actual:** Neither `[data-test="street"]` nor `[data-test="postal_code"]`
exists in the DOM at all — not empty, not hidden, simply absent. Since
Postal code is a required field to save an update on the main site, this
plausibly makes it impossible to complete a profile update from scratch for
any account lacking a pre-existing postal code (confirmed the diagnostic's
own attempt to submit a "fully valid" update timed out for exactly this
reason — it couldn't find the field to fill). The City field also shows the
literal placeholder text **"City not found"** instead of Jack's real city
("Frankfurt" per the API), suggesting a wider pattern of broken/missing
address-field bindings on this page, in the same spirit as Bug 3's "User
Data not found".

---

## Incidental findings (not covered by current test assertions)

Spotted in the same page snapshots while diagnosing the above — flagged for
awareness, not currently asserted by the suite:

- The product-listing filter panel's "Sort" heading reads **"Sorth"**.
- Top nav item reads **"Contakt"** instead of "Contact".
- The **"Home"** nav link's `href` points to `#/contact` instead of the
  homepage.
- The product detail page's "Related products" heading reads **"Reltded
  products"**.
- Observed under concurrent load: when two purchases complete at nearly the
  same time on the same account (customer2, from two parallel test workers),
  the site issued the **same invoice number** (`INV-2026000003`) to two
  different invoices (different underlying invoice IDs). This broke the
  suite's by-number row lookup with a strict-mode "2 elements matched" error.
  Reproducible by running `User Story 2 purchaseInvoice.spec.ts` with default
  parallelism; passes cleanly with `--workers=1`. The suite now runs this
  file's tests in serial mode to avoid it, but the underlying non-unique
  invoice numbering under concurrency looks like a real backend race
  condition worth a closer look.
- On the account profile form, **postal code** and **state** only enforce
  "not empty" — a single character (e.g. `"1"`) is accepted for either field,
  with no format or length check. By contrast, phone enforces a minimum
  length of 7 digits. Not currently asserted by the suite since the task's
  acceptance criteria only calls for "correct validation" generally, but
  worth flagging as inconsistent with how the phone field is validated.
