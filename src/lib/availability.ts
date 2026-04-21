import type { AvailabilityResult, DailyAvailability } from "../types";

export function getCellTone(day: DailyAvailability) {
  const available = day.slots.filter((slot) => slot.status === "available").length;
  const closed = day.slots.every((slot) => slot.status === "closed");

  if (closed) {
    return "cell cell-closed";
  }
  if (available === 0) {
    return "cell cell-booked";
  }
  if (available === day.slots.length) {
    return "cell cell-open";
  }
  return "cell cell-mixed";
}

export function getDaySummary(day: DailyAvailability) {
  const available = day.slots.filter((slot) => slot.status === "available");
  const booked = day.slots.filter((slot) => slot.status === "booked");
  const closed = day.slots.filter((slot) => slot.status === "closed");

  if (closed.length === day.slots.length) {
    return "Closed";
  }
  if (available.length === day.slots.length) {
    return `${available.length} open slots`;
  }
  if (available.length === 0) {
    return "Fully booked";
  }
  return `${available.length} open / ${booked.length} booked`;
}

export function summarizeAvailability(result: AvailabilityResult | null) {
  const fields = result?.fields ?? [];
  const totalFields = fields.length;
  const totalDays = fields.reduce((sum, field) => sum + field.days.length, 0);
  const openCells = fields.reduce(
    (sum, field) =>
      sum +
      field.days.filter((day) => day.slots.some((slot) => slot.status === "available")).length,
    0,
  );

  return {
    totalFields,
    totalDays,
    openCells,
    fillRate: totalDays === 0 ? 0 : Math.round((openCells / totalDays) * 100),
  };
}
