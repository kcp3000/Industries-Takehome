import { loadInventorySeedAvailability } from "./availabilityData";
import type { AvailabilityQuery, AvailabilityResult } from "../types";

export async function loadAvailability(
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  return loadInventorySeedAvailability(query);
}
