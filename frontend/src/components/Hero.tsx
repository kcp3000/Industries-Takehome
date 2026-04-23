export function Hero() {
  return (
    <header className="hero">
      <div className="hero-copy">
        <div className="hero-brand">
          <img
            className="hero-logo"
            src="/nyc-parks-logo.svg"
            alt="NYC Parks logo"
          />
          <div>
            <p className="eyebrow">M-Flat case study / React + TypeScript</p>
            <h1>Field Availability Console</h1>
          </div>
        </div>
        <p className="hero-text">
          Compare every field of a chosen type across a date range in one
          screen, instead of clicking pin by pin through a map.
        </p>
      </div>

      <div className="hero-card">
        <span className="pill">NYC inventory</span>
        <strong>Designed for Monday-morning staff use</strong>
        <p>
          Fast scan, obvious status colors, and a details panel that keeps
          decision-making on one screen.
        </p>
      </div>
    </header>
  );
}
