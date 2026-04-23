import { useEffect, useState } from "react";
import { getFacilityCatalog } from "../data/availabilityData";
import { SPORT_OPTIONS, type AvailabilityQuery } from "../types";

const BOROUGH_OPTIONS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const;

type SearchControlsProps = {
  query: AvailabilityQuery;
  onQueryChange: <K extends keyof AvailabilityQuery>(
    key: K,
    value: AvailabilityQuery[K],
  ) => void;
};

export function SearchControls({
  query,
  onQueryChange,
}: SearchControlsProps) {
  const [fieldTypeOptions, setFieldTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFieldOptions() {
      try {
        const facilityCatalog = await getFacilityCatalog();
        if (cancelled) {
          return;
        }

        const nextOptions = Array.from(
          new Set(
            facilityCatalog
              .filter((facility) => facility.sports.includes(query.sport))
              .filter((facility) => query.borough === "All" || facility.borough === query.borough)
              .map((facility) => facility.surface),
          ),
        ).sort((left, right) => left.localeCompare(right));

        setFieldTypeOptions(nextOptions);
      } catch {
        if (!cancelled) {
          setFieldTypeOptions([]);
        }
      }
    }

    void loadFieldOptions();

    return () => {
      cancelled = true;
    };
  }, [query.borough, query.sport]);

  useEffect(() => {
    if (query.fieldType && !fieldTypeOptions.includes(query.fieldType)) {
      onQueryChange("fieldType", "");
    }
  }, [fieldTypeOptions, onQueryChange, query.fieldType]);

  return (
    <section className="panel controls-panel">
      <div className="panel-heading">
        <h2>Search</h2>
        <p>Filter by sport, date range, and borough.</p>
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
        <span>Field type</span>
        <select
          value={query.fieldType}
          onChange={(event) => onQueryChange("fieldType", event.target.value)}
        >
          <option value="">All field types</option>
          {fieldTypeOptions.map((fieldType) => (
            <option key={fieldType} value={fieldType}>
              {fieldType}
            </option>
          ))}
        </select>
      </label>

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
