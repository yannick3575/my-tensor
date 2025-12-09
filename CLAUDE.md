# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My-Tensor is a "Digital Garden" for ML experimentation. It consists of:
- **Next.js 16 frontend** (`web/`) - React 19 with App Router, Server Components
- **Python ETL scripts** (`scripts/`) - ML pipelines for data fetching and prediction
- **Supabase backend** - PostgreSQL database with RLS policies

The first micro-project is **BTC Oracle**: a Bitcoin price predictor using linear regression.

## Commands

### Web Development (from `web/`)
```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Python ETL (from `scripts/`)
```bash
pip install yfinance pandas scikit-learn supabase python-dotenv  # Dependencies
python etl_btc.py  # Run BTC prediction pipeline
```

## Architecture

### Frontend (`web/`)
```
app/
├── page.tsx                    # Homepage with project cards
├── layout.tsx                  # Root layout with header/navigation
├── globals.css                 # CSS variables + Tailwind v4 config
└── projects/btc-oracle/
    ├── page.tsx                # Server Component - fetches data
    └── components/
        ├── BTCChart.tsx        # Client Component (Recharts)
        └── PredictionCard.tsx  # Server Component
lib/
├── utils.ts                    # cn() helper (clsx + tailwind-merge)
├── supabase/
│   ├── client.ts               # createClient() for server, createBrowserClient() for client
│   └── types.ts                # Database types (projects, crypto_metrics)
└── data/
    └── crypto.ts               # Data fetching functions (getCryptoMetrics, getChartData, etc.)
```

### Data Flow
1. `scripts/etl_btc.py` fetches BTC data via yfinance, trains LinearRegression, uploads to Supabase
2. `web/` fetches from Supabase via Server Components, renders with Recharts

### Supabase Schema (`supabase/schema.sql`)
- **projects**: Micro-project metadata (title, slug, tags, is_active)
- **crypto_metrics**: Price history + predictions (date, symbol, actual_price, predicted_price, model_version, confidence_score)

Both tables have RLS enabled: public read access, write via service_role only.

## Environment Variables

### `web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Public anon key only
```

### `scripts/.env`
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...            # Service role key for writes
```

## Key Patterns

- Server Components for data fetching (no loading states, better SEO)
- Client Components only when browser APIs needed (Recharts with `'use client'`)
- Tailwind v4 with CSS variables for theming (dark mode via `@media (prefers-color-scheme: dark)`)
- `cn()` utility for conditional class merging
