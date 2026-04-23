import { Router } from "express";
import { buildAvailabilityResult } from "../services/availabilityService.js";
import { fetchFacilities } from "../services/facilitiesService.js";

export function createApiRouter() {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  router.get("/facilities", async (_request, response) => {
    try {
      const facilities = await fetchFacilities();
      response.set("Cache-Control", "public, max-age=300");
      response.json({
        facilities,
        generatedAt: new Date().toISOString(),
        sourceLabel: "NYC Open Data athletic facilities API",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load NYC Parks facilities.";
      response.status(500).json({ error: message });
    }
  });

  router.get("/availability", async (request, response) => {
    const { sport, startDate, endDate, borough = "All", fieldType = "" } = request.query;

    if (
      typeof sport !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      typeof borough !== "string" ||
      typeof fieldType !== "string"
    ) {
      response.status(400).json({ error: "Missing or invalid availability query parameters." });
      return;
    }

    try {
      const result = await buildAvailabilityResult({
        sport,
        startDate,
        endDate,
        borough,
        fieldType,
      });
      response.set("Cache-Control", "public, max-age=300");
      response.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load NYC Parks availability.";
      response.status(500).json({ error: message });
    }
  });

  return router;
}
