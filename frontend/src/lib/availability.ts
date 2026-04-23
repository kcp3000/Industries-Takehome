import type { AvailabilityResult, DailyAvailability } from "../types";

function getVisibleSlots(day: DailyAvailability) {
  return day.slots.filter((slot) => !slot.hidden);
}

function getSlotDurationHours(start: string, end: string) {
  if (start === "N/A" || end === "N/A") {
    return 0;
  }

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return Math.max(0, (endTotalMinutes - startTotalMinutes) / 60);
}

export function getBookedHours(day: DailyAvailability) {
  return getVisibleSlots(day)
    .filter((slot) => slot.status === "booked")
    .reduce((sum, slot) => sum + getSlotDurationHours(slot.start, slot.end), 0);
}

export function getCellTone(day: DailyAvailability) {
  const visibleSlots = getVisibleSlots(day);
  const bookedHours = getBookedHours(day);
  const closed = visibleSlots.length > 0 && visibleSlots.every((slot) => slot.status === "closed");

  if (visibleSlots.length === 0) {
    return "cell cell-open";
  }

  if (closed) {
    return "cell cell-closed";
  }
  if (bookedHours < 5) {
    return "cell cell-open";
  }
  if (bookedHours < 8) {
    return "cell cell-mixed";
  }
  if (bookedHours >= 8) {
    return "cell cell-booked";
  }
  return "cell cell-open";
}

export function getDaySummary(day: DailyAvailability) {
  const visibleSlots = getVisibleSlots(day);
  const bookedHours = getBookedHours(day);
  const closed = visibleSlots.filter((slot) => slot.status === "closed");

  if (visibleSlots.length === 0) {
    return "Open";
  }

  if (closed.length === visibleSlots.length) {
    return "Closed";
  }
  if (bookedHours < 5) {
    return "Open";
  }
  if (bookedHours < 8) {
    return `${bookedHours.toFixed(1)} booked hours`;
  }
  return "Fully booked";
}

export function summarizeAvailability(result: AvailabilityResult | null) {
  const fields = result?.fields ?? [];
  const totalFields = fields.length;
  const totalDays = fields.reduce((sum, field) => sum + field.days.length, 0);
  const openCells = fields.reduce(
    (sum, field) =>
      sum + field.days.filter((day) => getCellTone(day) === "cell cell-open").length,
    0,
  );

  return {
    totalFields,
    totalDays,
    openCells,
    fillRate: totalDays === 0 ? 0 : Math.round((openCells / totalDays) * 100),
  };
}
