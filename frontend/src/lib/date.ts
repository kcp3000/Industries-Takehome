export const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatLocalDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return formatLocalDateIso(new Date());
}

export function addDays(dateIso: string, days: number) {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDateIso(date);
}

export function getDateRange(startIso: string, endIso: string) {
  const range: string[] = [];
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return range;
  }

  for (let current = start; current <= end; current = new Date(current.getTime() + MS_PER_DAY)) {
    range.push(formatLocalDateIso(current));
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

export function formatSlotTime(timeIso: string | undefined, fallbackTime: string) {
  if (!timeIso) {
    if (fallbackTime === "N/A") {
      return fallbackTime;
    }

    const [hourString, minuteString] = fallbackTime.split(":");
    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return fallbackTime;
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(2000, 0, 1, hour, minute));
  }

  return new Date(timeIso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
