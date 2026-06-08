# 13F Pulse

Hedge fund filing tracker — built on React + Vite + Supabase + SEC EDGAR.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in your keys (already done if you got this from the build).

### 3. Supabase table
Go to your Supabase dashboard → SQL Editor → New query, paste the contents of `supabase_setup.sql` and run it.

Also go to **Authentication → URL Configuration** and set:
- Site URL: `http://localhost:5173` (dev) or your Vercel URL (prod)

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
When prompted, add all env vars from your `.env` file.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Auth + DB**: Supabase (watchlist, user profiles)
- **13F filings**: SEC EDGAR via Val Town CORS proxy
- **Fundamentals**: Financial Modeling Prep API
- **Hosting**: Vercel

## Features
- Grid tab: all tickers aggregated from 4 hedge funds, sorted by net buys
- Heatmap tab: by ticker / by fund / movers views
- Ticker drill-down: Funds, Fundamentals, News tabs
- Watchlist: saved per user via Supabase, localStorage for guests
- Profile: sign up / sign in / sign out
- Fully responsive — works on mobile browsers
