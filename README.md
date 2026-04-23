# Industries-Takehome

React + TypeScript take-home for the M-Flat field-availability case study.

## What this app does

This app is built around the core workflow from the prompt:

- Choose a field type such as soccer, baseball, or basketball.
- Pick an arbitrary date range.
- Compare all matching fields in a single easy-to-scan calendar view.
- Click one row to inspect slot-level detail without leaving the screen.

The current build is intentionally optimized for product judgment and clarity:

- A one-screen availability board is the centerpiece.
- Status colors make open vs partial vs booked vs closed obvious at a glance.
- A side panel keeps slot detail visible without forcing extra navigation.
- The app is structured around a provider boundary so the data source can change without rewriting the UI.

## Current status

This build now uses the live NYC Open Data Athletic Facilities API as its facility catalog source through a small Express backend, then layers simulated availability on top so the interface can be exercised at realistic scale without exposing the app token in the browser.

What is real now:

- React + TypeScript application structure
- Real NYC athletic-facility inventory loaded from the live Socrata API
- Search controls and date-range handling
- Unified calendar UX
- Field detail panel
- Frontend/backend separation with an Express proxy
- README notes on tradeoffs and next steps

What is stubbed for the next step:

- Live NYC Parks permit-availability fetching/parsing
- Caching and rate-limit protection
- Export / share actions

That gap is intentional and called out because the prompt explicitly asks for honesty about anything mocked or skipped.

## Data source

The facility inventory is sourced from the NYC Open Data Athletic Facilities API:

- Landing page: https://data.cityofnewyork.us/dataset/Athletic-Facilities/qpgi-ckmp
- API docs: https://dev.socrata.com/foundry/data.cityofnewyork.us/qnem-b8re
- Current dataset/API id: `qnem-b8re`
- API endpoint: `https://data.cityofnewyork.us/api/v3/views/qnem-b8re/query.json`

The frontend does not call Socrata directly. It requests `/api/facilities` from the local Express backend, and the backend sends the Socrata request with the app token in the `X-App-Token` header.

The current backend normalization returns roughly:

- 6,933 total athletic-facility rows from the raw API
- 3,535 rows normalized into the five sports currently supported by the UI

This gives the interface a realistic facility footprint without shipping a large local snapshot in the repo.

## Local setup

Node is available on this machine at `C:\\Program Files\\nodejs\\node.exe`, but `node` and `npm` are not currently on PATH in this shell.

If your shell already has Node on PATH:

```bash
npm install
npm run dev:api
npm run dev
```

If not, use the repo helper or the full path:

```powershell
.\scripts\npm.cmd install
.\scripts\npm.cmd run dev:api
.\scripts\npm.cmd run dev
```

Create `backend/.env` from `backend/.env.example` and provide the Socrata app token before starting the backend.

## Architecture

The app is deliberately split into clear frontend/backend layers:

1. `frontend/src/App.tsx`
   The product shell, search controls, summary cards, calendar matrix, and detail panel.

2. `frontend/src/data/providers.ts`
   The source boundary. Today it routes to the API-backed availability adapter.

3. `frontend/src/data/availabilityData.ts`
   The frontend availability adapter. It requests normalized facility inventory from the backend and generates deterministic slot availability across the requested date range.

4. `backend/index.js`
   A thin bootstrap file that loads environment variables and starts the server.

5. `backend/src/`
   The backend application layer, split into routes, services, config, constants, and shared utilities to keep the server code DRY and easier to extend.

## How I would wire the live NYC Parks source next

The public NYC Parks map already exposes field availability on the public web, but it is map-first and awkward for staff who need to compare many fields quickly. The next step would be:

1. Inspect the public field/court map responses and any park-level spreadsheet download endpoints.
2. Build a small ingestion layer that normalizes parks data into:
   - field metadata
   - permit blocks
   - open / booked / closed slot summaries
3. Cache normalized responses by park + day range.
4. Keep the React board exactly as-is and swap the simulated slot layer for a real permit-availability source.

If I were shipping this for a real client, I would prefer a thin server-side proxy with caching rather than direct browser scraping. That would make rate-limiting, retries, source changes, and observability much safer.

## API access

The app now reads live facility inventory through the local backend instead of shipping a generated dataset in the repo.

That keeps the token out of the browser, makes the frontend easier to review, and leaves a clear place to add caching or rate-limit protection if usage grows.

## Tradeoffs

- I prioritized a realistic facility footprint over pretending the site exposes bulk availability data it does not directly provide in this workflow.
- I kept the UI intentionally polished because the prompt treats UX as a real requirement, not a nice-to-have.
- I chose a provider abstraction so the work done now still matters when the live source is added.

## Stress-testing value

Using the real facility inventory helps reveal product and engineering pressure points:

- Large-result rendering for sports like basketball can push well over a thousand rows.
- Wide date ranges multiply the number of rendered cells quickly.
- Public data quality is not perfectly clean, so normalization rules matter.
- The current client-rendered table is good for the take-home, but virtualization or server pagination would be worth considering for production.

I’m deliberately framing these as robustness and product risks, not offensive security testing.

## AI usage

This repo was built with AI assistance focused on:

- extracting and structuring the PDF brief quickly
- shaping the ReactTS scaffold from an almost-empty repo
- iterating on UX layout, data structures, and README framing

The key judgment call was where not to pretend certainty: the live NYC Parks data path is not falsely claimed as complete here.

## What I would harden before a real client rollout

- Live public-data ingestion with caching and backoff
- Automated tests for date math and availability aggregation
- Analytics for common field searches
- CSV export / shareable links
- Better accessibility audits for keyboard navigation and screen readers
- A walkthrough recording showing the live provider in action once network access is available
