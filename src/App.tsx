import { useEffect, useMemo, useState } from "react";
import { AvailabilityBoard } from "./components/AvailabilityBoard";
import { FieldDetails } from "./components/FieldDetails";
import { Hero } from "./components/Hero";
import { SearchControls } from "./components/SearchControls";
import { DEFAULT_QUERY } from "./data/sampleData";
import { useAvailabilitySearch } from "./hooks/useAvailabilitySearch";
import { getDateRange } from "./lib/date";
import { summarizeAvailability } from "./lib/availability";
import type { AvailabilityQuery } from "./types";

const FIELDS_PER_PAGE = 5;

function App() {
  const [query, setQuery] = useState<AvailabilityQuery>(DEFAULT_QUERY);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { result, loading, error } = useAvailabilitySearch(query);

  const dateColumns = useMemo(
    () => getDateRange(query.startDate, query.endDate),
    [query.endDate, query.startDate],
  );
  const totalFields = result?.fields.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFields / FIELDS_PER_PAGE));
  const paginatedFields = useMemo(() => {
    if (!result) {
      return [];
    }

    const startIndex = (currentPage - 1) * FIELDS_PER_PAGE;
    return result.fields.slice(startIndex, startIndex + FIELDS_PER_PAGE);
  }, [currentPage, result]);
  const paginatedResult = useMemo(() => {
    if (!result) {
      return null;
    }

    return {
      ...result,
      fields: paginatedFields,
    };
  }, [paginatedFields, result]);

  const selectedField = useMemo(
    () => paginatedFields.find((entry) => entry.field.id === selectedFieldId) ?? null,
    [paginatedFields, selectedFieldId],
  );
  const summary = useMemo(() => summarizeAvailability(result), [result]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectedFieldId(paginatedFields[0]?.field.id ?? null);
  }, [paginatedFields]);

  function updateQuery<K extends keyof AvailabilityQuery>(key: K, value: AvailabilityQuery[K]) {
    setQuery((current) => {
      const next = { ...current, [key]: value };
      if (key === "startDate" && next.endDate < next.startDate) {
        next.endDate = next.startDate;
      }
      return next;
    });
  }

  return (
    <div className="page-shell">
      <Hero />

      <main className="content-grid">
        <SearchControls
          query={query}
          onQueryChange={updateQuery}
        />
        <AvailabilityBoard
          currentPage={currentPage}
          dateColumns={dateColumns}
          error={error}
          loading={loading}
          result={paginatedResult}
          selectedFieldId={selectedFieldId}
          summary={summary}
          totalPages={totalPages}
          totalVisibleFields={paginatedFields.length}
          onSelectField={setSelectedFieldId}
          onPageChange={setCurrentPage}
        />
        <FieldDetails selectedField={selectedField} />
      </main>
    </div>
  );
}

export default App;
