# opencode Build Prompts — Sequenced

Feed these to opencode in order. Point it at `04-design-system.md`,
`05-frontend-pages-spec.md`, and `06-monorepo-architecture.md` as context
before the first prompt — tell it those three files are the spec it must
follow, not suggestions.

## 0. Project setup

> Set up a monorepo folder called `tom-phenom` with a `frontend/` directory
> inside it, following the exact folder structure in
> `06-monorepo-architecture.md`. This is a single-page app: one
> `index.html`, plain JS with ES modules for logic, no JS framework, no
> bundler. Install Tailwind CSS as a dev dependency and set up
> `tailwind.config.js` mapping its theme to the tokens in the Color and
> Typography sections of `04-design-system.md` (colors, font families,
> type scale) — not Tailwind's default palette. Create
> `src/styles/tokens.css` with the CSS custom properties for those same
> tokens, and `src/styles/tailwind.css` as Tailwind's input file (the
> `@tailwind` directives, importing `tokens.css`). Add an npm script that
> runs the Tailwind CLI to compile `tailwind.css` into `src/styles/output.css`.
> Create `frontend/index.html` that links `output.css` and loads
> `src/main.js` as a module, mounting an empty app container. Load the two
> font families (Space Grotesk for headings, Inter for body/UI) as web
> fonts. Don't build any page yet.

## 1. Shell: router, nav, API layer

> Build `src/router.js` as a simple hash-based router per
> `06-monorepo-architecture.md` — it should map routes to page modules and
> call each page's `render(container, params)` function. Build
> `src/api.js` with a `request()` helper and stub functions for all
> endpoints listed across the module specs (roll-intake, packing-bags,
> factory-log, distribution, customers, payroll, maintenance, payables) —
> point `BASE_URL` at `http://localhost:4000/api` for now. Build
> `src/components/nav-bar.js`: bottom tab bar with 4 grouped destinations
> (Dashboard, Factory, Money, More) on narrow viewports, expanding to a full
> left sidebar with all 9 destinations on tablet+ widths, per the
> Navigation section of `04-design-system.md`. Use the TP monogram
> described in the design system as the header logo mark, rendered as
> inline SVG.

## 2. Dashboard page

> Build `src/pages/dashboard.js` exactly per section 0 of
> `05-frontend-pages-spec.md` and the dashboard wireframe in
> `04-design-system.md`: today's production hero (or empty state), two
> money KPI cards, two secondary KPI cards, and a 4-button quick-actions
> row. Wire it to the relevant `api.js` functions (stub the aggregate
> endpoints if they don't exist yet — assume `getDashboardSummary()`
> returns `{ todayProduction, owedToUs, weOwe, rollsThisMonthKg,
> bagsRemaining }`). This is the default route (`#/` and `#/dashboard`).

## 3. Roll Intake page

> Build `src/pages/roll-intake.js` per section 1 of
> `05-frontend-pages-spec.md`: form + list, computed summary block on
> submit, tabular-nums list rows.

## 4. Packing Bags page

> Build `src/pages/packing-bags.js` per section 2 of
> `05-frontend-pages-spec.md`: add-batch form plus batch list with inline
> "Use bags" mini-form per row.

## 5. Daily Factory Log page

> Build `src/pages/factory-log.js` per section 3 of
> `05-frontend-pages-spec.md`, including the duplicate-date warning
> behavior (warn, don't block).

## 6. Distribution page

> Build `src/pages/distribution.js` per section 4 of
> `05-frontend-pages-spec.md`, including the Keke/Van toggle (not a
> dropdown) and the channel filter on the list.

## 7. Customers pages

> Build `src/pages/customers.js` covering both the list view and detail
> view per section 5 of `05-frontend-pages-spec.md`, routed as
> `#/customers` and `#/customers/:id`.

## 8. Payroll pages

> Build `src/pages/payroll.js` covering both list and detail views per
> section 6 of `05-frontend-pages-spec.md`, routed as `#/payroll` and
> `#/payroll/:id`.

## 9. Maintenance page

> Build `src/pages/maintenance.js` per section 7 of
> `05-frontend-pages-spec.md`, including the current-month running total
> above the list.

## 10. Payables pages

> Build `src/pages/payables.js` covering both list and detail views per
> section 8 of `05-frontend-pages-spec.md`, routed as `#/payables` and
> `#/payables/:id`.

## 11. Polish pass

> Review every page against the Accessibility/quality floor section of
> `04-design-system.md`: 44px tap targets, visible focus states, balance
> colors always paired with a text label, reduced-motion respected. Fix any
> gaps found.

## Reminders to paste if opencode drifts
- This is an SPA — one HTML shell, hash-based routing, no full page reloads
  between modules.
- Tailwind utility classes come from our configured theme (`bg-primary`,
  `text-ink-muted`, etc.) — not Tailwind's default palette/fonts, and not
  arbitrary one-off hex values in the markup.
- No rounded-card-with-shadow treatment on every section — cards only for
  genuinely discrete units (KPIs, customer/creditor entries), plain
  divided rows for lists.
- No all-caps labels anywhere.
- Computed fields (balances, totals) are never editable inputs — they're
  read-only summary output shown after submit.