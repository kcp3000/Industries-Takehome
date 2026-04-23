import {
  BOROUGH_MAP,
  PRIMARY_SPORT_MAP,
  SPORT_FLAG_MAP,
} from "../constants/facilityMaps.js";
import { socrataAppToken, socrataEndpoint } from "../config.js";

const facilitiesCache = {
  value: null,
  expiresAt: 0,
};

function isTruthy(value) {
  return value === true || value === "true";
}

function getSupportedSports(record) {
  const sports = new Set();
  const primarySports = PRIMARY_SPORT_MAP[String(record.primary_sport ?? "")] ?? [];

  for (const sport of primarySports) {
    sports.add(sport);
  }

  for (const [key, label] of Object.entries(SPORT_FLAG_MAP)) {
    if (isTruthy(record[key])) {
      sports.add(label);
    }
  }

  return [...sports];
}

function normalizeFacility(record) {
  const supportedSports = getSupportedSports(record);
  const primarySport = supportedSports[0] ?? "Field";
  const fieldNumber = record.field_number ? String(record.field_number).padStart(2, "0") : "01";
  const zipcode = record.zipcode ? `ZIP ${record.zipcode}` : "ZIP unavailable";
  const dimensions = record.dimensions ? String(record.dimensions) : "Dimensions unavailable";

  return {
    id: String(record.system ?? `${record.gispropnum ?? "site"}-${fieldNumber}`),
    locationId: String(record.system ?? `${record.gispropnum ?? "site"}-${fieldNumber}`),
    name: `${primarySport} ${fieldNumber}`,
    park: `Site ${String(record.gispropnum ?? "Unknown")}`,
    borough: BOROUGH_MAP[String(record.borough ?? "")] ?? "Manhattan",
    sports: supportedSports,
    surface: String(record.surface_type ?? "Unknown"),
    lights: Boolean(record.field_lighted),
    locationHint: `${dimensions} / ${zipcode}`,
    featureStatus: String(record.featurestatus ?? "Unknown"),
    accessible: Boolean(record.accessible),
  };
}

function extractRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.value) ? payload.value : [];
}

export async function fetchFacilities() {
  if (!socrataAppToken) {
    throw new Error("Missing SOCRATA_APP_TOKEN in backend environment.");
  }

  if (facilitiesCache.value && facilitiesCache.expiresAt > Date.now()) {
    return facilitiesCache.value;
  }

  const allRows = [];
  const pageSize = 2000;
  let pageNumber = 1;

  while (true) {
    const response = await fetch(socrataEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Token": socrataAppToken,
      },
      body: JSON.stringify({
        query: "SELECT *",
        page: {
          pageNumber,
          pageSize,
        },
        includeSynthetic: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Socrata request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    const rows = extractRows(payload);
    allRows.push(...rows);

    if (rows.length < pageSize) {
      break;
    }

    pageNumber += 1;
  }

  const facilities = allRows.map(normalizeFacility).filter((facility) => facility.sports.length > 0);
  facilitiesCache.value = facilities;
  facilitiesCache.expiresAt = Date.now() + 10 * 60 * 1000;
  return facilities;
}
