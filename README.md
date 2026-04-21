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

This build now uses the real NYC Open Data Athletic Facilities inventory as its facility catalog, then layers simulated availability on top so the interface can be exercised at realistic scale.

What is real now:

- React + TypeScript application structure
- Real NYC athletic-facility inventory seeded from the public dataset
- Search controls and date-range handling
- Unified calendar UX
- Field detail panel
- Data-provider abstraction
- README notes on tradeoffs and next steps

What is stubbed for the next step:

- Live NYC Parks permit-availability fetching/parsing
- Caching and rate-limit protection
- Export / share actions

That gap is intentional and called out because the prompt explicitly asks for honesty about anything mocked or skipped.

## Dataset used

The facility inventory is seeded from the NYC Open Data Athletic Facilities dataset:

- Landing page: https://data.cityofnewyork.us/dataset/Athletic-Facilities/qpgi-ckmp
- Current dataset/API id: `qnem-b8re`
- Download used in this repo: `data/athletic-facilities.csv`

The version I pulled during development represented roughly:

- 6,933 total athletic-facility rows in the raw dataset
- 2,965 active rows mapped into the five sports currently supported by the UI

This makes the interface much better for realistic scope and performance testing than a tiny hand-written list.

## Local setup

Node is available on this machine at `C:\\Program Files\\nodejs\\node.exe`, but `node` and `npm` are not currently on PATH in this shell.

If your shell already has Node on PATH:

```bash
npm install
npm run dev
```

If not, use the full path:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## Architecture

The app is deliberately split into three layers:

1. `src/App.tsx`
   The product shell, search controls, summary cards, calendar matrix, and detail panel.

2. `src/data/providers.ts`
   The source boundary. Today it routes to sample data. Tomorrow it can route to a live NYC Parks adapter or a small proxy service.

3. `src/data/sampleData.ts`
   A real-inventory adapter that reads the NYC athletic-facilities seed data and generates deterministic availability across the requested date range.

4. `public/athleticFacilities.json`
   Trimmed facility inventory derived from the raw NYC CSV and loaded at runtime so it does not bloat the main JS bundle.

## How I would wire the live NYC Parks source next

The public NYC Parks map already exposes field availability on the public web, but it is map-first and awkward for staff who need to compare many fields quickly. The next step would be:

1. Inspect the public field/court map responses and any park-level spreadsheet download endpoints.
2. Build a small ingestion layer that normalizes parks data into:
   - field metadata
   - permit blocks
   - open / booked / closed slot summaries
3. Cache normalized responses by park + day range.
4. Keep the React board exactly as-is and swap the inventory-seeded provider for the live provider.

If I were shipping this for a real client, I would prefer a thin server-side proxy with caching rather than direct browser scraping. That would make rate-limiting, retries, source changes, and observability much safer.

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
