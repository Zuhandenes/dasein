import { availability } from "@/content/availability";

const TZ = availability.timezone;

const dateFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  weekday: "long",
});

const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "15 марта, суббота" */
export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

/** "14:00" */
export function formatTime(d: Date | string): string {
  return timeFmt.format(new Date(d));
}

/** "15 марта, суббота, 14:00 (МСК)" */
export function formatDateTime(d: Date | string): string {
  return `${formatDate(d)}, ${formatTime(d)} (МСК)`;
}

/** Ключ дня в таймзоне: "2025-03-15" — для группировки слотов. */
export function dayKey(d: Date | string): string {
  return dayKeyFmt.format(new Date(d));
}

export function formatPrice(rub: number): string {
  return new Intl.NumberFormat("ru-RU").format(rub) + " ₽";
}
