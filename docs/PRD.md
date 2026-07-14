# DrukSave — Product Requirements Document

**Tagline:** "Helping Bhutan Save Smarter."

## 1. Problem

Most Bhutanese know how much they earn. Very few know where their money
actually goes. People are paid monthly, yet routinely reach month-end asking:

- Where did my money disappear?
- Can I afford this?
- Why can't I save?
- What should I stop buying?
- How much can I spend today?
- How long until I can afford my goal (a laptop, a motorcycle, a trip home for
  Losar)?

DrukSave answers these questions automatically. It is not a ledger — it is a
financial companion that thinks for the user, removes financial stress, and
builds healthy money habits over time.

## 2. Vision

Apple Health's clarity + Duolingo's habit-building + YNAB's budgeting rigor +
an AI copilot + Notion's calm information design — built specifically for
Bhutanese financial life: Ngultrum, government/corporate salary cycles,
seasonal agricultural income, Losar and Tshechu spending, religious
donations, and family obligations.

## 3. Target Users

Fresh graduates, government employees, corporate employees, teachers,
students, farmers, small business owners, taxi drivers, delivery riders,
freelancers, families, retirees. See [personas.md](./personas.md) for detail
on five representative personas.

## 4. Design Principles

1. Never feel like accounting software — calming, motivating, minimal, premium.
2. Encourage saving, never punish spending.
3. Every screen answers a question; it doesn't just display raw numbers.
4. Everything is local: Nu. currency, Bhutanese merchants, Bhutanese
   financial culture (Losar, Tshechu, monastic offerings, village travel).
5. Offline-first — the app must be usable with unreliable connectivity.

## 5. MVP Scope (Phases 1–4 of the build roadmap)

| Phase | Delivers |
|---|---|
| 1 | Foundation: monorepo, full DB schema, Docker dev env, complete email/password auth system |
| 2 | Core money tracking: income, expenses, transactions, categories, merchants, recurring transactions |
| 3 | Budgets and savings goals |
| 4 | Dashboard analytics: cash flow, category breakdown, Financial Health Score v1 |

Everything beyond Phase 4 (AI Coach, automation, OCR/voice entry, admin
panel, reports/export, offline sync, production hardening) is sequenced in
the full roadmap tracked in the engineering plan, and is intentionally out of
scope until its phase begins.

## 6. Success Metrics (indicative, to refine with real usage data)

- % of monthly active users who log at least 3 transactions/week
- % of users with an active savings goal
- Average Financial Health Score trend over 90 days
- Signup completion rate (auth funnel health)

## 7. Bhutan Context Reference

- **Currency:** Ngultrum (Nu.) only — never USD.
- **Example merchants:** Bhutan Telecom, TashiCell, Druk Air, Bhutan
  Airlines, Zombala, Ambient Café, Norling Restaurant, Weekend Market, Local
  Grocery, Fuel Station, CST Canteen, Sherubtse Canteen, Farmers Market,
  Building Material Store.
- **Example expenses:** Nu.50 Tea, Nu.120 Milk, Nu.150 Vegetables, Nu.450
  Internet, Nu.250 Mobile Recharge, Nu.800 Weekend Dinner, Nu.900
  Electricity, Nu.1,500 Rent, Nu.4,000 Motorcycle Service, Nu.6,000 Family
  Support, Nu.2,000 Festival Expenses.
- **Cultural/financial calendar:** Losar (Bhutanese New Year), Tshechu
  festivals, religious donations, monastic offerings, family obligations,
  village travel, seasonal agricultural income, government salary cycles.
