export const SPORT_OPTIONS = [
  "Soccer",
  "Baseball",
  "Basketball",
  "Softball",
  "Volleyball",
] as const;

export type Sport = (typeof SPORT_OPTIONS)[number];

export type DataSourceMode = "inventory" | "live";

export type Field = {
  id: string;
  name: string;
  park: string;
  borough: "Bronx" | "Brooklyn" | "Manhattan" | "Queens" | "Staten Island";
  sport: Sport;
  supportedSports: Sport[];
  surface: string;
  lights: boolean;
  locationHint: string;
  accessible: boolean;
  featureStatus: string;
};

export type TimeSlot = {
  start: string;
  end: string;
  status: "available" | "booked" | "closed";
  label: string;
};

export type DailyAvailability = {
  date: string;
  slots: TimeSlot[];
};

export type FieldAvailability = {
  field: Field;
  days: DailyAvailability[];
};

export type AvailabilityQuery = {
  sport: Sport;
  startDate: string;
  endDate: string;
  borough: string;
  search: string;
  mode: DataSourceMode;
};

export type AvailabilityResult = {
  fields: FieldAvailability[];
  generatedAt: string;
  sourceLabel: string;
  disclaimer: string;
};
