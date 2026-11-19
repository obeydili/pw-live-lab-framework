# pw-live-lab-framework

[![Playwright Tests](https://github.com/obeydili/pw-live-lab-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/obeydili/pw-live-lab-framework/actions/workflows/playwright.yml)

A Playwright + TypeScript test framework for **Practice-App-v2** (Trade Desk Lite), a small order-ticket web app with trader and approver roles. It shows how standalone Playwright scripts (kept in `challenges/`) become a structured suite: custom fixtures, page objects, a typed API client, saved sessions per role, and UI, API and hybrid tests that run fully parallel.

The application under test lives in [`practice-app-v2/`](practice-app-v2/README.md). It is a fake Express app that keeps all data in memory.

## Stack

| Concern | Tool |
|---|---|
| Test runner | `@playwright/test` (Chromium) |
| Language | TypeScript (strict), ES modules |
| Structure | Custom fixtures, page objects, typed API client, `setup` project for storage state |
| Application under test | Practice-App-v2 (Node.js + Express), started by Playwright's `webServer` |
| Code quality | `tsc --noEmit`, oxlint, Prettier |
| CI | GitHub Actions: lint, typecheck, the app's own tests, the Playwright suite, HTML report artifact |
| Runtime | Node.js 24 (see `.nvmrc`) |

## Project structure

```text
.
├── tests/
│   ├── auth.setup.ts        Setup project: signs in each account, saves playwright/.auth/<account>.json
│   ├── api/                 API tests through the typed client
│   ├── ui/                  UI and hybrid tests (storage state, page objects)
│   └── orders/              Hybrid: create over the API, check in the UI
├── fixtures/index.ts        test.extend: signed-in API clients, signed-in pages, page objects
├── pages/                   Page objects (login, orders, approvals)
├── helpers/
│   ├── api-client.ts        Typed ApiClient and ApiError
│   ├── auth.ts              Accounts, their credentials and storage-state paths
│   ├── env.ts               Environment variables, validated when read
│   ├── readJson.ts          Typed response.json()
│   └── test-data.ts         Unique clientOrderId per test
├── types/order.ts           API types (Order, CreateOrderRequest, ...)
├── challenges/              Standalone practice scripts against the same app (see below)
├── practice-app-v2/         The application under test, with its own node:test suite
├── playwright.config.ts     Projects, reporters, webServer
├── NOTES.md                 Design notes
└── .env.example             Template for .env
```

## Setup

```bash
npm ci                    # framework dependencies
npm run app:install       # Practice-App-v2 dependencies
npx playwright install chromium
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | no | Default `http://localhost:3300`. The app is started on this port. |
| `TRADER1_USERNAME`, `TRADER1_PASSWORD` | yes | First trader |
| `TRADER2_USERNAME`, `TRADER2_PASSWORD` | yes | Second trader, for ownership checks |
| `APPROVER1_USERNAME`, `APPROVER1_PASSWORD` | yes | Approver |

The demo users and their password are listed in the [Practice-App-v2 README](practice-app-v2/README.md#users). `.env` is git-ignored. Variables set in the shell take precedence over the file.

## Running Practice-App-v2

You don't have to start it yourself: `npm test` starts it through `webServer` and waits for `/api/health`. Locally, an app already running on the `BASE_URL` port is reused. To run it on its own, for example to explore it in a browser or for the challenges:

```bash
npm run app               # http://localhost:3300
npm test --prefix practice-app-v2   # the app's own node:test suite
```

## Running the tests

| Command | What it does |
|---|---|
| `npm test` | The whole suite, in parallel (the `setup` project runs first) |
| `npm run test-alone` | The same with one worker |
| `npx playwright test --grep @api` | Only tests tagged `@api` (also `@hybrid`, `@trader2`) |
| `npm run test:headed` | With a visible browser |
| `npm run ui` | Playwright UI mode |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | `tsc --noEmit`, including `challenges/` |
| `npm run lint` / `npm run format` | oxlint and a Prettier check, or a Prettier fix |

On a failure, the HTML report in `playwright-report/` has the screenshot. On CI, failed tests are retried twice and keep a trace of the retry.

## Challenges

`challenges/` holds the standalone scripts the framework grew out of, one file per exercise (strict-mode locators, `waitForResponse`, debounced search, `expect.poll`, route mocking, pagination, CRUD status codes, storage state, downloads and uploads, dialogs, popups and iframes, drag and drop). Most are plain scripts that launch a headed browser:

```bash
npm run app                                                    # in one terminal
npm run challenge challenges/pw-mod-2/pw-lesson-2-3/09-api-query-pagination.ts
```

They read the same `.env`, call `POST /api/test/reset` themselves, and are meant to run one at a time. The few `*.spec.ts` exercises are Playwright test files from before the framework existed. All challenges are typechecked and linted, but they aren't part of `npm test` (`testDir` is `./tests`).

## Continuous integration

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push and pull request to `main`: install, lint, typecheck, the app's self-tests, then `npx playwright test` (which starts the app), and uploads `playwright-report/` as an artifact. The passwords come from the repository secrets `TRADER1_PASSWORD`, `TRADER2_PASSWORD` and `APPROVER1_PASSWORD`.

## Linting

oxlint is used instead of ESLint because `typescript-eslint` doesn't support TypeScript 7 (the native compiler this project uses) yet: it needs the JavaScript compiler API that TypeScript 7 no longer ships. oxlint parses TypeScript itself and implements the core ESLint rules.

## Design notes

See [NOTES.md](NOTES.md): fixtures, the two ways to sign in, the typed client, parallel-safe data and waiting.

## License

[MIT](LICENSE)
