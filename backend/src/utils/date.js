import { NEW_YORK_TIME_ZONE } from "../config.js";

function createDateFormatter() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_YORK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function createTimeFormatter() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: NEW_YORK_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const dateFormatter = createDateFormatter();
const timeFormatter = createTimeFormatter();

function getDateParts(value) {
  return dateFormatter.formatToParts(value);
}

export function formatDateInNewYork(value) {
  const parts = getDateParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function formatTimeInNewYork(value) {
  return timeFormatter.format(value);
}

function formatLocalDateIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateIso, days) {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDateIso(date);
}

export function getDateRange(startIso, endIso) {
  const range = [];
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);

  for (let current = start; current <= end; current = new Date(current.getTime() + 86400000)) {
    range.push(formatLocalDateIso(current));
  }

  return range;
}

export function getWeekChunkStarts(startIso, endIso) {
  const starts = [];

  for (let current = startIso; current <= endIso; current = addDays(current, 7)) {
    starts.push(current);
  }

  return starts;
}
