import { loadInventorySeedAvailability } from "./sampleData";
import type { AvailabilityQuery, AvailabilityResult } from "../types";

export async function loadAvailability(
  query: AvailabilityQuery,
): Promise<AvailabilityResult> {
  if (query.mode === "live") {
    throw new Error(
      "Live NYC Parks loading is intentionally stubbed in this environment because outbound network access is blocked. The app structure is ready for a live adapter or proxy next.",
    );
  }

  return loadInventorySeedAvailability(query);
}
