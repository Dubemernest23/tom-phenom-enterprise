# TOM-PHENOM ENTERPRISE — Brand & Design System

This is the design system opencode should follow for every screen. Treat it as
law — if a screen prompt doesn't specify a color, spacing, or type choice,
pull it from here rather than picking a default.

## Design plan (why these choices)

This is not a marketing site — it's a daily-use operations tool for one
person running a water production floor and a small distribution/credit
book. The design's job is legibility and speed of entry, not persuasion. The
brief is rooted in water production and Nigerian small-business logistics
(keke, van, packing bags, a factory floor), so the palette leans into water
and ledger-book material rather than generic "SaaS dashboard" styling —
no cream background, no terracotta accent, no rounded-card-with-soft-shadow
kit, no all-caps eyebrows.

## Identity

**Name:** TOM-PHENOM ENTERPRISE
**Wordmark:** "TOM-PHENOM" set in the heading typeface, small caps disabled
(sentence case, not tracked-out caps), with "ENTERPRISE" beneath it at a
smaller size and wider letter-spacing (this is the one place letter-spacing
is used deliberately, as a formal-registration signal, not decoration).
**Compact mark (logo/app icon/nav badge):** "TP" monogram — the T and P
built from two straight strokes and one enclosed counter, styled to also
read as a stylized sachet/droplet silhouette (the P's bowl as a droplet
shape). Render as a single-color mark in `--color-ink` on light surfaces and
`--color-surface` on `--color-primary` surfaces, so it works in the header
bar and as a favicon without needing a gradient or shadow.
**Short badge text (when a full mark isn't practical, e.g. a browser tab or
small chip):** "TPE"

## Color

Named tokens — implement as CSS custom properties on `:root`.

```css
:root {
  --color-surface:      #F6F7F7; /* app background — cool, near-white, not cream */
  --color-surface-alt:  #EBEEEF; /* card/row alternating background */
  --color-ink:           #14202B; /* primary text — deep navy-black, not pure black */
  --color-ink-muted:     #4E5D68; /* secondary text, labels, helper copy */
  --color-primary:       #0B7285; /* deep teal — the water/brand accent */
  --color-primary-dark:  #075A68; /* pressed/active state of primary */
  --color-line:          #D6DCDD; /* borders, dividers */
  --color-positive:      #2F7D5B; /* paid / balanced / good */
  --color-warning:       #B8752C; /* balance outstanding, owed to you */
  --color-debt:          #B8462F; /* you owe someone — distinct from "warning" */
}
```

This is a **single-page app** — one HTML shell, JS-driven routing between
views. Styling is implemented with **Tailwind CSS** utility classes,
configured (in `tailwind.config.js`, see `06-monorepo-architecture.md`) to
use the exact tokens below rather than Tailwind's defaults — no default
`slate`/`gray`/`indigo` palette, no default font stack. Every color,
spacing, and type-size value below should exist as a named Tailwind theme
value (e.g. `bg-primary`, `text-ink-muted`, `gap-4`), not as one-off
arbitrary values sprinkled through the markup.

Usage rules:
- `--color-primary` is reserved for primary actions (Save, Add, active nav
  item) and the header bar. It is not used decoratively.
- Balances use color with meaning, consistently everywhere: a positive
  balance owed *to* the business (customer debt) uses `--color-warning`; an
  amount the business owes *out* (payables) uses `--color-debt`; a
  fully-settled balance (zero) uses `--color-ink-muted`, not green — green
  (`--color-positive`) is reserved for confirmations (e.g. "Saved") and
  fully-reconciled daily logs, so it isn't overloaded with "money" meaning.
- No gradients. No drop shadows beyond a single subtle `0 1px 2px` on the
  sticky header/nav for separation — not on every card.

## Typography

Two families, clearly distinct roles:

- **Headings / numbers-as-headline (dashboard KPIs, section titles):**
  `Space Grotesk` — geometric, a little technical, gives the data-entry tool
  some personality without being decorative.
- **UI text / body / form labels / table data:** `Inter` — set with
  `font-variant-numeric: tabular-nums` wherever numbers appear in lists or
  tables, so figures align in columns. This is a functional choice (real
  ledger columns), not a monospace-for-flavor gimmick.

Type scale (base 16px, roughly a major-third progression):

| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-xs` | 12px | 500 | helper text, timestamps |
| `--text-sm` | 14px | 500 | form labels, table cells |
| `--text-base` | 16px | 400 | body text, inputs |
| `--text-lg` | 18px | 600 | list item primary line |
| `--text-xl` | 22px | 600 | section headers |
| `--text-2xl` | 28px | 700 | dashboard KPI numbers |
| `--text-3xl` | 34px | 700 | page hero number (rare — one per screen max) |

Rules:
- Sentence case everywhere. No all-caps labels, anywhere, including nav and
  section headers.
- No tracked-out letter-spacing except the "ENTERPRISE" sub-wordmark
  described above.
- Line length for any paragraph text stays under ~70 characters — but this
  app is mostly numbers and short labels, so this mostly applies to empty
  states and helper text.

## Layout

- **Grid/alignment:** left-aligned throughout. This is a ledger, not a
  brochure — nothing centered except the logo mark on a splash/loading
  state.
- **Spacing scale:** 4px base unit — 4, 8, 12, 16, 24, 32, 48. Use 16px as
  the default gap between form fields and list items.
- **Navigation:** bottom tab bar on mobile with 4 primary destinations —
  Dashboard, Factory (Roll Intake + Packing Bags + Daily Log grouped), Money
  (Customers + Payables grouped), More (Distribution, Payroll, Maintenance).
  This keeps the tab bar to 4 items instead of cramming 8. On wider
  viewports (tablet+), expand to a left sidebar showing all 8 modules
  individually instead of the grouped tabs.
- **Cards:** used only where content is genuinely a discrete unit (a KPI, a
  customer, a creditor) — not as a blanket wrapper for every section. Card
  style: 1px `--color-line` border, 8px corner radius, no shadow, background
  `--color-surface-alt`. Rows in a list are not cards — they're plain
  dividded rows (`border-bottom: 1px solid var(--color-line)`), which is
  faster to scan for a long ledger.

### Dashboard wireframe (first screen the user sees)

```
┌─────────────────────────────┐
│ [TP]  TOM-PHENOM        ⋮   │  <- header, --color-primary bg
├─────────────────────────────┤
│  Today                      │
│  Production: 4,120 bags     │  <- text-3xl hero number, only if
│                              │     today's factory log exists
│  (else: "No factory log     │
│   for today yet" + button)  │
├─────────────────────────────┤
│  ┌───────────┐ ┌───────────┐│
│  │ Owed to us│ │ We owe    ││  <- two KPI cards side by side,
│  │ ₦xxx,xxx  │ │ ₦xxx,xxx  ││     warning / debt colors
│  └───────────┘ └───────────┘│
│  ┌───────────┐ ┌───────────┐│
│  │ Rolls this│ │ Bags in   ││
│  │ month     │ │ packing   ││
│  │ xxx kg    │ │ stock     ││
│  └───────────┘ └───────────┘│
├─────────────────────────────┤
│  Quick actions               │
│  [+ Roll] [+ Log] [+ Dist.] │  <- large tappable shortcuts to
│  [+ Customer txn]           │     the most-used forms
├─────────────────────────────┤
│ [Dash] [Factory] [Money][More]│ <- bottom tab bar
└─────────────────────────────┘
```

Dashboard content, precisely:
1. Today's production (from today's `daily_factory_log` if it exists;
   otherwise an empty-state prompting them to log it).
2. Two headline money KPIs: total outstanding customer balances ("Owed to
   us") and total outstanding payables ("We owe"). Each is tappable and
   routes to that module.
3. Two secondary KPIs: total kg of rolls received this calendar month, and
   current total packing bags remaining across all batches.
4. Quick-action shortcuts to the four highest-frequency forms: new roll
   intake, new factory log, new distribution entry, new customer
   transaction.

## Component conventions

- **Forms:** one column, full-width fields, numeric fields use
  `inputmode="decimal"` or `"numeric"` as appropriate, label above field (not
  placeholder-as-label). Submit button is full-width at the bottom, sticky
  above the keyboard on mobile if feasible.
- **Computed/read-only fields:** shown only *after* submit, in a distinct
  summary block below the form (background `--color-surface-alt`, no border),
  never as a disabled input — disabled inputs imply "this is a field," and
  these aren't fields, they're results.
- **Empty states:** plain sentence explaining what's missing and a button to
  add the first entry. No illustrations needed — keep it functional.
- **Errors:** stated plainly in the interface's voice — what happened and
  what to do, e.g. "Amount paid can't be more than the balance." Never
  "Oops!" or an apology.

## Accessibility / quality floor

- Minimum tap target 44×44px.
- Color is never the only signal — the warning/debt balance colors are
  always paired with a text label ("Owed to us" / "We owe"), not color alone.
- Visible focus states on all interactive elements (2px `--color-primary`
  outline).
- Respect `prefers-reduced-motion` — no motion is required anywhere in this
  app; if any transition is added (e.g. tab switch), keep it under 150ms and
  skip it entirely under reduced-motion.