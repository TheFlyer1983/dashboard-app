# Branch Changes

This document summarises the work completed on the `code-updates` branch compared with `main`.

## Overview

The branch refactors the original single-file dashboard into focused Vue components, reusable
composables, and utility modules. It also improves loading-state management, API request safety,
theme consistency, accessibility, environment configuration, formatting, and test coverage.

The main `DashboardView.vue` file has been reduced from more than 1,200 lines to approximately 180
lines and now primarily coordinates page-level state and child components.

## Component Architecture

Dashboard features previously implemented directly inside `DashboardView.vue` have been extracted
into these components:

- `AppSidebar.vue` contains branding, navigation, active-section highlighting, and responsive drawer
  behaviour. It uses `defineModel()` for its open state.
- `AppTopBar.vue` contains the navigation toggle, last-updated status, refresh action, and user
  avatar.
- `FilterToolbar.vue` contains date, region, and status controls, active-filter chips, and reset
  behaviour.
- `KpiCardGrid.vue` renders KPI cards, trends, and initial-loading skeletons.
- `RevenueTrends.vue` contains the revenue trend and regional revenue charts.
- `RecordsTable.vue` contains record searching, sorting, pagination, status presentation, and CSV
  export controls.

Styles specific to each feature were moved into the corresponding component. Shared dashboard
layout and card styles live in `src/assets/styles/dashboard-layout.css`.

## Reusable Composables and Utilities

The records-table data logic has been extracted from the component:

- `useSortableTable.ts` provides reusable searching, sorting, sort direction, and sort-icon state.
- `usePagination.ts` provides page state, page counts, page-size management, and paginated results.

Shared utility modules were added:

- `formatters.ts` exports the common GBP currency, number, percentage, and time formatters.
- `csv.ts` handles CSV escaping, content creation, browser downloads, and operational-record
  exports.

These modules can be tested without mounting Vue components.

## Loading-State Management

The analytics store now exposes an `isInitialLoading` computed value. This distinguishes the first
load from later refreshes:

```ts
const isInitialLoading = computed(() => loading.value && lastUpdatedAt.value === null)
```

Components receive this value directly instead of duplicating `loading && !lastUpdatedAt`
conditions.

## API and Environment Configuration

The analytics API is no longer tied only to a hard-coded origin:

- `VITE_API_BASE_URL` can define a remote API origin.
- An empty or missing value continues to use the local `/api/operational-records.json` mock.
- `.env.example` documents the available environment variable.
- `env.d.ts` provides TypeScript declarations for the Vite environment setting.

API requests now accept an `AbortSignal`. Starting a new records request aborts the previous one,
preventing stale responses from replacing newer data. Request identity checks also ensure that an
older request cannot clear the loading state or replace an error belonging to the latest request.
Any active request is aborted when the Pinia store's effect scope is disposed.

## Theme Consistency

The dashboard now uses the Vuetify theme as its colour source instead of maintaining a separate
hard-coded indigo palette:

- Chart series derive their primary, secondary, information, warning, and surface colours from the
  active Vuetify theme.
- KPI accent borders use Vuetify CSS variables such as `rgb(var(--v-theme-primary))`.
- Sidebar branding uses the configured `primary` theme colour.

The configured primary colour remains `#2451b2` in `src/plugins/vuetify.ts`.

## Accessibility Improvements

The extracted shell components include several accessibility improvements:

- Icon-only navigation and refresh buttons have accessible labels.
- Last-updated information is exposed as a polite live status.
- The active sidebar destination uses `aria-current="location"`.

## Formatting Configuration

The invalid mixed Oxfmt/Prettier configuration was replaced with a valid `.prettierrc`.
The duplicate `.prettierrc.json` file was removed, and `.prettierignore` now excludes generated
output, dependencies, coverage output, and the lockfile.

## Tests

The branch adds coverage for:

- Shared number, currency, percentage, and time formatters.
- CSV quoting and embedded-quote escaping.
- Table searching and sorting.
- Pagination and page-size changes.
- Initial loading versus refresh loading.
- Cancellation of superseded analytics requests.
- Latest-response state handling.
- API base URL construction and abort-signal forwarding.

At the time this document was created, all 8 unit tests passed, along with TypeScript checking,
editor lint diagnostics, and the production build.

## Configuration

To use a remote API, copy the example environment file:

```sh
cp .env.example .env.local
```

Then configure the API origin:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

Leave the value empty to continue using the local mock endpoint.
