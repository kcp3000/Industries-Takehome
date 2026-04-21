import { useEffect, useMemo, useState } from "react";
import { loadAvailability } from "./data/providers";
import { DEFAULT_QUERY } from "./data/sampleData";
import { formatDayLabel, formatGeneratedAt, getDateRange } from "./lib/date";
import { SPORT_OPTIONS, type AvailabilityQuery, type AvailabilityResult, type DataSourceMode, type DailyAvailability } from "./types";

const BOROUGH_OPTIONS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const;

function getCellTone(day: DailyAvailability) {
  const available = day.slots.filter((slot) => slot.status === "available").length;
  const closed = day.slots.every((slot) => slot.status === "closed");

  if (closed) {
    return "cell cell-closed";
  }
  if (available === 0) {
    return "cell cell-booked";
  }
  if (available === day.slots.length) {
    return "cell cell-open";
  }
  return "cell cell-mixed";
}

function getDaySummary(day: DailyAvailability) {
  const available = day.slots.filter((slot) => slot.status === "available");
  const booked = day.slots.filter((slot) => slot.status === "booked");
  const closed = day.slots.filter((slot) => slot.status === "closed");

  if (closed.length === day.slots.length) {
    return "Closed";
  }
  if (available.length === day.slots.length) {
    return `${available.length} open slots`;
  }
  if (available.length === 0) {
    return "Fully booked";
  }
  return `${available.length} open / ${booked.length} booked`;
}

function App() {
  const [query, setQuery] = useState<AvailabilityQuery>(DEFAULT_QUERY);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const next = await loadAvailability(query);
        if (!cancelled) {
          setResult(next);
          setSelectedFieldId(next.fields[0]?.field.id ?? null);
        }
      } catch (caught) {
        if (!cancelled) {
          const message =
            caught instanceof Error ? caught.message : "Unable to load availability.";
          setError(message);
          setResult(null);
          setSelectedFieldId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const dateColumns = useMemo(
    () => getDateRange(query.startDate, query.endDate),
    [query.endDate, query.startDate],
  );

  const selectedField = result?.fields.find((entry) => entry.field.id === selectedFieldId) ?? null;

  const summary = useMemo(() => {
    const fields = result?.fields ?? [];
    const totalFields = fields.length;
    const totalDays = fields.reduce((sum, field) => sum + field.days.length, 0);
    const openCells = fields.reduce(
      (sum, field) =>
        sum +
        field.days.filter((day) => day.slots.some((slot) => slot.status === "available")).length,
      0,
    );

    return {
      totalFields,
      totalDays,
      openCells,
      fillRate: totalDays === 0 ? 0 : Math.round((openCells / totalDays) * 100),
    };
  }, [result]);

  function updateQuery<K extends keyof AvailabilityQuery>(key: K, value: AvailabilityQuery[K]) {
    setQuery((current) => {
      const next = { ...current, [key]: value };
      if (key === "startDate" && next.endDate < next.startDate) {
        next.endDate = next.startDate;
      }
      return next;
    });
  }

  function setMode(mode: DataSourceMode) {
    setQuery((current) => ({ ...current, mode }));
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">M-Flat case study / React + TypeScript</p>
          <h1>Field Availability Console</h1>
          <p className="hero-text">
            Compare every field of a chosen type across a date range in one
            screen, instead of clicking pin by pin through a map.
          </p>
        </div>

        <div className="hero-card">
          <span className="pill">{query.mode === "inventory" ? "NYC inventory mode" : "Live mode"}</span>
          <strong>Designed for Monday-morning staff use</strong>
          <p>
            Fast scan, obvious status colors, and a details panel that keeps
            decision-making on one screen.
          </p>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel controls-panel">
          <div className="panel-heading">
            <h2>Search</h2>
            <p>Filter by sport, date range, and borough.</p>
          </div>

          <div className="mode-toggle">
            <button
              className={query.mode === "inventory" ? "mode-button active" : "mode-button"}
              onClick={() => setMode("inventory")}
              type="button"
            >
              NYC inventory
            </button>
            <button
              className={query.mode === "live" ? "mode-button active" : "mode-button"}
              onClick={() => setMode("live")}
              type="button"
            >
              Live adapter
            </button>
          </div>

          <label className="field">
            <span>Sport</span>
            <select
              value={query.sport}
              onChange={(event) => updateQuery("sport", event.target.value as AvailabilityQuery["sport"])}
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
                onChange={(event) => updateQuery("startDate", event.target.value)}
              />
            </label>

            <label className="field">
              <span>End date</span>
              <input
                type="date"
                value={query.endDate}
                min={query.startDate}
                onChange={(event) => updateQuery("endDate", event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Borough</span>
            <select
              value={query.borough}
              onChange={(event) => updateQuery("borough", event.target.value)}
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
              onChange={(event) => updateQuery("search", event.target.value)}
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

        <section className="panel board-panel">
          <div className="panel-heading board-heading">
            <div>
              <h2>Availability Board</h2>
              <p>
                {loading
                  ? "Refreshing availability..."
                  : result
                    ? `${summary.totalFields} fields across ${dateColumns.length} days`
                    : "No data yet"}
              </p>
            </div>
            <div className="legend">
              <span><i className="swatch swatch-open" /> Open</span>
              <span><i className="swatch swatch-mixed" /> Partial</span>
              <span><i className="swatch swatch-booked" /> Full</span>
              <span><i className="swatch swatch-closed" /> Closed</span>
            </div>
          </div>

          <div className="summary-row">
            <article className="summary-card">
              <span>Fields</span>
              <strong>{summary.totalFields}</strong>
            </article>
            <article className="summary-card">
              <span>Open field-days</span>
              <strong>{summary.openCells}</strong>
            </article>
            <article className="summary-card">
              <span>Availability rate</span>
              <strong>{summary.fillRate}%</strong>
            </article>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          {result ? (
            <>
              <div className="source-banner">
                <strong>{result.sourceLabel}</strong>
                <span>{result.disclaimer}</span>
                <span>Last generated {formatGeneratedAt(result.generatedAt)}</span>
              </div>

              <div className="matrix-wrapper">
                {result.fields.length > 0 ? (
                  <table className="availability-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        {dateColumns.map((date) => (
                          <th key={date}>{formatDayLabel(date)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.fields.map((entry) => (
                        <tr
                          key={entry.field.id}
                          className={
                            entry.field.id === selectedFieldId ? "selected-row" : undefined
                          }
                          onClick={() => setSelectedFieldId(entry.field.id)}
                        >
                          <td className="field-meta">
                          <strong>{entry.field.name}</strong>
                          <span>{entry.field.park}</span>
                          <span>
                              {entry.field.borough} / {entry.field.surface}
                              {entry.field.lights ? " / Lights" : ""}
                          </span>
                          <span>
                            {entry.field.supportedSports.join(", ")}
                            {entry.field.accessible ? " / Accessible" : ""}
                          </span>
                        </td>
                          {entry.days.map((day) => (
                            <td key={`${entry.field.id}-${day.date}`}>
                              <div className={getCellTone(day)}>
                                <strong>{day.slots.filter((slot) => slot.status === "available").length}</strong>
                                <span>{getDaySummary(day)}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <strong>No matching fields</strong>
                    <p>Try a different borough, sport, or search term.</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h2>Selected Field</h2>
            <p>Inspect the slot pattern without leaving the calendar.</p>
          </div>

          {selectedField ? (
            <div className="detail-stack">
              <div className="detail-card">
                <h3>{selectedField.field.name}</h3>
                <p>{selectedField.field.park}</p>
                <ul className="detail-list">
                  <li>{selectedField.field.borough}</li>
                  <li>{selectedField.field.locationHint}</li>
                  <li>{selectedField.field.surface}</li>
                  <li>{selectedField.field.lights ? "Lights available" : "Daylight only"}</li>
                </ul>
              </div>

              {selectedField.days.map((day) => (
                <div key={day.date} className="day-card">
                  <div className="day-header">
                    <strong>{formatDayLabel(day.date)}</strong>
                    <span>{getDaySummary(day)}</span>
                  </div>

                  <div className="slot-list">
                    {day.slots.map((slot) => (
                      <div key={`${day.date}-${slot.start}-${slot.end}`} className="slot-item">
                        <span>
                          {slot.start} - {slot.end}
                        </span>
                        <span className={`slot-tag slot-${slot.status}`}>{slot.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No field selected</strong>
              <p>Pick a row in the availability board to inspect its daily slot details.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
