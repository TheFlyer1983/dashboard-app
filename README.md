# Operational Analytics Dashboard

A standalone single-page application (SPA) for monitoring key operational metrics. Business users can track revenue, customers, transactions, and conversion performance, explore trends, and drill into operational records with search, sorting, pagination, and filtering.

## Features

- **KPI cards** — Revenue, Active Customers, Transactions, and Conversion Rate, each with a month-over-month trend indicator.
- **Charts** — Revenue Trend (monthly revenue over time) and Revenue by Region (donut split).
- **Records table** — operational records (date, business unit, region, revenue, transactions, status) with search, column sorting, and pagination.
- **Filters** — a filter toolbar for date range, region, and status. Changes update every dashboard component reactively.
- **Extras** — refresh action, "last updated" indicator, active-filter chips, CSV export, and loading skeletons.

## Tech Stack

- [Vue 3](https://vuejs.org/) with the Composition API and `<script setup>`
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/)
- [Vuetify](https://vuetifyjs.com/) for UI components and theming
- [ApexCharts](https://apexcharts.com/) (via `vue3-apexcharts`) for visualisations
- [Vite](https://vite.dev/) for build tooling and [Vitest](https://vitest.dev/) for unit tests

## Architecture

State is centralised in a single Pinia store (`src/stores/analytics.ts`). The store owns the filters and derives all displayed data — KPI metrics, monthly trends, and chart series — from one filtered source of truth, so any filter change cascades to the cards, charts, and table together.

### API layer

The mock REST layer is a static JSON file served from `public/api/operational-records.json` and fetched over HTTP in `src/api/analytics.ts` — the same way a real client would call a REST endpoint.

### Project structure

```text
src/
├── api/            # Mock REST data access (fetch)
│   └── analytics.ts
├── plugins/        # Vuetify setup (theme, components, directives)
│   └── vuetify.ts
├── router/         # Vue Router configuration
│   └── index.ts
├── stores/         # Pinia store (filters + derived analytics)
│   └── analytics.ts
├── types/          # Shared TypeScript types
│   ├── analytics.ts   # Data-model types
│   └── dashboard.ts   # Dashboard/UI presentation types
├── views/          # Route views
│   └── DashboardView.vue
├── App.vue
└── main.ts
public/
└── api/
    └── operational-records.json   # Mock endpoint data
```

## Architectural Decisions

Key decisions and the reasoning behind them.

### Single Pinia store as the source of truth

The store (`src/stores/analytics.ts`) owns the raw records **and** the active filters, and everything
else is derived from them. This keeps the KPI cards, charts, and table perfectly in sync — a single
filter change cascades everywhere — and leaves components thin (presentation only). Trade-off: one
store can grow over time; at this scope that's fine, and it can be split into feature stores later.

### Derive, don't duplicate (computed getters)

KPI metrics, month-over-month trends, and chart series are all `computed` from a single
`filteredRecords` getter rather than stored as separate state. There is no manual synchronisation to
keep consistent, and derived values recompute only when their inputs change.

### Isolated API layer

All data access lives behind `src/api/analytics.ts`. The store depends on that abstraction, not on
`fetch` details, so swapping the mock for a real backend (or changing transport/auth/error handling)
is a change in one module. This is also what makes the [scaling plan](#scaling-to-large-datasets-up-to-100000-records)
a localised change rather than a rewrite.

### Mock API as a static JSON endpoint over HTTP

The mock data is fetched over HTTP from `public/api/operational-records.json` rather than imported as
a module or served by a tool like MSW/json-server. This mirrors real client/server semantics (async,
network states, error handling) with zero extra dependencies, and the endpoint can be pointed at a
real REST service later. Trade-off: a static file can't handle query params — deliberately deferred
and documented under scaling.

### Types split by concern

Shared types live in `src/types/`, separated into `analytics.ts` (data-model types that mirror the
API) and `dashboard.ts` (UI/presentation types such as table headers and KPI card view models). This
keeps components small, makes types reusable across the store and views, and gives each type a clear
owner.

### Vuetify with explicit component/directive registration

Vuetify provides batteries-included Material components, theming, and a responsive grid. Components
and directives are registered explicitly in `src/plugins/vuetify.ts` for reliability (the app renders
unstyled if they're omitted). For production bundle-size tuning, `vite-plugin-vuetify` enables
automatic per-component tree-shaking as a drop-in follow-up.

### ApexCharts for visualisations

`vue3-apexcharts` offers declarative, good-looking area/donut charts with sensible defaults. Chart
options are `computed`, so they react to filtered data and theme colours without imperative updates.

### Composition API + `<script setup>` + TypeScript

Chosen for strong type inference, minimal boilerplate, and colocated logic — which keeps the single
view component readable despite its feature set.

### Client-side filtering/sorting/pagination (for now)

Given the small mock dataset, doing this in the browser is the simplest correct choice and keeps the
demo self-contained. This is the main assumption that changes at scale — see below.

## Scaling to Large Datasets (up to 100,000 records)

The current implementation loads the full dataset once and does all filtering, searching,
sorting, and pagination in the browser. That is fine for the mock dataset, but it does **not**
scale to 100,000 records: the payload becomes large and slow to transfer, holding everything in
memory is wasteful, and sorting/filtering/rendering large arrays on the main thread will cause
noticeable jank. Here is how this would be handled in production.

### 1. Push work to the server (server-side pagination, filtering, and sorting)

The single "return everything" endpoint would be replaced by a query-driven endpoint that returns
only the page the user is looking at, plus a total count for pagination:

```text
GET /api/records?page=1&pageSize=25
                &sort=revenue&order=desc
                &search=europe
                &startDate=2026-01-01&endDate=2026-12-31
                &region=Europe&status=Healthy
```

```jsonc
{
  "data": [
    /* only the 25 rows for this page */
  ],
  "page": 1,
  "pageSize": 25,
  "total": 98452,
}
```

The database does the heavy lifting (indexed `WHERE`/`ORDER BY`/`LIMIT/OFFSET`, or keyset/cursor
pagination for stable performance on deep pages). The client only ever holds one page in memory.
`src/api/analytics.ts` already isolates data access, so this becomes a change to that module and the
store rather than a rewrite of the components.

### 2. Separate KPIs and charts from the table

KPI totals and chart series must reflect the **whole filtered set**, not just the current page, so
they cannot be computed from table rows anymore. Instead, dedicated aggregation endpoints return
pre-computed summaries:

```text
GET /api/metrics?<same filters>      # revenue, customers, transactions, conversion rate
GET /api/revenue/monthly?<filters>   # revenue trend series
GET /api/revenue/by-region?<filters> # donut series
```

Aggregations run in the database (e.g. `SUM`/`GROUP BY`), which is far cheaper than shipping rows to
the client to reduce them. These can be cached and, for large tables, backed by pre-aggregated
rollup/materialised views.

### 3. Make the UI resilient to volume

- **Server-driven table** — use Vuetify's `VDataTableServer`, driving `page`, `itemsPerPage`,
  `sortBy`, and `search` off the API and its `total` count.
- **Debounce inputs** — debounce the search box (~300 ms) and coalesce rapid filter changes so we
  don't fire a request per keystroke.
- **Cancel stale requests** — use `AbortController` to cancel superseded requests so the latest
  filter state always wins (avoids race conditions/flicker).
- **Cache and dedupe** — a query cache (e.g. TanStack Query) keyed by the filter/sort/page params
  provides caching, request deduplication, background refetch, and retries.
- **Virtualise if needed** — if a use case genuinely requires long scrollable lists, use row
  virtualisation (e.g. `VVirtualScroll`) so only visible rows are in the DOM.
- **Loading & empty states** — keep the existing skeletons/spinners to cover network latency.

### 4. Large exports

Client-side CSV export is fine for a page, but exporting 100,000 rows should be a **server-side
job**: request an export, generate the file asynchronously (streamed from the database), and deliver
it via a download link/notification rather than building it in the browser.

### Summary

| Concern                | Current (mock)           | Production (100k)                |
| ---------------------- | ------------------------ | -------------------------------- |
| Data fetch             | Whole dataset once       | One page per request             |
| Filter / sort / search | In the browser           | In the database (query params)   |
| KPIs & charts          | Derived from loaded rows | Dedicated aggregation endpoints  |
| Table                  | Client pagination        | `VDataTableServer` + total count |
| Export                 | Client-side CSV          | Async server-generated export    |

## Getting Started

Requires Node.js `^22.18.0 || >=24.12.0` and [pnpm](https://pnpm.io/).

Install dependencies:

```sh
pnpm install
```

Optionally configure a remote API origin:

```sh
cp .env.example .env.local
```

Set `VITE_API_BASE_URL` to an origin such as `https://api.example.com`. When it is omitted, the
dashboard uses the local `/api/operational-records.json` mock endpoint.

Start the dev server with hot-reload:

```sh
pnpm dev
```

## Scripts

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Start the Vite dev server with hot-reload. |
| `pnpm build`      | Type-check and build for production.       |
| `pnpm preview`    | Preview the production build locally.      |
| `pnpm test:unit`  | Run unit tests with Vitest.                |
| `pnpm type-check` | Type-check the project with `vue-tsc`.     |
| `pnpm lint`       | Lint and auto-fix with oxlint and ESLint.  |
| `pnpm format`     | Format `src/` with Prettier.               |

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).
