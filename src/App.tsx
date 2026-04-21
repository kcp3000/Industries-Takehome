import { useEffect, useMemo, useState } from "react";
import { AvailabilityBoard } from "./components/AvailabilityBoard";
import { FieldDetails } from "./components/FieldDetails";
import { Hero } from "./components/Hero";
import { SearchControls } from "./components/SearchControls";
import { DEFAULT_QUERY } from "./data/sampleData";
import { useAvailabilitySearch } from "./hooks/useAvailabilitySearch";
import { getDateRange } from "./lib/date";
import { summarizeAvailability } from "./lib/availability";
import type { AvailabilityQuery, DataSourceMode } from "./types";

function App() {
  const [query, setQuery] = useState<AvailabilityQuery>(DEFAULT_QUERY);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const { result, loading, error } = useAvailabilitySearch(query);

  const dateColumns = useMemo(
    () => getDateRange(query.startDate, query.endDate),
    [query.endDate, query.startDate],
  );

  const selectedField = useMemo(
    () => result?.fields.find((entry) => entry.field.id === selectedFieldId) ?? null,
    [result, selectedFieldId],
  );
  const summary = useMemo(() => summarizeAvailability(result), [result]);

  useEffect(() => {
    setSelectedFieldId(result?.fields[0]?.field.id ?? null);
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
      <Hero mode={query.mode} />

      <main className="content-grid">
        <SearchControls
          query={query}
          onModeChange={setMode}
          onQueryChange={updateQuery}
        />
        <AvailabilityBoard
          dateColumns={dateColumns}
          error={error}
          loading={loading}
          result={result}
          selectedFieldId={selectedFieldId}
          summary={summary}
          onSelectField={setSelectedFieldId}
        />
        <FieldDetails selectedField={selectedField} />
      </main>
    </div>
  );
}

export default App;
