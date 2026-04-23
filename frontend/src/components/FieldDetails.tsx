import { formatDayLabel } from "../lib/date";
import { getDaySummary } from "../lib/availability";
import type { FieldAvailability } from "../types";

type FieldDetailsProps = {
  selectedField: FieldAvailability | null;
};

export function FieldDetails({ selectedField }: FieldDetailsProps) {
  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <h2>Selected Field</h2>
        <p>Inspect the slot pattern without leaving the calendar.</p>
      </div>

      {selectedField ? (
        <div className="detail-stack">
          <div className="detail-card">
            <h3>{selectedField.field.name}</h3>
            <p>{selectedField.field.park}</p>
            <ul className="detail-list">
              <li>{selectedField.field.borough}</li>
              <li>{selectedField.field.locationHint}</li>
              <li>{selectedField.field.surface}</li>
              <li>{selectedField.field.lights ? "Lights available" : "Daylight only"}</li>
              <li>Location ID: {selectedField.field.locationId}</li>
            </ul>
          </div>

          {selectedField.days.map((day) => (
            (() => {
              const visibleSlots = day.slots.filter((slot) => !slot.hidden);

              return (
                <div key={day.date} className="day-card">
                  <div className="day-header">
                    <strong>{formatDayLabel(day.date)}</strong>
                    <span>{getDaySummary(day)}</span>
                  </div>

                  {visibleSlots.length > 0 ? (
                    <div className="slot-list">
                      {visibleSlots.map((slot) => (
                        <div key={`${day.date}-${slot.start}-${slot.end}`} className="slot-item">
                          <div>
                            <span>
                              {slot.start} - {slot.end}
                            </span>
                            {slot.permitHolder ? (
                              <div>{slot.permitHolder}</div>
                            ) : null}
                          </div>
                          <span className={`slot-tag slot-${slot.status}`}>{slot.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="slot-list">
                      <div className="slot-item">
                        <span>No active bookings listed</span>
                        <span className="slot-tag slot-available">Open</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No field selected</strong>
          <p>Pick a row in the availability board to inspect its daily slot details.</p>
        </div>
      )}
    </section>
  );
}
