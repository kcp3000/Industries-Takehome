import { formatDayLabel, formatGeneratedAt } from "../lib/date";
import { getCellTone, getDaySummary } from "../lib/availability";
import type { AvailabilityResult } from "../types";

type AvailabilityBoardProps = {
  dateColumns: string[];
  error: string | null;
  loading: boolean;
  result: AvailabilityResult | null;
  selectedFieldId: string | null;
  summary: {
    totalFields: number;
    openCells: number;
    fillRate: number;
  };
  onSelectField: (fieldId: string) => void;
};

export function AvailabilityBoard({
  dateColumns,
  error,
  loading,
  result,
  selectedFieldId,
  summary,
  onSelectField,
}: AvailabilityBoardProps) {
  return (
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
                      className={entry.field.id === selectedFieldId ? "selected-row" : undefined}
                      onClick={() => onSelectField(entry.field.id)}
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
                            <strong>
                              {day.slots.filter((slot) => slot.status === "available").length}
                            </strong>
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
  );
}
