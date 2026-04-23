export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getDateRange(startIso: string, endIso: string) {
  const range: string[] = [];
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return range;
  }

  for (let current = start; current <= end; current = new Date(current.getTime() + MS_PER_DAY)) {
    range.push(current.toISOString().slice(0, 10));
  }

  return range;
}

export function formatDayLabel(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export function formatGeneratedAt(dateIso: string) {
  return new Date(dateIso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
