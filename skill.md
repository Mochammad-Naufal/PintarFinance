# skill.md — Agent Guidelines for Pintar Finance

> File ini adalah panduan konteks untuk AI agent yang bekerja di repo ini.
> Baca file ini sebelum menulis kode apapun.

---

## 1. Project Overview

**Pintar Finance** — Personal finance management web app built with Next.js 15 App Router.

---

## 2. Folder Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── (auth)/             # Route group: authentication pages
│   ├── (dashboard)/        # Route group: protected app pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── transactions/   # Transaction list & CRUD
│   │   ├── budgets/        # Budget management
│   │   └── reports/        # Charts & reports
│   ├── api/                # Route handlers (API endpoints)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + Tailwind + shadcn tokens
│
├── components/
│   ├── ui/                 # shadcn/ui primitives (DO NOT edit manually)
│   ├── layout/             # Navbar, Sidebar, Footer, etc.
│   ├── forms/              # Form components (react-hook-form + zod)
│   └── [feature]/          # Feature-specific components
│
├── lib/
│   ├── utils.ts            # cn(), formatCurrency(), formatDate(), etc.
│   ├── validations/        # Zod schemas
│   └── constants.ts        # App-wide constants
│
├── hooks/                  # Custom React hooks (use-*)
├── types/                  # TypeScript type definitions
└── server/                 # Server-only code (DB, auth)
    ├── db/                 # Prisma client & queries
    └── actions/            # Next.js Server Actions
```

---

## 3. Coding Rules

### General
- **Language**: TypeScript strict mode — no `any`, no `// @ts-ignore`
- **Formatting**: Prettier default (single quotes, semicolons optional)
- **Imports**: Use path alias `@/` always, no relative `../../`
- **Components**: Functional components only, named exports preferred

### Naming Conventions
| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `TransactionCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTransactions.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types/Interfaces | PascalCase | `Transaction`, `Budget` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_BUDGET_AMOUNT` |
| Route files | lowercase kebab | `new-transaction/` |

### Data & Validation
- **Always validate** form data with Zod before processing
- **Never trust** client-sent data in Server Actions — revalidate on server
- Use `date-fns` for all date operations, never `new Date().toLocaleString()`
- Currency always stored as **integer cents** in DB (e.g., Rp 10.000 → 10000)

### UI & Styling
- Use **shadcn/ui** components as base — extend, don't rewrite
- Apply dark/light mode using `.dark` class on `<html>` (already configured)
- Use `cn()` from `@/lib/utils` for conditional classnames
- Breakpoints: mobile-first (`sm:`, `md:`, `lg:`, `xl:`)

### State Management
- Server state: React Server Components + Server Actions (preferred)
- Client state: `useState` / `useReducer` for local UI state
- Global state: TBD (Zustand if needed)

### Performance
- Prefer **React Server Components** — only use `"use client"` when necessary
- Use `next/image` for all images
- Use `loading.tsx` and `error.tsx` per route segment

---

## 4. Key Libraries & APIs

| Library | Usage |
|---|---|
| `shadcn/ui` | UI component library |
| `lucide-react` | Icons |
| `zod` | Schema validation |
| `date-fns` | Date formatting (locale: `id`) |
| `clsx` + `tailwind-merge` | Class management via `cn()` |
| `react-hook-form` | Form state (to be added) |
| `recharts` / `tremor` | Charts (to be decided) |

---

## 5. Environment Variables

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 6. DO & DON'T

✅ **DO**
- Read `PRD.md` before adding new features
- Check `SCHEMA.md` before writing DB queries
- Update `PROGRESS.md` after completing tasks
- Write self-documenting code with JSDoc for public utilities

❌ **DON'T**
- Edit files in `src/components/ui/` directly — use shadcn CLI to add/update
- Use `fetch` in Server Components for internal API — use Server Actions instead
- Hardcode IDR amounts as strings — always use `formatCurrency()` from `@/lib/utils`
- Skip loading/error states for async operations
