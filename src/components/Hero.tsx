import type { DataSourceMode } from "../types";

type HeroProps = {
  mode: DataSourceMode;
};

export function Hero({ mode }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">M-Flat case study / React + TypeScript</p>
        <h1>Field Availability Console</h1>
        <p className="hero-text">
          Compare every field of a chosen type across a date range in one
          screen, instead of clicking pin by pin through a map.
        </p>
      </div>

      <div className="hero-card">
        <span className="pill">{mode === "inventory" ? "NYC inventory mode" : "Live mode"}</span>
        <strong>Designed for Monday-morning staff use</strong>
        <p>
          Fast scan, obvious status colors, and a details panel that keeps
          decision-making on one screen.
        </p>
      </div>
    </header>
  );
}
