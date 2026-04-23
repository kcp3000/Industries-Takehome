export const port = Number(process.env.PORT ?? 3001);

export const socrataEndpoint =
  process.env.SOCRATA_API_URL ??
  "https://data.cityofnewyork.us/api/v3/views/qnem-b8re/query.json";

export const socrataAppToken = process.env.SOCRATA_APP_TOKEN;

export const parksAvailabilityEndpoint =
  process.env.NYC_PARKS_AVAILABILITY_URL ??
  "https://www.nycgovparks.org/api/athletic-fields";

export const NEW_YORK_TIME_ZONE = "America/New_York";
export const HALF_HOUR_MS = 30 * 60 * 1000;
