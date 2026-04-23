import { HALF_HOUR_MS, parksAvailabilityEndpoint } from "../config.js";
import {
  formatDateInNewYork,
  formatTimeInNewYork,
  getDateRange,
  getWeekChunkStarts,
} from "../utils/date.js";
import { mapWithConcurrency } from "../utils/async.js";
import { fetchFacilities } from "./facilitiesService.js";

const availabilityCache = new Map();
const availabilityResultCache = new Map();
// Share a single in-flight build per query so duplicate reloads reuse the same
// backend work instead of starting another identical fetch pass.
const availabilityResultInFlightCache = new Map();
const AVAILABILITY_WINDOW_TTL_MS = 15 * 60 * 1000;
const AVAILABILITY_RESULT_TTL_MS = 10 * 60 * 1000;

function getAvailabilityResultCacheKey(query) {
  return JSON.stringify([
    query.sport,
    query.startDate,
    query.endDate,
    query.borough,
    query.fieldType,
  ]);
}

function isPendingPermit(slot) {
  return Boolean(slot.num_pending_permits) || (slot.permit_number && !slot.is_issued);
}

function mapAvailabilitySlot(slot) {
  if (!slot.in_season) {
    return {
      status: "closed",
      label: "Out of season",
      permitHolder: null,
    };
  }

  if (slot.is_issued) {
    return {
      status: "booked",
      label: "Permitted",
      permitHolder: slot.permit_holder ? String(slot.permit_holder) : null,
    };
  }

  if (isPendingPermit(slot)) {
    return {
      status: "booked",
      label: "Pending permit",
      permitHolder: slot.permit_holder ? String(slot.permit_holder) : null,
    };
  }

  return {
    status: "available",
    label: "Open",
    permitHolder: null,
  };
}

function groupDailySlots(rawSlots, closeTime) {
  if (rawSlots.length === 0) {
    return [
      {
        start: "00:00",
        end: closeTime ?? "23:59",
        status: "available",
        label: "Park close",
        hidden: true,
      },
    ];
  }

  const grouped = [];

  for (const slot of rawSlots) {
    const previous = grouped[grouped.length - 1];
    if (
      previous &&
      previous.status === slot.status &&
      previous.label === slot.label &&
      previous.end === slot.start
    ) {
      previous.end = slot.end;
      continue;
    }

    grouped.push({ ...slot });
  }

  return grouped;
}

async function fetchFieldAvailability(locationId, startDate) {
  const cacheKey = `${locationId}:${startDate}`;
  const cached = availabilityCache.get(cacheKey);

  // Lowest-level cache: one NYC Parks response per site/week window.
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const url = new URL(parksAvailabilityEndpoint);
  url.searchParams.set("location", locationId);
  url.searchParams.set("date", startDate);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      Referer: "https://www.nycgovparks.org/permits/field-and-court/map",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (!response.ok) {
    throw new Error(`NYC Parks availability request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  availabilityCache.set(cacheKey, {
    value: payload,
    expiresAt: Date.now() + AVAILABILITY_WINDOW_TTL_MS,
  });
  return payload;
}

function normalizeDailyAvailability(startDate, endDate, responses) {
  const dateRange = getDateRange(startDate, endDate);
  const slotsByDate = new Map(dateRange.map((date) => [date, []]));
  const closeByDate = new Map();

  for (const response of responses) {
    const availability = response?.availability ?? {};
    const close = response?.close ?? {};

    for (const [date, closeTime] of Object.entries(close)) {
      closeByDate.set(date, String(closeTime));
    }

    for (const [timestamp, slot] of Object.entries(availability)) {
      const start = new Date(Number(timestamp) * 1000);
      const end = new Date(start.getTime() + HALF_HOUR_MS);
      const dateIso = formatDateInNewYork(start);

      if (!slotsByDate.has(dateIso)) {
        continue;
      }

      const mapped = mapAvailabilitySlot(slot);
      slotsByDate.get(dateIso)?.push({
        start: formatTimeInNewYork(start),
        end: formatTimeInNewYork(end),
        status: mapped.status,
        label: mapped.label,
        permitHolder: mapped.permitHolder,
      });
    }
  }

  return dateRange.map((date) => {
    const rawSlots = (slotsByDate.get(date) ?? []).sort((left, right) =>
      left.start.localeCompare(right.start),
    );

    return {
      date,
      slots: groupDailySlots(rawSlots, closeByDate.get(date)),
    };
  });
}

async function resolveFacilityAvailability(facility, query, weekChunkStarts) {
  const availabilityWindows = await mapWithConcurrency(weekChunkStarts, 1, async (startDate) => {
    try {
      return await fetchFieldAvailability(facility.locationId, startDate);
    } catch {
      return null;
    }
  });

  const successfulWindows = availabilityWindows.filter(Boolean);

  if (successfulWindows.length === 0) {
    return null;
  }

  return {
    field: {
      id: facility.id,
      locationId: facility.locationId,
      name: facility.name,
      park: facility.park,
      borough: facility.borough,
      sport: query.sport,
      supportedSports: facility.sports,
      surface: facility.surface,
      lights: facility.lights,
      locationHint: facility.locationHint,
      accessible: facility.accessible,
      featureStatus: facility.featureStatus,
    },
    days: normalizeDailyAvailability(query.startDate, query.endDate, successfulWindows),
  };
}

export async function buildAvailabilityResult(query) {
  const resultCacheKey = getAvailabilityResultCacheKey(query);
  const cachedResult = availabilityResultCache.get(resultCacheKey);
  const inFlightResult = availabilityResultInFlightCache.get(resultCacheKey);

  // Full-query cache: if we already built this exact search recently, return it.
  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.value;
  }

  if (inFlightResult) {
    return inFlightResult;
  }

  const buildPromise = buildAvailabilityResultUncached(query, resultCacheKey);
  availabilityResultInFlightCache.set(resultCacheKey, buildPromise);

  try {
    return await buildPromise;
  } finally {
    availabilityResultInFlightCache.delete(resultCacheKey);
  }
}

async function buildAvailabilityResultUncached(query, resultCacheKey) {
  const facilities = await fetchFacilities();
  const normalizedFieldType = String(query.fieldType ?? "").trim().toLowerCase();
  const filteredFacilities = facilities
    .filter((facility) => facility.sports.includes(query.sport))
    .filter((facility) => query.borough === "All" || facility.borough === query.borough)
    .filter((facility) => !normalizedFieldType || facility.surface.toLowerCase() === normalizedFieldType)
    .sort((left, right) => {
      return (
        left.borough.localeCompare(right.borough) ||
        left.park.localeCompare(right.park) ||
        left.name.localeCompare(right.name)
      );
    });

  const skippedLocationIds = [];
  const weekChunkStarts = getWeekChunkStarts(query.startDate, query.endDate);

  const fieldResults = await mapWithConcurrency(filteredFacilities, 1, async (facility) => {
    const resolvedField = await resolveFacilityAvailability(facility, query, weekChunkStarts);

    if (!resolvedField) {
      skippedLocationIds.push(facility.locationId);
      return null;
    }

    return resolvedField;
  });

  const resolvedFields = fieldResults.filter(Boolean);
  const diagnostics = {
    matchedFacilities: filteredFacilities.length,
    availabilityResolvedFields: resolvedFields.length,
    skippedFields: filteredFacilities.length - resolvedFields.length,
    skippedLocationIds: skippedLocationIds.slice(0, 25),
  };

  console.log(
    `[availability] sport=${query.sport} matched=${diagnostics.matchedFacilities} resolved=${diagnostics.availabilityResolvedFields} skipped=${diagnostics.skippedFields}`,
  );

  const result = {
    fields: resolvedFields,
    generatedAt: new Date().toISOString(),
    sourceLabel: "NYC Open Data + NYC Parks permit availability APIs",
    disclaimer:
      "Facility inventory is sourced from the NYC Open Data Socrata API and slot availability is proxied from the NYC Parks field-and-court availability endpoint. Pending permits are treated as unavailable to avoid overstating open inventory.",
    diagnostics,
  };

  availabilityResultCache.set(resultCacheKey, {
    value: result,
    expiresAt: Date.now() + AVAILABILITY_RESULT_TTL_MS,
  });

  return result;
}
