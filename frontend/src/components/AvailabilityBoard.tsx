import type { CSSProperties } from "react";
import { formatDayLabel, formatGeneratedAt } from "../lib/date";
import { getBookedHours, getCellTone, getDaySummary } from "../lib/availability";
import type { AvailabilityResult } from "../types";

const PAGE_JUMP = 5;
const SKELETON_ROW_COUNT = 5;

type AvailabilityBoardProps = {
  currentPage: number;
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
  totalPages: number;
  totalVisibleFields: number;
  onSelectField: (fieldId: string) => void;
  onPageChange: (page: number) => void;
};

export function AvailabilityBoard({
  currentPage,
  dateColumns,
  error,
  loading,
  result,
  selectedFieldId,
  summary,
  totalPages,
  totalVisibleFields,
  onSelectField,
  onPageChange,
}: AvailabilityBoardProps) {
  const pageStart = summary.totalFields === 0 ? 0 : (currentPage - 1) * 5 + 1;
  const pageEnd = summary.totalFields === 0 ? 0 : pageStart + totalVisibleFields - 1;
  const previousJumpPage = Math.max(1, currentPage - PAGE_JUMP);
  const nextJumpPage = Math.min(totalPages, currentPage + PAGE_JUMP);
  const showLoadingSkeleton = loading;

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

      <div className="pagination-bar">
        <div className="pagination-copy">
          <strong>Showing {pageStart}-{pageEnd}</strong>
          <span>of {summary.totalFields} total fields</span>
        </div>
        <div className="pagination-actions">
          <button
            className="pagination-button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(previousJumpPage)}
            type="button"
          >
            -5 Pages
          </button>
          <button
            className="pagination-button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
          <span className="pagination-page">
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Next
          </button>
          <button
            className="pagination-button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(nextJumpPage)}
            type="button"
          >
            +5 Pages
          </button>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {showLoadingSkeleton ? (
        <div className="matrix-wrapper">
          <div
            className="availability-skeleton"
            aria-hidden="true"
            style={{ "--skeleton-days": dateColumns.length } as CSSProperties}
          >
            <div className="availability-skeleton-header">
              <div className="skeleton-block skeleton-field-label" />
              {dateColumns.map((date) => (
                <div key={date} className="skeleton-block skeleton-day-label" />
              ))}
            </div>
            <div className="availability-skeleton-body">
              {Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
                <div key={rowIndex} className="availability-skeleton-row">
                  <div className="field-meta skeleton-panel">
                    <div className="skeleton-block skeleton-field-title" />
                    <div className="skeleton-block skeleton-field-copy" />
                    <div className="skeleton-block skeleton-field-copy" />
                    <div className="skeleton-block skeleton-field-copy skeleton-field-copy-short" />
                  </div>
                  {dateColumns.map((date) => (
                    <div key={`${rowIndex}-${date}`} className="cell skeleton-panel">
                      <div className="skeleton-block skeleton-cell-value" />
                      <div className="skeleton-block skeleton-cell-copy" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : result ? (
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
                            <strong>{getBookedHours(day).toFixed(1)}h</strong>
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
