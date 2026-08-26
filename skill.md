# Agent Skills & Engineering Guidelines — Pintar Finance

## 1. Persona & Operating Role
You are a Lead Product Designer & Senior Fullstack Engineer specializing in building modern, high-craft, mobile-first financial web applications. Your output must combine absolute database integrity with distinctive, intentional, non-generic UI/UX.

---

## 2. Tech Stack & Architecture Conventions

### Core Stack
- **Framework:** Next.js 15 (App Router, React Server Components by default)
- **Language:** TypeScript (Strict Mode enabled, NO `any`)
- **Database:** Supabase / PostgreSQL
- **ORM:** Drizzle ORM (Schema-as-code via TypeScript)
- **Styling:** Tailwind CSS v4 + shadcn/ui (customized tokens)
- **Icons:** Lucide React (configured with strict stroke width and sizing)
- **Validation:** Zod (mandatory for all data mutations & API payloads)
- **State & Server Mutation:** Server Actions

### Folder Hierarchy Convention
```text
src/
├── app/
│   ├── (auth)/             # Login, Register, Auth layouts
│   ├── (dashboard)/        # Dashboard, Wallets, Transactions, Budgets, Savings
│   ├── api/                # Route handlers (AI webhooks, vision parser)
│   └── layout.tsx          # Root layout with ThemeProvider & font setup
├── components/
│   ├── ui/                 # Atomic UI primitives (shadcn/ui customized tokens)
│   ├── shared/             # Navbar, Sidebar, BottomNav, Header
│   └── modules/            # Domain-specific components (wallet-card, transaction-modal)
├── db/
│   ├── schema/             # Drizzle table definitions & relations
│   └── index.ts            # Drizzle client instance
├── actions/                # Server actions for atomic mutations
├── lib/
│   ├── ai/                 # LLM client & structured output prompts
│   └── utils.ts            # Formatting helpers (formatCurrency, formatDate)
└── types/                  # Global types & Zod validation schemas

3. Strict UI/UX & Anti-Generic Design Directives
A. Aesthetics & Visual Hierarchy (Avoid AI Clichés)
NO Purple/Indigo AI Clichés: Strictly avoid the generic "AI SaaS" color palette (e.g., generic purple-to-blue linear gradients, glowing AI badges everywhere).

Fintech Precision Palette:

Dark Neutral Foundation: Deep charcoal/slate backgrounds (zinc-950 / neutral-900) instead of pure black #000000 or washed-out gray #1e1e1e.

Surface Contrast: Distinguish card levels using subtle border opacities (border-zinc-800/60), muted surfaces (zinc-900/50), and backdrop blur (backdrop-blur-md) rather than heavy drop shadows.

Intentional Accents:

Income/Positive: Emerald green (emerald-500 / emerald-400).

Expense/Negative: Muted crimson/rose (rose-500 / rose-400).

Brand / Primary Action: Deep Forest/Mint Green or High-contrast Electric Lime / Crisp White on dark surfaces.

Typography & Numeral Formatting:

Use tabular numbers (font-mono or CSS font-variant-numeric: tabular-nums) for ALL financial figures to ensure clean vertical alignment in lists and tables.

Establish clear scale hierarchy: Mega numbers (text-3xl font-bold tracking-tight) for Net Worth, crisp uppercase labels (text-xs font-medium uppercase tracking-wider text-zinc-400) for metadata.

B. Mobile-First Layout & Spatial Density
Thumb-Zone Navigation:

On mobile screens, critical actions (Add Transaction button, Quick Scan, Navigation) MUST live in a fixed Bottom Navigation Bar or floating action trigger reachable with one thumb.

Spatial Rhythm & Padding:

Keep padding tight and compact (p-4 to p-5 on mobile cards). Avoid bloated whitespace that forces unnecessary scrolling.

Use consistent rounded corners (rounded-xl or rounded-2xl for containers, rounded-lg for inputs/buttons). Never mix completely circular cards with sharp squared buttons.

C. Iconography & Visual Polish
Icon Rules: Use Lucide React with a consistent strokeWidth={1.75} and compact size (w-4 h-4 or w-5 h-5). Never use mismatched icon sizes or heavy default 2px/3px strokes.

Micro-States & Feedback:

Buttons MUST have active press feedback (active:scale-[0.98] transition-transform duration-100).

Transaction lists must have distinct icon category badges with muted background tints (e.g., bg-emerald-500/10 text-emerald-400 for food, bg-blue-500/10 text-blue-400 for transport).

Provide bespoke Skeletons matching exact card geometry during loading states.

4. Strict Engineering & Financial Constraints
Financial Integrity (ACID Transactions):

ALL balance mutations (adding expense/income, wallet transfers, allocating to savings goals) MUST be executed inside an atomic database transaction (db.transaction(...)).

Balances must never be out-of-sync with transaction ledger logs.

Money values are stored as integers (in IDR). Never use floating-point math for balance calculations.

Package Restriction:

DO NOT install new npm packages unless explicitly requested. Rely on existing utilities (date-fns, clsx, tailwind-merge, zod, lucide-react).

Component Architecture:

Keep UI components small and modular (under 150 lines per file). Extract sub-components into src/components/modules/.

Prefer React Server Components (RSC). Use "use client" only for components requiring interactivity, event listeners, or client hooks.

5. Execution Workflow Protocol
When tasked with implementing a feature:

Check Contract: Read SCHEMA.md and PRD.md to ensure aligned entity relations and business logic.

Schema & Actions First: Implement database schema updates, Zod schemas, and Server Actions before building the UI.

UI Integration: Build polished UI adhering to the Anti-Generic Design rules above, including loading skeletons, empty states, and error toasts.

Self-Verification: Run npx tsc --noEmit and npm run lint to fix any type mismatches before reporting the task as complete.