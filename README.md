# plotbridge-main

PlotBridge frontend site. React 18 + TypeScript, built with Vite.

## Setup

```
npm install
```

## Development

```
npm run dev        # vite dev server on http://localhost:8080
```

## Production build

```
npm run build      # type check + vite build -> dist/
```

`dist/` is the deploy artifact and is not tracked in git.

## Checks

```
npm run check      # TypeScript type check
npm test           # contract, module and rendering regression checks
```

## Layout

- `main.tsx` — app shell, routing and the Bridge screen.
- `bridge.ts` / `swap-service.ts` / `transactions.ts` / `tvl.ts` — contract access layer.
- `Home.tsx` / `Docs.tsx` / `Token.tsx` / `Market.tsx` / `Stake.tsx` / `Swap.tsx` — pages.
- `shared/coins.json` — coin list and deposit/withdraw policy (single source of truth).
- `shared/locales/` — `zh.json` / `en.json`, user visible text (both locales must stay in sync).
- `tools/` — offline scripts that refresh `tools/rec-burns.json` and `tools/pbp-amount.json`.
