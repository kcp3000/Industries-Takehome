import { useEffect, useState } from "react";
import { loadAvailability } from "../data/providers";
import type { AvailabilityQuery, AvailabilityResult } from "../types";

export function useAvailabilitySearch(query: AvailabilityQuery) {
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const next = await loadAvailability(query);
        if (!cancelled) {
          setResult(next);
        }
      } catch (caught) {
        if (!cancelled) {
          const message =
            caught instanceof Error ? caught.message : "Unable to load availability.";
          setError(message);
          setResult(null);
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

  return {
    result,
    loading,
    error,
  };
}
