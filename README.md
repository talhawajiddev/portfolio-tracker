# Portfolio Tracker

PSX paper-trading dashboard for the **Pakistan Stock Exchange** with delayed live market data from [dps.psx.com.pk](https://dps.psx.com.pk).

## Features

- **All Share** universe (~550 stocks) including GGL, TPL, and all PSX equities
- Universe switcher: All Share, KSE-100, Sharia Compliant (KMI All Share)
- **Live auto-refresh** (8s stocks, 5s chart, 12s indices) — no manual reload needed
- Scrolling **ticker tape** with top gainers & losers
- **Watchlist** with search and star icons (persisted in Supabase)
- **Screener filters**: % gain/loss range, PKR change range, gainers/losers, Sharia only, sector
- Intraday charts with volume bars (~5 min PSX delay)
- Demo buy/sell with **PKR 50 lakh** virtual cash
- Portfolio P&L, holdings, order history, and **analytics** (pie charts, Sharia split, growth)
- **Add previous holdings** manually for positions bought outside the demo

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Copy `.env.local.example` → `.env.local` and add your URL + anon key.
3. Run `supabase/schema.sql` then `supabase/migrations/002_analytics.sql` in **Supabase → SQL Editor**.
4. Sign up via `/signup` with `talhawajid20@gmail.com`, then promote your admin user (see SQL file footer).

```bash
cd C:\Users\dell\Downloads\stocks
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Auth & admin

- **Sign up / login** — each user gets their own demo portfolio (PKR 50 lakh) stored in Supabase.
- **Analytics** — visit `/analytics` for allocation, P&L, Sharia breakdown, and growth charts.
- **Admin** — after running the promote SQL, visit `/admin` to view any user's portfolio analytics.
- **Theme** — sun/moon toggle in the header (saved per user).

## Disclaimer

This is a **demo / educational** tool only. No real trades are executed. PSX market data is delayed and subject to PSX terms of use.
