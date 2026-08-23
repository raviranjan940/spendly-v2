# Spendly v2 — Premium Expense Tracker

A rebuilt-from-scratch, TypeScript edition of Spendly: a private, ledger-style
expense tracker with a premium dark fintech design.

## Tech Stack (latest)

| Layer      | Tech                                                              |
| ---------- | ----------------------------------------------------------------- |
| Build      | [Vite 8](https://vite.dev)                                        |
| UI         | React 19 + TypeScript 6                                           |
| Styling    | Tailwind CSS 4 + shadcn/ui primitives                             |
| Auth       | [Clerk](https://clerk.com) (`@clerk/clerk-react`)                 |
| Data       | Firebase Firestore 12 (auth via Clerk — see `firestore.rules`)    |
| Data layer | TanStack Query 5 (queries, mutations, cache invalidation)         |
| Routing    | React Router 7                                                    |
| Export     | jsPDF + jspdf-autotable (PDF), papaparse (CSV import/export)       |
| Toasts     | sonner                                                            |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your Clerk publishable key + Firebase web config

# 3. Start the dev server (port 3000)
npm run dev
```

> **Note:** Vite only exposes `VITE_`-prefixed variables to the client.
> Never put server-only secrets (e.g. `CLERK_SECRET_KEY`) in `.env`.

## Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Vite dev server on port 3000           |
| `npm run build`  | Type-check (`tsc -b`) + production build |
| `npm run lint`   | oxlint                                 |
| `npm run preview`| Preview the production build           |

## Project Structure

```
src/
├── api/                  # Firestore access functions (transactions, users)
├── components/
│   ├── ui/               # shadcn/ui primitives (button, dialog, table…)
│   ├── app-header.tsx    # Brand bar + theme toggle + Clerk user menu
│   ├── summary-cards.tsx # Balance / Income / Expense statement cards
│   ├── transactions-ledger.tsx  # Search, filters, sort, pager, CRUD
│   ├── transaction-dialog.tsx   # Add/Edit transaction form
│   ├── settings-dialog.tsx      # Currency + income/expense tags
│   ├── export-dialog.tsx        # CSV/PDF export options
│   └── user-doc-sync.tsx        # Ensures a Firestore user doc exists
├── hooks/
│   ├── use-transactions.ts  # TanStack Query: list/add/edit/delete/reset
│   ├── use-settings.ts      # TanStack Query: user settings
│   └── use-theme.tsx        # Dark/light theme provider
├── lib/
│   ├── firebase.ts       # Firestore init from env vars
│   ├── currency.ts       # 9 currencies, Intl formatting helpers
│   ├── dates.ts          # DD-MM-YYYY storage format helpers
│   └── exporters.ts      # CSV + PDF generation (lazy-loaded)
├── pages/                # landing, auth (Clerk SignIn/SignUp), dashboard
├── types/                # Shared domain types
├── App.tsx               # Providers + routes
└── main.tsx              # Entry point
```

## Features

- **Summary cards** — balance, total income and expenses with instant updates
- **The Ledger** — searchable, filterable (tag/type/date-range), sortable
  transactions table with pagination
- **CRUD** — add income/expenses, edit, delete with confirmations
- **Import** — bulk CSV import with row validation (batched writes)
- **Export** — CSV or branded PDF report (optional logo, financial summary)
- **Settings** — 9 currencies and custom category tags, stored per user
- **Reset** — wipe the whole ledger with a batched delete
- **Dark-first premium design** — glass panels, glow accents, mono numerals,
  light theme still available via toggle

## Data Model (compatible with Spendly v1)

```
users/{clerkUserId}
  name, email, photoURL, createdAt
  expenseTags: string[]
  incomeTags: string[]
  currency: string

users/{clerkUserId}/transactions/{autoId}
  name: string
  amount: number
  date: "DD-MM-YYYY"
  tag: string
  type: "income" | "expense"
  dateMs?: number     // sort key (added by v2, derived for old docs)
  createdAt?: Timestamp
```

## Security Notes

Firestore rules cannot verify Clerk sessions, so the shipped rules are
permissive for demo purposes. For production, mint Firebase custom tokens
from a backend that validates the Clerk JWT, then restore strict per-user
rules (`request.auth.uid == userId`). See comments in `firestore.rules`.
