# Design notes

Why the framework is shaped the way it is.

## From scripts to a framework

`challenges/` holds standalone Playwright scripts written against Practice-App-v2: each one launches its own browser, logs in by hand and asserts inline. The framework (`fixtures/`, `pages/`, `helpers/`, `tests/`) turns those patterns into reusable pieces, so a new spec only states its intent. The challenges stay in the repo as practice material and are typechecked and linted with the rest of the code.

## Fixtures over setup code

`fixtures/index.ts` extends Playwright's `test` with what specs need:

- `apiClient`, `trader2ApiClient`, `approverApiClient`: an `ApiClient` already signed in as that role (Bearer token).
- `traderPage`, `trader2Page`, `approverPage`: a page signed in through the login form, waiting for the redirect before the test starts. trader2 and approver get their own browser contexts, so one test can use two roles side by side.
- `loginPage`, `ordersPage`, `trader2OrdersPage`, `approvalsPage`: page objects bound to the right page.

A test asks for a fixture by name and gets it ready to use; setup and teardown live in one place.

## Two ways to be signed in

- **UI login fixtures** (`traderPage` and the others) go through the real form. Use them when the login itself matters.
- **Storage state** from the `setup` project (`tests/auth.setup.ts`): each account signs in once over the API, and the session is saved to `playwright/.auth/`. A spec opts in with `test.use({ storageState: authFile('approver1') })` and starts signed in. This is the fast path for tests that are about something else.

## Typed API client

`helpers/api-client.ts` wraps `APIRequestContext` with typed methods (`createOrder`, `getOrder`, `approveOrder`, `rejectOrder`, `me`) that return the types in `types/order.ts`. A non-2xx answer throws an `ApiError` with the status and the parsed body, so a negative test reads as `rejects.toMatchObject({ status: 403 })` and a failing setup call stops the test at the line that failed.

## API arranges, UI acts, API asserts

Hybrid specs create their data over the API (fast, no UI flakiness), do only the step under test in the browser, and check the result over the API. `tests/ui/approvals.spec.ts` is the example: the trader creates an order over the API, the approver approves it on the approvals page, and the API confirms `Approved` and `decidedBy`.

## Parallel-safe test data

The suite runs `fullyParallel` against one in-memory app, so:

- every test creates its own orders, and `clientOrderId` comes from `uniqueClientOrderId()` (the API answers 409 on a duplicate, and `Date.now()` collides between workers);
- no spec calls `POST /api/test/reset`, which would wipe the orders other workers are using. The challenges reset freely because they run one at a time.

## Waiting

Assertions are web-first (`toHaveText`, `toHaveURL`, `toHaveCount`) and retry until they pass or time out. Eventually consistent state is polled with `expect.poll` (execution goes Working → Partially Filled → Filled after approval). There are no fixed sleeps.

## Configuration

`helpers/env.ts` reads `.env` (or the shell, which is how CI passes secrets). Each value is checked when it is read, so the Playwright config loads without a complete `.env`, and a missing password fails with the variable's name and how to set it. `playwright.config.ts` starts Practice-App-v2 through `webServer` on the `BASE_URL` port and reuses an app that is already running when not on CI.
