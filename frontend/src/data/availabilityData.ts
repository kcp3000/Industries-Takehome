import { addDays, getDateRange, todayIso } from "../lib/date";
import type {
  AvailabilityQuery,
  AvailabilityResult,
  Field,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://field-availability-console.onrender.com";

type FacilitySeed = {
  id: string;
  name: string;
  park: string;
  borough: Field["borough"];
  sports: Field["supportedSports"];
  surface: string;
  lights: boolean;
  locationHint: string;
  featureStatus: string;
  accessible: boolean;
};

let facilityCatalogPromise: Promise<FacilitySeed[]> | null = null;
const availabilityResultCache = new Map<string, AvailabilityResult>();
const availabilityRequestCache = new Map<string, Promise<AvailabilityResult>>();

export function getAvailabilityQueryKey(query: AvailabilityQuery) {
  return JSON.stringify([
    query.sport,
    query.startDate,
    query.endDate,
    query.borough,
    query.fieldType,
  ]);
}

export function getCachedAvailability(query: AvailabilityQuery) {
  return availabilityResultCache.get(getAvailabilityQueryKey(query)) ?? null;
}

export async function getFacilityCatalog() {
  if (!facilityCatalogPromise) {
    facilityCatalogPromise = fetch(`${API_BASE_URL}/api/facilities`).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load the NYC athletic facilities API.");
      }

      const payload = (await response.json()) as { facilities: FacilitySeed[] };
      return payload.facilities;
    });
  }

  return facilityCatalogPromise;
}

export async function loadInventorySeedAvailability(
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  const queryKey = getAvailabilityQueryKey(query);
  const cachedResult = availabilityResultCache.get(queryKey);

  if (cachedResult) {
    return cachedResult;
  }

  const inFlightRequest = availabilityRequestCache.get(queryKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const search = new URLSearchParams({
    sport: query.sport,
    startDate: query.startDate,
    endDate: query.endDate,
    borough: query.borough,
    fieldType: query.fieldType,
  });
  const request = fetch(`${API_BASE_URL}/api/availability?${search.toString()}`).then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to load the NYC Parks availability API.");
    }

    const result = (await response.json()) as AvailabilityResult;
    availabilityResultCache.set(queryKey, result);
    return result;
  });

  availabilityRequestCache.set(queryKey, request);

  try {
    return await request;
  } finally {
    availabilityRequestCache.delete(queryKey);
  }
}

export const DEFAULT_QUERY: AvailabilityQuery = {
  sport: "Soccer",
  startDate: todayIso(),
  endDate: addDays(todayIso(), 6),
  borough: "All",
  fieldType: "",
};
