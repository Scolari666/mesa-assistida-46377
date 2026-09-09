export interface DayHours {
  open: string;
  close: string;
}

export type BusinessHours = Record<string, DayHours>;

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function localPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { dow: weekdayMap[weekdayShort] ?? 0, minutesOfDay: (hour % 24) * 60 + minute };
}

/**
 * Mirrors the server-side is_store_open_at() logic for display purposes only
 * (e.g. an "estamos fechados" banner). The RPC create_order() is the source
 * of truth and re-checks this independently before creating any order.
 */
export function isStoreOpen(hours: BusinessHours, at: Date = new Date()): boolean {
  const { dow, minutesOfDay } = localPartsInTimeZone(at, "America/Sao_Paulo");
  const prevDow = (dow + 6) % 7;

  const today = hours[String(dow)];
  if (today) {
    let close = timeToMinutes(today.close);
    const open = timeToMinutes(today.open);
    if (close === 0) close = 24 * 60;
    if (open <= close) {
      if (minutesOfDay >= open && minutesOfDay < close) return true;
    } else if (minutesOfDay >= open || minutesOfDay < close) {
      return true;
    }
  }

  const prev = hours[String(prevDow)];
  if (prev) {
    const open = timeToMinutes(prev.open);
    const close = timeToMinutes(prev.close);
    if (close !== 0 && open > close && minutesOfDay < close) return true;
  }

  return false;
}

export function formatDayLabel(dow: number): string {
  return DAY_LABELS[dow] ?? "";
}

export function formatHoursSummary(hours: BusinessHours): { day: string; range: string }[] {
  return Object.keys(hours)
    .map(Number)
    .sort((a, b) => a - b)
    .map((dow) => {
      const h = hours[String(dow)];
      return { day: formatDayLabel(dow), range: `${h.open} - ${h.close === "00:00" ? "00h" : h.close}` };
    });
}
