import { addDays, getDateRange, todayIso } from "../lib/date";
import type {
  AvailabilityQuery,
  AvailabilityResult,
  DailyAvailability,
  Field,
  TimeSlot,
} from "../types";

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

export async function getFacilityCatalog() {
  if (!facilityCatalogPromise) {
    facilityCatalogPromise = fetch("/athleticFacilities.json").then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load the NYC athletic facilities dataset.");
      }
      return (await response.json()) as FacilitySeed[];
    });
  }

  return facilityCatalogPromise;
}

function hashCode(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function createSlots(field: Field, dateIso: string): TimeSlot[] {
  const seed = hashCode(`${field.id}-${dateIso}`);
  const weekday = new Date(`${dateIso}T12:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const shouldCloseEarly = !field.lights && !isWeekend;
  const rainyMaintenance = seed % 11 === 0;

  if (rainyMaintenance) {
    return [
      {
        start: "08:00",
        end: "20:00",
        status: "closed",
        label: "Maintenance closure",
      },
    ];
  }

  const template = isWeekend
    ? [
        ["08:00", "10:00"],
        ["10:30", "12:30"],
        ["13:00", "15:00"],
        ["15:30", "17:30"],
      ]
    : [
        ["15:30", "17:30"],
        ["18:00", "20:00"],
        ["20:15", "22:00"],
      ];

  return template
    .filter((slot, index) => !(shouldCloseEarly && index === template.length - 1))
    .map(([start, end], index) => {
      const score = (seed + index * 7) % 10;
      if (score <= 2) {
        return { start, end, status: "available", label: "Open" } satisfies TimeSlot;
      }
      if (score <= 7) {
        return { start, end, status: "booked", label: "Permitted" } satisfies TimeSlot;
      }
      return { start, end, status: "available", label: "Likely open" } satisfies TimeSlot;
    });
}

function buildDays(field: Field, dates: string[]): DailyAvailability[] {
  return dates.map((date) => ({
    date,
    slots: createSlots(field, date),
  }));
}

export async function loadInventorySeedAvailability(
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  const fieldCatalog = await getFacilityCatalog();
  const dates = getDateRange(query.startDate, query.endDate);
  const normalizedFieldType = query.fieldType.trim().toLowerCase();

  const fields = fieldCatalog.filter((facility) => {
    if (!facility.sports.includes(query.sport)) {
      return false;
    }
    if (query.borough !== "All" && facility.borough !== query.borough) {
      return false;
    }
    if (normalizedFieldType && facility.surface.toLowerCase() !== normalizedFieldType) {
      return false;
    }
    return true;
  })
    .sort((left, right) => {
      return (
        left.borough.localeCompare(right.borough) ||
        left.park.localeCompare(right.park) ||
        left.name.localeCompare(right.name)
      );
    })
    .map((facility) => {
      const field: Field = {
        id: facility.id,
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
      };

      return {
        field,
        days: buildDays(field, dates),
      };
    });

  await new Promise((resolve) => setTimeout(resolve, 120));

  return {
    fields,
    generatedAt: new Date().toISOString(),
    sourceLabel: "NYC Open Data athletic facilities dataset",
    disclaimer:
      "Facility inventory is loaded from a local dataset snapshot derived from the NYC Open Data Athletic Facilities dataset (qnem-b8re). Availability slots are still simulated because the public dataset does not expose a ready-made permit calendar.",
  };
}

export const DEFAULT_QUERY: AvailabilityQuery = {
  sport: "Soccer",
  startDate: todayIso(),
  endDate: addDays(todayIso(), 6),
  borough: "All",
  fieldType: "",
};
