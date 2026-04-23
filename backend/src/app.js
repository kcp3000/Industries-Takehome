import cors from "cors";
import express from "express";
import { createApiRouter } from "./routes/api.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/favicon.ico", (_request, response) => {
    response.status(204).end();
  });

  app.get("/", (_request, response) => {
    response.type("text/plain").send(
      "NYC Parks backend is running. Use /api/health or /api/facilities.",
    );
  });

  app.use("/api", createApiRouter());

  return app;
}
