import { useEffect, useState } from "react";
import { getAvailabilityQueryKey, getCachedAvailability } from "../data/availabilityData";
import { loadAvailability } from "../data/providers";
import type { AvailabilityQuery, AvailabilityResult } from "../types";

export function useAvailabilitySearch(query: AvailabilityQuery) {
  const [result, setResult] = useState<AvailabilityResult | null>(() => getCachedAvailability(query));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = getAvailabilityQueryKey(query);

  useEffect(() => {
    let cancelled = false;
    const cachedResult = getCachedAvailability(query);

    async function run() {
      if (cachedResult) {
        setResult(cachedResult);
        setLoading(false);
        setError(null);
        return;
      }

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
  }, [query, queryKey]);

  return {
    result,
    loading,
    error,
  };
}
