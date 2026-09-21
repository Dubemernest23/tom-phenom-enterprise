# TOM-PHENOM ENTERPRISE — Project Overview

> This document is a machine-written status report compiled from the actual
> repo contents (readme, `docs/`, and `apps/frontend` source). Its purpose is
> to give another AI (or a human) a complete, accurate handoff: what this
> project is, how it is built, what is done, what is not done, and the
> constraints to respect when continuing the work.

## 1. What the project is

TOM-PHENOM ENTERPRISE is an internal operations tool for a **sachet (pure)
water production and distribution business**. It replaces a manual
notebook/paper record system. It is a **single-user** tool — the owner
(Chidubem) types in end-of-day figures on a phone. There are no multi-user
roles, authentication, or a native mobile app in the MVP.

The business runs two distribution channels: **keke** (tricycles) and
**van**, and also sells directly at the factory gate ("in-house"). The app
tracks the full money-and-goods loop: raw material in → packing bags stock →
daily production → distribution → customer credit → worker payroll →
equipment maintenance → money owed to suppliers (payables).

Key design philosophy stated across the docs:

- **Every balance and total is computed, never hand-entered** — remaining
  stock, expected cash, and running balances are derived by the system to
  prevent drift between typed and true figures.
- **Fast entry is the priority.** Forms should be quick ("under a minute per
  entry") and phone-friendly — low click-count, full-width inputs, sticky
  submit.
- **Dates matter everywhere** — every module is fundamentally a ledger over
  time, so every record has a date.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Plain JavaScript (ES modules) | No React/Vue, **no bundler**, one `index.html` shell |
| Routing | Custom hash router | `#/dashboard`, `#/customers/:id`, etc. — static-host friendly |
| Styling | Tailwind CSS v3 (`^3.4.0`) | Configured to the project's **own design tokens**, not Tailwind's default palette/fonts |
| Fonts | Space Grotesk (headings) + Inter (body/UI) | Loaded from Google Fonts; falls back to system sans-serif offline |
| Backend | TypeScript + Express + MySQL (`mysql2`) | `apps/server/` is set up as a TypeScript API workspace with module-first route files; database logic is still pending |
| Deployment | Render (Static Site + Web Service) + external managed MySQL | `render.yaml` Blueprint planned (inlined in `docs/monorepo-structure.md`) but **not written** |
| Local serving | Root `concurrently` script | `npm run dev` starts frontend CSS watch, frontend static server, and backend dev server together |
| Build step | Frontend CSS + backend TypeScript | Tailwind compiles `tailwind.css` to `output.css`; backend compiles `src/**/*.ts` to `dist/` |

## 3. Repository layout (actual vs. planned)

```
tom-phenom-enterprise/
├── apps/
│   └── frontend/                     # the SPA — largely built (phase 1)
│       ├── index.html                # single HTML shell (links output.css, loads main.js)
│       ├── package.json              # scripts: build / dev / preview
│       ├── tailwind.config.js        # maps Tailwind theme to design tokens
│       ├── src/
│       │   ├── main.js               # app entry — registers routes, boots router
│       │   ├── router.js             # hash-based router (registerRoute, initRouter, :param support)
│       │   ├── api.js                # fetch wrapper + one function per endpoint (all 9 modules) + auth (login/logout, Bearer)
│       │   ├── config.js             # API_BASE_URL = 'http://localhost:4000/api'
│       │   ├── state.js              # session (localStorage `tpe:session`) + tiny in-memory KPI cache
│       │   ├── utils.js              # formatters: formatNaira, formatNumber, formatKg, formatDate, todayISO
│       │   ├── styles/
│       │   │   ├── tokens.css        # CSS custom properties (colors + overlay token)
│       │   │   ├── tailwind.css      # Tailwind input (@import tokens; @tailwind; focus-visible base)
│       │   │   └── output.css        # GENERATED, git-ignored (do not edit/commit)
│       │   ├── components/
│       │   │   ├── logo.js           # TP monogram (inline SVG), wordmark, splash markup
│       │   │   ├── nav-bar.js        # header, mobile bottom tabs, tablet+ sidebar, bottom-sheet menu
│       │   │   ├── kpi-card.js       # label + big number card, color class + route
│       │   │   ├── list-row.js       # divided row from an array of cells
│       │   │   └── form-field.js     # label-above input (date/number/text, inputmode, min/step/required)
│   │   └── pages/
│   │       ├── login.js          # ✅ BUILT (auth) — `#/login` sign-in gate
│   │       ├── dashboard.js      # ✅ BUILT (Prompt 2)
│   │       ├── roll-intake.js    # ✅ BUILT (Prompt 3)
│   │       ├── packing-bags.js   # ✅ BUILT (Prompt 4)
│   │       ├── factory-log.js    # ✅ BUILT (Prompt 5)
│   │       ├── distribution.js   # ✅ BUILT (Prompt 6)
│   │       ├── customers.js      # ✅ BUILT (Prompt 7) — list + :id detail
│   │       ├── payroll.js        # ✅ BUILT (Prompt 8) — list + :id detail
│   │       ├── maintenance.js    # ✅ BUILT (Prompt 9)
│   │       └── payables.js       # ✅ BUILT (Prompt 10) — list + :id detail
│   └── server/                       # TypeScript Express API foundation
│       ├── package.json              # scripts: dev / build / start / typecheck
│       ├── tsconfig.json             # strict TS build to dist/
│       ├── .env.example              # PORT, CORS_ORIGIN, DATABASE_URL, JWT/owner login
│       └── src/
│           ├── app.ts                # Express app, middleware, route mounting
│           ├── server.ts             # listen entry
│           ├── db.ts                 # lazy mysql2 pool + health check
│           ├── config/env.ts         # dotenv-backed env reader
│           ├── middleware/           # auth + error/not-found middleware
│           ├── modules/              # module-first backend structure
│           │   ├── auth/
│           │   ├── dashboard/
│           │   ├── roll-intake/
│           │   ├── packing-bags/
│           │   ├── factory-log/
│           │   ├── distribution/
│           │   ├── customers/
│           │   ├── payroll/
│           │   ├── maintenance/
│           │   └── payables/
│           ├── types/                # Express request augmentation
│           └── utils/                # shared HTTP helpers
├── docs/                             # all spec/architecture docs (see §5)
├── .gitignore                        # ignores node_modules, .env, and output.css
├── README.md                         # human-facing quickstart + status
└── render.yaml                       # ❌ NOT WRITTEN (Blueprint lives as a code block in docs only)
```

Note: the backend is intentionally module-first. There are no separate
top-level `controllers/` or `services/` folders; each backend feature owns its
route/validation/business logic inside `src/modules/<module>/`.

## 4. What has been done (status as of today)

The build is driven by **`docs/build-prompts.md`** — a sequenced plan
prompts 0–11, consumed one at a time by an AI coding tool. Current progress:

| Prompt | Scope | Status |
|---|---|---|
| 0 | Scaffold: repo structure, design tokens, Tailwind wiring, `index.html` shell + splash, preview server | ✅ Done |
| 1 | Shell: hash router, API layer, nav bar (bottom tabs + sidebar + group pickers), TP monogram header | ✅ Done |
| 2 | Dashboard page (hero number, money/summary KPIs, quick actions) | ✅ Done |
| 3 | Roll Intake page (form, computed summary, tabular-nums list) | ✅ Done |
| 4 | Packing Bags page (add-batch form + batch list with inline "Use bags") | ✅ Done |
| 5 | Daily Factory Log page (4 inputs + 3 computed values, duplicate-date warn-not-block) | ✅ Done |
| 6 | Distribution page (Keke/Van toggle, channel filter on list) | ✅ Done |
| 7 | Customers (list `#/customers` + detail `#/customers/:id`) | ✅ Done |
| 8 | Payroll (list `#/payroll` + detail `#/payroll/:id`) | ✅ Done |
| 9 | Maintenance page (form + current-month running total) | ✅ Done |
| 10 | Payables (list `#/payables` + detail `#/payables/:id`) | ✅ Done |
| 11 | Accessibility / polish pass (44px targets, focus states, reduced motion) | ✅ Done |

All 14 routes are registered in `src/main.js`
(`/login`, `/dashboard`, `/roll-intake`, `/packing-bags`, `/factory-log`,
`/distribution`, `/customers`, `/customers/:id`, `/payroll`, `/payroll/:id`,
`/maintenance`, `/payables`, `/payables/:id`, plus `/` → dashboard).

Git history confirms this is phase 1: three commits — `Initial commit`,
`structure: created the project structure ... per the monorepo.md`, and
`feat: fe setup` (current branch `FE_phase1`, working tree clean).

### 4.1 Frontend shell (built)

- **`index.html`** — one shell. Google Fonts `<link>`, `output.css`, static
  initial splash markup inside `#app`, loads `src/main.js` as a module.
- **`src/main.js`** — mounts the app shell (`mountShell(app)` returns the
  `<main id="view">` container), registers routes (`/` and `/dashboard` →
  dashboard; …), installs the auth **route guard** via `setRouteGuard` and
  calls `initRouter(view)`. The guard redirects unauthenticated visits to
  `#/login` (and authenticated visits to `#/login` back to `#/dashboard`),
  and toggles the `is-auth` class on the shell so nav chrome is hidden while
  signed out.
- **`src/router.js`** — hash-based router. `registerRoute(pattern, module)`
  stores routes; `setRouteGuard(fn)` installs an optional pre-render guard
  (return `false` to abort and redirect); `initRouter` listens to
  `hashchange` and renders on load.
  `matchRoute` splits on `/` and supports `:param` segments (used for detail
  routes later). Handles unknown paths with a "Page not found." message.
- **`src/api.js`** — a `request(path, options)` helper that prefixes
  `API_BASE_URL`, JSON-stringifies body objects, sends JSON headers, attaches
  `Authorization: Bearer <token>` when a session exists, parses JSON
  responses (tolerating empty/non-JSON bodies), clears the session on `401`,
  and throws `new Error(data.error || 'Request failed: <status>')`
  on non-OK responses. Auth helpers: `login(credentials)` →
  `POST /auth/login` returning `{ token, user }`, and `logout()`. **All 9
  modules already have API functions defined**, so the remaining pages
  mostly need to call these (they currently 404 until the backend exists):

  - Roll Intake: `getRollIntakes`, `createRollIntake`
  - Packing Bags: `getPackingBagBatches`, `createPackingBagBatch`, `usePackingBagBatch(id, data)`
  - Factory Log: `getFactoryLogs`, `createFactoryLog`
  - Distribution: `getDistributions(channel)` (query `?channel=` when not `all`), `createDistribution`
  - Customers: `getCustomers`, `getCustomer(id)`, `createCustomer`, `addCustomerTransaction(id, data)`
  - Payroll: `getWorkers`, `getWorker(id)`, `createWorker`, `addSalaryRecord(id, data)`
  - Maintenance: `getMaintenanceRecords`, `createMaintenanceRecord`
  - Payables: `getCreditors`, `getCreditor(id)`, `createCreditor`, `addPayableTransaction(id, data)`
  - Dashboard: `getDashboardSummary`

- **`src/config.js`** — `export const API_BASE_URL = 'http://localhost:4000/api';`
  On Render this file is **regenerated at build time** from an `API_BASE_URL`
  env var (see build command in `docs/monorepo-structure.md`); locally it is
  hand-edited. Never commit a real value.
- **`src/state.js`** — session + tiny in-memory cache. `setSession` /
  `getSession` / `isAuthenticated` / `clearSession` persist `{ token, user }`
  to `localStorage` under `tpe:session` (read back on boot); plus
  `dashboardSummary` with `setDashboardSummary` / `getDashboardSummary` /
  `clearState`. Dashboard does **not** currently use the KPI cache (it
  fetches on every render); the cache exists per the architecture doc so
  navigation back doesn't always re-fetch.
- **`src/utils.js`** — formatting helpers using the `en-NG` locale:
  `formatNaira` (₦ with `toLocaleString`), `formatNumber`, `formatKg`
  (1 decimal, "kg" suffix), `formatDate` (e.g. "17 Sep 2026"), `todayISO`
  (YYYY-MM-DD for date inputs), and `escapeHtml` (HTML-escaping of
  user-entered names/roles/descriptions before interpolation).

### 4.2 Components (built)

- **`logo.js`** — `tpMonogram()` (the "TP" mark built from two strokes + an
  enclosed counter, reads as a stylized droplet/sachet, rendered as inline
  SVG), `wordmark()` ("TOM-PHENOM" in heading type, "ENTERPRISE" below in
  tracked-out small caps — the only tracked letter-spacing in the app), and
  `splashMarkup()` (centered logo loading state).
- **`nav-bar.js`** — the app shell. Renders:
  - Sticky **header** (`bg-primary`): TP monogram (links to dashboard),
    wordmark in `text-surface`, and a right-hand `#app-menu` "Menu" button
    that opens a bottom sheet.
  - **Sidebar** (`md:` and up): all 9 destinations listed individually with
    icons; hides below `md`.
  - **Bottom tab bar** (mobile, `<md`): 4 tabs — Dashboard / Factory
    (`/roll-intake`, `/packing-bags`, `/factory-log`) / Money
    (`/customers`, `/payables`) / More (`/distribution`, `/payroll`,
    `/maintenance`). Group tabs open a **bottom sheet** picker.
  - `updateActive()` marks the active tab/sidebar link (`aria-current`,
    `text-primary` / `border-primary` on the tab, `bg-surface-alt` on the
    sidebar link) on every `hashchange`.
  - The bottom sheet supports Escape-to-close, backdrop click-to-close,
    focus management (focus returns to opener), and `aria-modal` dialog
    semantics. The header menu sheet includes a **"Sign out"** action that
    clears the session and routes to `#/login`.
  - Wraps content in `.app-shell` / `.app-chrome` / `.app-content` /
    `.app-main` hooks; adding `is-auth` to `.app-shell` hides all chrome
    (used by the login page).
  - Icon set: dashboard, roll, bag, clipboard, truck, person, naira,
    wrench, ledger, factory, more, menu — all inline SVGs.
- **`kpi-card.js`** — `kpiCard({ label, value, valueClass, route, prefix, suffix })`;
  a bordered `surface-alt` card linking to `route` with the label in
  `text-ink-muted` and the value in `font-heading text-2xl font-bold
  tabular-nums`.
- **`list-row.js`** — two exports:
  - `listRow(cells, options)` — a divided row (`border-b border-line`) made
    of flex children, each a `flex-1 min-w-0 text-sm tabular-nums` span.
    Pass `href` to render an `<a>` with a hover state.
  - `stackedRow({ primary, secondary, value, valueClass })` — a two-line row:
    a primary label line on the left, a smaller secondary line underneath,
    and the headline value right-aligned with an optional color class. Used
    for payroll salary records and payables transactions where a 5-column
    single line would not fit on a phone.
- **`form-field.js`** — `formField({ name, label, type, inputmode, value,
  required, min, step, placeholder })`; label-above-input, full-width
  bordered input, `focus:border-primary`. Defaults `required` to true.

### 4.3 Pages (built)

**Login (`src/pages/login.js`, route `#/login`)**
- Centered card-free layout: TP monogram + wordmark, then
  `username` / `password` fields and a full-width "Sign in" button. Rendered
  without nav chrome (shell has `is-auth`).
- On submit: `login({ username, password })` → `POST /auth/login`; on success
  `setSession({ token, user })` and navigate to `#/dashboard`; on failure
  shows the API error in a `text-debt` block above the button and re-enables
  submit. Guard logic lives in `main.js` (see §4.1).

**Dashboard (`src/pages/dashboard.js`, route `#/` & `#/dashboard`)**
- Async render; shows "Loading dashboard..." then fetches
  `getDashboardSummary()`.
- Expected response shape (stubbed in the docs, API must return it):
  `{ todayProduction, owedToUs, weOwe, rollsThisMonthKg, bagsRemaining }`.
- UI order per the wireframe: "Today" label → hero number
  (`text-3xl font-bold tabular-nums`, "N bags") OR empty state
  ("No factory log for today yet" + "Log today's production" primary
  button linking to `#/factory-log`); two money KPI cards — "Owed to us"
  (`text-warning` when > 0, links `#/customers`) and "We owe"
  (`text-debt` when > 0, links `#/payables`); two secondary KPI cards —
  "Rolls this month" (`#/roll-intake`) and "Bags remaining"
  (`#/packing-bags`); then a "Quick actions" 2×2 grid: "+ Roll",
  "+ Log", "+ Distribution", "+ Customer txn" (outline primary buttons).
- On fetch failure, renders a plain `text-debt` error line with the
  exception message. No form on this page.

**Roll Intake (`src/pages/roll-intake.js`, route `#/roll-intake`)**
- Layout: heading, form, summary block (`#roll-summary`), then "Recent
  records" list (`#roll-list`).
- Form fields: `intake_date` (defaults to `todayISO()`), quantity of rolls
  (numeric), total kg (decimal), price per kg (currency, decimal), amount
  paid (currency, default 0), `supplier_name` (optional, sent as `null` when
  blank). Submit button full-width.
- On submit: `createRollIntake()` with numeric coercion; on error shows a
  `text-debt` error block; on success renders the summary block with
  `total_price` and `balance` returned by the API — **the frontend does NOT
  compute these itself; it trusts the API response** — prepends the new row
  to the list (no full reload), resets the form, restores date to today and
  amount paid to 0.
- List rows (via `listRow`): date (`intake_date || date`), total kg, total
  price (₦), and balance shown bold `text-debt` only if `balance > 0`,
  otherwise "—" in `text-ink-muted`.
- Empty state: "No roll intake records yet. Add your first entry above."
- NOTE: this page's contract requires the backend to return
  `{ total_price, balance }` (and list records with `intake_date`, `total_kg`,
  `total_price`, `balance`). `quantity_rolls` and `supplier_name` are
  submitted but not shown in the row.

**Packing Bags (`src/pages/packing-bags.js`, route `#/packing-bags`)**
- Add-batch form: `received_date` (default today), `quantity_received`,
  `note` (optional, sent as `null` when blank) → `createPackingBagBatch`. On
  success shows a `text-positive` confirmation and reloads the list.
- Batches list (no pagination): each row shows date, quantity in,
  remaining (bold, `[data-remaining]`), the optional `note` beneath, and a
  "Use bags" button that toggles
  an inline mini-form (`usage_date` default today, `quantity_used`,
  min 1). Submitting calls `usePackingBagBatch(id, body)`; the row's
  remaining is updated in place from the API's `quantity_remaining` (or
  `result.batch.quantity_remaining` if the API nests it). The inline
  inputs use batch-scoped ids (`use-date-<id>`, `use-qty-<id>`) to avoid
  duplicate-input-id issues across rows.
- Empty state: "No packing bag batches yet…". No FIFO logic (owner picks
  which batch to draw down — matches the MVP decision in the PRD).

**Daily Factory Log (`src/pages/factory-log.js`, route `#/factory-log`)**
- Form: `log_date` (default today), `opening_stock`, `closing_stock`,
  `distribution_qty`, `in_house_qty`.
- Duplicate-date behavior: after loading logs, the page warns — never
  blocks — if the selected `log_date` already has a record ("A factory log
  already exists for {date}. Saving will add a duplicate entry."),
  checked on date change and on submit.
- On submit: `createFactoryLog`; the summary block displays the
  API-returned computed values with plain labels: "Total out
  (distribution + in-house)" (`total_2`), "Total accounted (out + closing
  stock)" (`total_1`), and "Production today" (`production`) — the frontend
  does not compute these. New row prepended, list updated.
- List row: date, `production`, opening stock, closing stock.

**Distribution (`src/pages/distribution.js`, route `#/distribution`)**
- Form: `dist_date`, a 2-button **Keke/Van segmented toggle** (not a
  dropdown) driving a hidden `channel` value, `quantity_given`,
  `price_per_bag`, `amount_returned` (default 0). Submit shows
  `amount_expected` and `balance` from the API.
- Records list has a 3-way **All / Keke / Van filter** that refetches via
  `getDistributions(filter)` (`?channel=` query when not `all`).
- Row: date, channel tag (small bordered chip), quantity, balance —
  colored `text-warning` with an "Owed " text label when > 0.
- Segmented controls are a local `segment(cols, items, value, name)` helper
  (grid via inline `style` so Tailwind doesn't purge dynamic column counts;
  `role="group"` + `aria-pressed` + `aria-label`).

**Customers (`src/pages/customers.js`, routes `#/customers` + `#/customers/:id`)**
- List: fetches all customers, sorts client-side by balance descending;
  rows are links to the detail page. Balance colored `text-warning` with an
  "Owed " label when > 0. "+ Add customer" toggles an inline form
  (`name`, `phone` optional) with `aria-expanded`/`aria-controls` wiring.
- Detail: breadcrumb back to list, name/phone, "Running balance" headline
  (warning color + label when > 0), transaction form (`txn_date`,
  `quantity`, `price_given`, `amount_expected` — optional, omitted from the
  request when blank so the API's quantity × price-given default applies,
  `amount_paid`) and history rows (date,
  quantity, price given, balance). On submit shows `amount_expected` +
  `balance`, prepends the history row, and increments the headline balance
  by the txn's returned `balance`.

**Payroll (`src/pages/payroll.js`, routes `#/payroll` + `#/payroll/:id`)**
- List: workers (name, role, base salary) linking to detail; "+ Add worker"
  inline toggle form (`name`, `role`, `base_salary`).
- Detail: worker info line, salary-record form (`pay_period` e.g.
  "2026-09", `salary_due` prefilled with `base_salary` but editable,
  `advance`, `amount_paid`), and a history of records. Rows use
  `stackedRow` — period on the left, "Due/Advance/Paid" subtitle, and
  "Balance ₦x" right-aligned (colored `text-debt` + "Balance" label
  when > 0). Submit shows the returned `balance`.

**Maintenance (`src/pages/maintenance.js`, route `#/maintenance`)**
- Form: `maint_date`, `equipment`, `description` (optional),
  `cost` (currency), `vendor` (optional).
- A "This month's maintenance total" block sits above the list. The
  month total is computed **client-side** by summing `cost` of records whose
  `maint_date`/`date` falls in the current `YYYY-MM` (no dedicated API
  endpoint exists). Updated after each save.
- Row: date, equipment, description-or-vendor, cost.

**Payables (`src/pages/payables.js`, routes `#/payables` + `#/payables/:id`)**
- List: creditors sorted by balance descending, rows link to detail;
  balance colored `text-debt` with an "Owe " label when > 0. "+ Add
  creditor" inline toggle form (`name`, `category` optional).
- Detail: creditor info, "Outstanding balance" headline (`text-debt` when
  > 0), transaction form (`txn_date`, `description`, `amount_owed`,
  `amount_paid`), history via `stackedRow` (date · description, subtitle
  "Owed x · Paid y", right-aligned "Balance z" colored `text-debt` when
  > 0). Submit shows `balance` and updates the headline.

## 5. Documentation index (all in `docs/`)

| File | Contents |
|---|---|
| `prd.md` | Product requirements: business context, the 8 modules, cross-cutting rules, success criteria |
| `schema.md` | Full MySQL schema: 12 tables (roll_intake, packing_bag_batch, packing_bag_usage_log, daily_factory_log, distribution_record, customer, customer_transaction, worker, salary_record, maintenance_record, creditor, payable_transaction); money as `DECIMAL(12,2)`; computed fields calculated in the app layer, not stored as generated columns |
| `FE-system-design.md` | Brand + design system ("treat as law"): identity/wordmark/TP monogram, color tokens, typography, spacing, layout, cards vs. divided-rows rule, dashboard wireframe, component conventions, accessibility floor |
| `FE-pages-specs.md` | Exact contents of each of the 10 pages (including computed formulas for the factory log, API-returned values, and the login/guard contract) |
| `monorepo-structure.md` | Folder structure, routing, API layer, state, build/dev tooling, Render deployment (two services + external MySQL), render.yaml code block |
| `build-prompts.md` | The sequenced build plan (prompts 0–11) + "Reminders to paste if opencode drifts" — the canonical task list |

> ⚠️ **Naming drift:** `build-prompts.md` and `monorepo-structure.md` refer
> internally to older file names (`04-design-system.md`,
> `05-frontend-pages-spec.md`, `06-monorepo-architecture.md`,
> `07-opencode-build-prompts.md`). The real files are
> `FE-system-design.md`, `FE-pages-specs.md`, `monorepo-structure.md`, and
> `build-prompts.md`. Not a functional problem, but any AI reading those docs
> will hit stale references.

## 6. What is remaining

### 6.1 Frontend — done

Prompts 0–11 are complete (see §4). All 9 page modules, the detail routes,
route registration, and the accessibility polish pass have been built and
syntax-checked; `output.css` has been regenerated from the new markup.

One thing to note for any future frontend work: pages use **schema column
names** for request/response fields (`intake_date`, `received_date`,
`log_date`, `dist_date`, `txn_date`, `maint_date`, `quantity_received`,
`amount_owed`, etc.) as the authoritative contract, with a `|| r.date`
fallback when reading list/detail records — the backend author should match
the schema. The earlier Roll Intake `date` drift has been resolved (it now
posts `intake_date`), and optional schema columns are now exposed in the
forms (roll-intake `supplier_name`, packing-bag `note`, customer
`amount_expected`).

### 6.2 Backend — `apps/server/`

The backend foundation is now built as a strict TypeScript Express app.
`apps/server/package.json` provides `dev`, `build`, `start`, and `typecheck`;
`tsconfig.json` compiles `src/**/*.ts` to `dist/`; `.env.example` documents
`PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `JWT_SECRET`, and the single-owner login
env vars.

The server entry is split into `src/app.ts` (Express app, middleware, route
mounting) and `src/server.ts` (listen call). `src/db.ts` creates a lazy
`mysql2/promise` pool from `DATABASE_URL` and powers `/health`. Auth/error
middleware is in `src/middleware/`.

The backend is deliberately **module-first**, not split into top-level
controller/service folders. Feature work should happen under
`src/modules/<module>/`, where the route file and later validation/business
logic can live together. Current modules: `auth`, `dashboard`, `roll-intake`,
`packing-bags`, `factory-log`, `distribution`, `customers`, `payroll`,
`maintenance`, and `payables`.

Implemented now: `POST /api/auth/login`, `POST /api/auth/logout`, `/health`,
JWT Bearer auth guard for `/api/*`, error handling, and placeholder routes for
every frontend endpoint. Placeholder module routes return `501` until the SQL
logic is implemented. The database schema is fully specified in
`docs/schema.md`, and the exact request/response contracts the frontend pages
expect are enumerated in §4.3.

Key response shapes the backend must produce (from §4.3):
- `POST /auth/login` → `{ token, user }` (single owner); all other endpoints
  require `Authorization: Bearer <token>` and should return `401` when it is
  missing/invalid
- `GET /dashboard` → `{ todayProduction, owedToUs, weOwe, rollsThisMonthKg, bagsRemaining }`
- `POST /roll-intake` → `{ total_price, balance, ... }`
- `POST /factory-log` → `{ total_2, total_1, production, ... }`
- `POST /distribution` → `{ amount_expected, balance, ... }`
- `POST /customers/:id/transactions` & `GET /customers/:id` →
  `{ amount_expected, balance }` / `{ ..., transactions: [...] }`
- `POST /payroll/:id/records` & `GET /payroll/:id` → `{ balance }` /
  `{ ..., records: [...] }`
- `POST /payables/:id/transactions` & `GET /payables/:id` → `{ balance }` /
  `{ ..., transactions: [...] }`
- `POST /packing-bags/:id/use` → the updated batch (or
  `{ batch: { quantity_remaining } })`
- `GET /payroll` returns workers with `base_salary`; `GET /payables` and
  `GET /customers` return records with a `balance` field.

### 6.3 Deployment

- **`render.yaml` Blueprint** — not yet written as a file. The intended
  content (two services + env var wiring) is pasted as a code block in
  `docs/monorepo-structure.md`.
- Frontend: Render Static Site, root dir `apps/frontend`, build command
  `npm install && npx tailwindcss -i ./src/styles/tailwind.css -o ./src/styles/output.css --minify && echo "export const API_BASE_URL = '$API_BASE_URL';" > src/config.js`, publish dir `apps/frontend`.
- Backend: Render Web Service with `DATABASE_URL` + `CORS_ORIGIN` env vars.
- Database: **external managed MySQL** (e.g. Aiven / PlanetScale / Railway) —
  Render does not offer managed MySQL; only a single `DATABASE_URL` string is
  consumed so providers can be swapped without code changes.

## 7. Conventions and constraints (must-follow for any continuation work)

These are restated verbatim-ish from the docs because they are treated as
"law" (from `FE-system-design.md` and the drift-prevention reminders in
`build-prompts.md`):

- **SPA, no reloads** — one HTML shell, hash-based routing, no full page
  reloads between modules. No JS framework, no bundler.
- **Only Tailwind theme utilities** — `bg-primary`, `text-ink-muted`,
  `font-heading`, etc. Never Tailwind's default palette (`slate`/`gray`/
  `indigo`) and never arbitrary one-off hex values in markup. `output.css`
  is generated — never hand-edit or commit it.
- **Cards only for discrete units** — cards for KPIs/customer/creditor
  entries; long lists are plain **divided rows** (`border-b border-line`).
  No rounded-card-with-shadow kit on every section.
- **No all-caps labels anywhere**, including nav and section headers.
  Sentence case everywhere. Letter-spacing only on the "ENTERPRISE"
  sub-wordmark.
- **Computed fields are never editable inputs** — they are read-only summary
  blocks shown *after* submit (`bg-surface-alt`, no border), not disabled
  inputs.
- **Balance color semantics** (used consistently across pages):
  - Positive balance owed *to* the business (customer debt, distribution
    balances) → `text-warning` (#B8752C).
  - Amount the business owes out (payables, roll-intake balance) →
    `text-debt` (#B8462F).
  - Settled/zero balance → `text-ink-muted`, **not** green.
  - `text-positive` green (#2F7D5B) is reserved for confirmations ("Saved")
    and fully-reconciled logs — never for "money" meaning.
  - Color is never the only signal — always pair with a text label.
- **Forms** — one column, full-width; numeric fields use
  `inputmode="decimal"` or `"numeric"`; label above field (never
  placeholder-as-label); full-width submit at the bottom; 44px tap targets.
- **Tabular numerals** (`tabular-nums`) on every number in lists/tables.
- **Empty states** — plain sentence + a button to add the first entry. No
  illustrations.
- **Errors** — plain language ("Amount paid can't be more than the
  balance."), never "Oops!" or apologies.
- **Fonts** — body `font-body` (Inter), headings `font-heading` (Space
  Grotesk).
- **Type scale**: xs 12 / sm 14 / base 16 / lg 18 / xl 22 / 2xl 28 / 3xl 34.

## 8. How to run / develop

From the repo root:

```sh
npm install            # installs root workspace dependencies
npm run dev            # starts frontend CSS watch + frontend server + backend API
npm run build          # builds frontend CSS and backend TypeScript
npm run dev:frontend   # frontend only
npm run dev:server     # backend only
```

Open http://localhost:5173 for the app. The backend listens on
http://localhost:4000 by default, with health at `/health` and API routes
under `/api`. Copy `apps/server/.env.example` to `apps/server/.env` when you
are ready to set real database/JWT/owner-login values. Until module SQL is
implemented, protected module endpoints return `501` placeholders.

## 9. Data-flow facts an AI must know before building pages

- Pages never call `fetch` directly — always via the named functions in
  `src/api.js` (all of them already exist and match the schema endpoints).
- **Computed values come from the API.** roll-intake gets `total_price` and
  `balance` from the POST response; distribution gets `amount_expected` and
  `balance`; factory log gets `total_2`/`total_1`/`production`. Every page's
  summary block displays API-returned values; the frontend only formats.
- Response shapes (from `api.js` contracts + what built pages expect):
  - `GET /dashboard` → `{ todayProduction, owedToUs, weOwe, rollsThisMonthKg, bagsRemaining }`
  - `POST /roll-intake` → `{ total_price, balance, ...record }`
  - Lists are arrays of records keyed by snake_case per the schema
    (`total_kg`, `price_per_kg`, `amount_paid`, `quantity_given`,
    `opening_stock`, etc.).
- `main.js` is the only place routes are registered. Each page module must
  export a `render(container, params)` function (params carries `:id` for
  detail pages). Router contract: `module.render(container, params)`.
- Number formatting uses the `en-NG` locale; money via `formatNaira`.

## 10. Quick status summary (TL;DR)

- **Done:** Prompts 0–11 for the frontend — full shell/router/API layer/nav/
  components/design tokens, all 8 module pages + 3 detail views, and the
  accessibility polish pass. Plus a login page (`#/login`) with a session
  guard and sign-out, and a schema-alignment pass on the forms. All 14 routes
  registered; JS syntax-validated; Tailwind `output.css` rebuilt. Backend
  TypeScript workspace is set up with Express app/server entries, auth shell,
  MySQL pool helper, module-first route placeholders, root concurrent dev
  scripts, and passing server typecheck/build.
- **Remaining (repo-wide):** Implement the MySQL-backed module logic, add real
  migrations/schema execution flow, write `render.yaml`, and connect an
  external managed MySQL instance.
- **Rules:** vanilla JS ES modules, custom hash router, Tailwind wired to
  custom tokens only, computed values always sourced from the API, strict
  balance-color semantics (always paired with "Owed "/"Owe" text labels),
  no bundler.
