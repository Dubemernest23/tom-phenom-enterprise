# Sachet Water Management System — PRD (MVP)

## 1. Overview
A single-user (owner-operated) web application to run the day-to-day record-keeping
of a sachet water production and distribution business — from raw material intake
through production, distribution, customer credit, payroll, maintenance, and
payables. Replaces the manual notebook/record system currently used.

**Primary user:** the business owner (Chidubem). No multi-user roles in the MVP —
the store staff's paper records get transcribed into the system by the owner.

**Platform:** Mobile-first responsive web app. Backend: Node.js / TypeScript /
Express / MySQL. Frontend: built separately via an AI coding tool (opencode),
guided by a companion FE spec (see `03-frontend-guide.md`).

## 2. Goals
- Single source of truth for stock, production, distribution, money owed to the
  business, and money the business owes.
- Every module that involves quantities should auto-calculate rather than rely on
  manual arithmetic (remaining stock, expected cash, balances).
- Daily factory log should be able to flag when the books don't balance
  (possible miscount, shrinkage, or theft) — stretch goal, not MVP-blocking.
- Fast data entry — this is the owner typing in end-of-day figures, so forms
  should be quick, not clicks-heavy.

## 3. Out of scope (for MVP)
- Multi-user accounts / roles / auth beyond a single login for the owner.
- Native mobile app (mobile-first *web* is enough).
- Automated SMS/notifications to customers or workers.
- Analytics/reporting dashboards beyond simple totals (can come after MVP).

## 4. Modules

### 4.1 Nylon Roll Intake
Records raw material purchases.
- Fields: date, quantity (number of rolls), total kg, price per kg, total price,
  amount paid, balance (auto: total price − amount paid), supplier name (optional).
- No conversion to expected bag yield in MVP (owner estimates this mentally for
  now) — can be added later as a derived estimate field.

### 4.2 Packing Bags (Nylon Sachet Rolls Used for Packing) Inventory
Tracks packing bag stock in batches/sets.
- On intake: date, quantity brought in, note.
- Update route: given a batch and a "quantity used today," decrement that batch's
  remaining count. System computes and returns new remaining balance.
- Should support multiple open batches at once (FIFO not required for MVP —
  owner picks which batch to deduct from, or system just tracks one running total
  if that's simpler in practice — confirm during build).

### 4.3 Daily Factory Log
The core daily reconciliation. One record per day.
- Inputs: date, opening_stock (counted each morning), closing_stock (counted at
  close), distribution_qty (bags sent out via van + keke that day), in_house_qty
  (bags sold directly at the factory).
- Computed:
  - `total_2 = distribution_qty + in_house_qty`
  - `total_1 = total_2 + closing_stock`
  - `production = total_1 - opening_stock`
- The system should show all four inputs plus the three computed values on save.

### 4.4 Distribution (Keke & Van Channels)
Tracks bags handed to each distribution channel and reconciles cash owed back.
- Fields per entry: date, channel (`keke` or `van`), quantity given, price per bag
  (or total expected — confirm which is more natural at build time), amount
  returned (cash actually brought back), balance (auto: expected − returned).
- Should deduct the quantity given from the running stock (same pool that
  feeds the daily factory log's distribution_qty).

### 4.5 Big Customers Ledger
Tracks recurring/large customers who may not pay in full immediately.
- Customer record: name, phone/contact (optional).
- Transaction: date, quantity given, price given, amount expected (auto:
  quantity × price, or entered directly), amount paid, balance (auto).
- Running balance per customer should be viewable (total owed across all
  transactions).

### 4.6 Worker Payroll
- Worker record: name, role, base salary.
- Salary record per pay period: salary due, advance taken (if any), amount paid,
  balance (auto: due − advance − paid).

### 4.7 Maintenance Log
- Fields: date, equipment/item, description of work, cost, vendor (optional).

### 4.8 Payables (Money the Business Owes)
- Creditor record: name, category (e.g. packing-bag supplier, mechanic,
  parts supplier, other).
- Transaction: date, description, amount owed, amount paid, balance (auto).

## 5. Cross-cutting concerns
- **Balances are always computed, never hand-entered**, to avoid drift between
  what's typed and what's true.
- **Dates matter everywhere** — every module is fundamentally a ledger over time,
  so every record needs a date and the ability to list/filter by date range.
- **Money fields** stored as integers (kobo) or fixed-point decimal in MySQL to
  avoid floating-point rounding issues — see schema doc.

## 6. Success criteria for MVP
- Owner can, in under a minute per entry, log: a roll intake, a packing bag
  usage update, a day's factory log, a distribution handoff, a customer
  transaction, a payroll entry, a maintenance cost, and a payable — all from a
  phone.
- All auto-calculated fields (remaining stock, balances, production) are correct
  and visible without the owner doing mental math.