import type { TimeSlot } from "../types";

type StatusPillProps = {
  label: string;
  status: TimeSlot["status"];
};

export function StatusPill({ label, status }: StatusPillProps) {
  return <span className={`status-pill status-pill-${status}`}>{label}</span>;
}
