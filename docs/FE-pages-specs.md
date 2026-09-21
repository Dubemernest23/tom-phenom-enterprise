# Frontend Page Specs

Every page follows the component conventions in `04-design-system.md`. Each
spec below lists: purpose, data it loads, what's on screen, and what it
submits. This is what a senior FE lead would hand a mid-level engineer
instead of a rough sketch — build to this, not around it.

## Login (`#/login`) — auth gate

**Purpose:** the only door into the app — a single owner login (per the PRD,
auth beyond this is out of scope).
**Loads on mount:** nothing.
**On screen:** the TP monogram and wordmark above a username + password form
and a full-width "Sign in" button. No nav chrome (header/sidebar/tabs are
hidden while signed out).
**On submit:** `POST /auth/login` with `{ username, password }`. On success
store `{ token, user }` in `localStorage` (`tpe:session`) and go to
`#/dashboard`; on failure show a plain-language error above the button.
**Guard:** every other route requires a session — unauthenticated visits
redirect to `#/login`, and an authenticated visit to `#/login` redirects to
`#/dashboard`. Every API call sends `Authorization: Bearer <token>`; a `401`
clears the session and returns to `#/login`. The menu sheet has a "Sign out"
action.

## 0. Dashboard (`#/dashboard`) — landing page

**Purpose:** one glance at where the business stands today.
**Loads on mount:** today's factory log (if any), sum of open customer
balances, sum of open payable balances, this month's total roll kg, current
total packing bags remaining.
**On screen:** see the wireframe in `04-design-system.md`. In order:
today's production hero number (or empty state), two money KPI cards
(Owed to us / We owe — tappable, route to Customers / Payables), two
secondary KPI cards (rolls this month / bags remaining), then a
quick-actions row of four buttons linking straight to the add-forms for
Roll Intake, Factory Log, Distribution, and Customer transaction.
**No form on this page** — it's read-only plus navigation.

## 1. Roll Intake (`#/roll-intake`)

**Loads:** list of past roll intake records, most recent first.
**Form fields:** date (default today), quantity of rolls (number), total
kg (number), price per kg (currency), amount paid (currency, default 0),
supplier (optional).
**On submit:** POST, then show a summary block with `total_price` and
`balance` returned by the API. Prepend the new record to the list below
without a full page reload.
**List row:** date, total kg, total price, balance (colored per the
balance color rules if > 0).

## 2. Packing Bags (`#/packing-bags`)

**Two sections on one page:**
- "Add batch" form: date received, quantity received, note (optional).
  Submits to create a new batch.
- "Batches" list: each row shows received date, quantity received,
  quantity remaining (bold), the optional note beneath, and a "Use bags"
  button. Tapping it opens an inline mini-form (date, quantity used) — on
  submit, update that row's remaining count from the API response without
  navigating away.

## 3. Daily Factory Log (`#/factory-log`)

**Loads:** list of past daily logs, most recent first.
**Form fields:** date (default today, and the form should warn — not
block — if a log for that date already exists), opening stock, closing
stock, distribution quantity, in-house quantity.
**On submit:** show a summary block with `total_2`, `total_1`, and
`production`, each labeled plainly (e.g. "Production today: 4,120 bags").
**List row:** date, production, opening stock, closing stock.

## 4. Distribution (`#/distribution`)

**Loads:** list of past distribution records, most recent first, with a
toggle/filter for Keke vs Van vs All.
**Form fields:** date, channel (Keke / Van toggle — not a dropdown, this is
tapped constantly), quantity given, price per bag, amount returned.
**On submit:** show `amount_expected` and `balance` in the summary block.
**List row:** date, channel (small tag), quantity, balance (colored
`--color-warning` if > 0, since this is money owed *to* the business by the
distributor).

## 5. Customers (`#/customers`, `#/customers/:id`)

**List view (`#/customers`):** every customer with their running balance
owed, sorted highest-balance first. "+ Add customer" button (name, phone).
**Detail view (`#/customers/:id`):** customer name/phone at top, running
total balance as a headline number, transaction history below (date,
quantity, price given, balance), and an add-transaction form (date,
quantity, price given, amount expected — optional, leave blank to use
quantity × price given, amount paid) — submitting shows `amount_expected`
and `balance` and updates the running total immediately.

## 6. Payroll (`#/payroll`, `#/payroll/:id`)

**List view:** every worker (name, role, base salary), "+ Add worker"
button.
**Detail view:** worker info at top, salary record history (pay period,
salary due, advance, paid, balance), add-record form (pay period, salary
due defaulted to base salary but editable, advance, amount paid) —
submitting shows `balance`.

## 7. Maintenance (`#/maintenance`)

**Loads:** list of past maintenance records, most recent first, with a
running total for the current calendar month shown above the list.
**Form fields:** date, equipment, description, cost, vendor (optional).
**On submit:** prepend to the list, update the month total.

## 8. Payables (`#/payables`, `#/payables/:id`)

**List view:** every creditor with running balance owed, "+ Add creditor"
button (name, category).
**Detail view:** creditor info at top, transaction history (date,
description, amount owed, amount paid, balance), add-transaction form —
submitting shows `balance` and updates the running total (colored
`--color-debt`, since this is money the business owes out).

## Navigation summary

Bottom tabs (mobile): **Dashboard** · **Factory** (→ picker between Roll
Intake / Packing Bags / Factory Log) · **Money** (→ picker between
Customers / Payables) · **More** (→ Distribution / Payroll / Maintenance).
Sidebar (tablet+): all 9 destinations listed individually, Dashboard
pinned at top. The header menu sheet also carries a **Sign out** action.
The login page (`#/login`) sits outside this chrome.