# Industries-Takehome

React + TypeScript take-home for the M-Flat field-availability case study.

Live app: `https://industries-takehome.onrender.com/`

## What the app does

This tool is built around the core workflow from the brief:

- Choose a sport such as soccer, baseball, basketball, softball, or volleyball.
- Pick an arbitrary date range.
- Compare matching NYC athletic fields in a single calendar-style availability board.
- Select a field to inspect slot-level details, including open, pending permit, and permitted blocks.

The current product shape is optimized for quick decision-making:

- A one-screen availability board is the main workspace.
- Status colors make open vs partial vs full vs closed easy to scan.
- A Selected Field panel keeps day-by-day slot detail visible without extra navigation.
- Slot times in the detail panel render in 12-hour format using the viewer's local timezone.

## Current status

This build uses live public NYC data through a small Express backend.

What is live now:

- NYC athletic facility inventory from the Socrata Athletic Facilities dataset
- NYC Parks field availability fetched from the public field-and-court availability endpoint
- Server-side normalization of permit states into `Open`, `Pending permit`, `Permitted`, and closed states
- Search by sport, borough, field type, and date range
- A paginated calendar board plus slot-level detail panel
- Basic caching for facility inventory, per-location availability windows, and full search results

What is still limited or intentionally lightweight:

- No deployment configuration is included in this repo
- No automated test suite yet
- No export/share workflow yet
- Large result sets use pagination rather than virtualization

## Data sources

The app currently combines two live public sources:

### 1. NYC Open Data athletic facilities

- Dataset landing page: `https://data.cityofnewyork.us/dataset/Athletic-Facilities/qpgi-ckmp`
- API docs: `https://dev.socrata.com/foundry/data.cityofnewyork.us/qnem-b8re`
- Dataset/API id: `qnem-b8re`
- Default endpoint: `https://data.cityofnewyork.us/api/v3/views/qnem-b8re/query.json`

The frontend does not call Socrata directly. It requests `/api/facilities` from the local backend, and the backend sends the Socrata request with the app token in the `X-App-Token` header.

### 2. NYC Parks field availability

- Public site: `https://www.nycgovparks.org/permits/field-and-court/map`
- Default backend endpoint: `https://www.nycgovparks.org/api/athletic-fields`

The backend queries the public NYC Parks availability endpoint by location and week window, then normalizes the returned slot data into a UI-friendly shape.

## Local setup

### Prerequisites

- Node.js installed locally
- A Socrata app token for the NYC Open Data facilities API

### Environment

Create `backend/.env` from `backend/.env.example` and set:

```env
SOCRATA_API_URL=https://data.cityofnewyork.us/api/v3/views/qnem-b8re/query.json
SOCRATA_APP_TOKEN=replace-with-your-app-token
PORT=3001
```

### Install and run

If `node` and `npm` are already on your PATH:

```bash
npm install
npm run dev:api
npm run dev
```

If they are not on PATH in your current shell, use the repo helper:

```powershell
.\scripts\npm.cmd install
.\scripts\npm.cmd run dev:api
.\scripts\npm.cmd run dev
```

That starts:

- the backend on `http://localhost:3001`
- the Vite frontend on its default local dev port

## Architecture

The app is split into a small frontend and backend:

1. `frontend/src/App.tsx`
   Owns the main shell, query state, pagination, selected field state, and the three-column layout.

2. `frontend/src/components/`
   Contains the user-facing product UI, including the search controls, availability board, hero area, and Selected Field panel.

3. `frontend/src/hooks/useAvailabilitySearch.ts`
   Handles query-driven loading, cached results, loading state, and error state.

4. `frontend/src/data/availabilityData.ts`
   Calls the backend availability endpoint and caches normalized search results on the client.

5. `backend/src/routes/api.js`
   Exposes `/api/health`, `/api/facilities`, and `/api/availability`.

6. `backend/src/services/facilitiesService.js`
   Fetches and normalizes the live Socrata athletic facilities catalog.

7. `backend/src/services/availabilityService.js`
   Calls the NYC Parks availability endpoint, groups slot windows, maps permit states, and caches responses.

## Product notes

The app is intentionally designed around the case-study brief rather than the shape of the source websites:

- The official NYC Parks experience is map-first and field-by-field.
- This app turns that into a comparison workflow that is easier for staff to use in bulk.
- The board gives a quick answer across many fields and days.
- The Selected Field panel adds enough slot detail to understand who has a block and when.

## Tradeoffs

- The board is paginated to keep the UI manageable for large result sets.
- The current field naming and park labeling come from normalized public-source data and are functional, but not heavily editorialized.
- The backend uses polite caching, but this is still a lightweight take-home implementation rather than a hardened ingestion service.
- Accessibility, analytics, and export flows have not been pushed as far as they would be in a production rollout.

## Known limitations

- The app depends on live public endpoints, so upstream slowness or schema changes can affect results.
- The README does not include a deployed URL because deployment is not configured in this repo.
- The frontend build can be environment-sensitive in restricted shells because Vite uses `esbuild` during config loading.
- There are no automated tests in the current repo.

## What I would harden next

- Add automated tests for date handling, slot grouping, and availability summarization
- Add virtualization or a denser browsing mode for very large result sets
- Add export/shareable search links
- Improve observability around upstream request failures and cache performance
- Run a fuller accessibility pass for keyboard and screen-reader behavior

## AI usage

This repo was built with AI assistance for:

- extracting and structuring the case-study prompt
- scaffolding and iterating on the React + TypeScript frontend
- shaping the backend data flow and normalization approach
- refining UI details and product framing

The main judgment call throughout was to keep the product honest about what is live, what is inferred from public data, and what would still need hardening for a real client rollout.
