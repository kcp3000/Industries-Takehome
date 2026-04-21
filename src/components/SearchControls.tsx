import { SPORT_OPTIONS, type AvailabilityQuery, type DataSourceMode } from "../types";

const BOROUGH_OPTIONS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const;

type SearchControlsProps = {
  query: AvailabilityQuery;
  onModeChange: (mode: DataSourceMode) => void;
  onQueryChange: <K extends keyof AvailabilityQuery>(
    key: K,
    value: AvailabilityQuery[K],
  ) => void;
};

export function SearchControls({
  query,
  onModeChange,
  onQueryChange,
}: SearchControlsProps) {
  return (
    <section className="panel controls-panel">
      <div className="panel-heading">
        <h2>Search</h2>
        <p>Filter by sport, date range, and borough.</p>
      </div>

      <div className="mode-toggle">
        <button
          className={query.mode === "inventory" ? "mode-button active" : "mode-button"}
          onClick={() => onModeChange("inventory")}
          type="button"
        >
          NYC inventory
        </button>
        <button
          className={query.mode === "live" ? "mode-button active" : "mode-button"}
          onClick={() => onModeChange("live")}
          type="button"
        >
          Live adapter
        </button>
      </div>

      <label className="field">
        <span>Sport</span>
        <select
          value={query.sport}
          onChange={(event) =>
            onQueryChange("sport", event.target.value as AvailabilityQuery["sport"])
          }
        >
          {SPORT_OPTIONS.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Start date</span>
          <input
            type="date"
            value={query.startDate}
            onChange={(event) => onQueryChange("startDate", event.target.value)}
          />
        </label>

        <label className="field">
          <span>End date</span>
          <input
            type="date"
            value={query.endDate}
            min={query.startDate}
            onChange={(event) => onQueryChange("endDate", event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Borough</span>
        <select
          value={query.borough}
          onChange={(event) => onQueryChange("borough", event.target.value)}
        >
          {BOROUGH_OPTIONS.map((borough) => (
            <option key={borough} value={borough}>
              {borough}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Search park or field name</span>
        <input
          type="text"
          placeholder="Astoria, Randall's, North Meadow..."
          value={query.search}
          onChange={(event) => onQueryChange("search", event.target.value)}
        />
      </label>

      <div className="note-card">
        <strong>What this build is optimizing for</strong>
        <p>
          One-screen decision-making, a real NYC facility footprint, and a
          clean seam for live permit-availability ingestion.
        </p>
      </div>
    </section>
  );
}
