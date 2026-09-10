/**
 * Чистая логика генерации свободных слотов.
 * Никаких обращений к БД / сети — всё передаётся аргументами, поэтому легко тестируется.
 */

import type { Availability } from "@/content/availability";

export type Interval = { start: Date; end: Date };

export type SlotQuery = {
  /** Начало окна выдачи (UTC) */
  from: Date;
  /** Конец окна выдачи (UTC) */
  to: Date;
  /** Длительность встречи, минуты */
  durationMin: number;
  /** «Сейчас» — для проверки lead-time (по умолчанию new Date()) */
  now?: Date;
  availability: Availability;
  /** Занятые интервалы: брони + занятость календаря */
  busy?: Interval[];
};

const MS_MIN = 60_000;

/** На сколько миллисекунд `timeZone` опережает UTC в момент `date`. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - date.getTime();
}

/** Настенное время (y, m, d, h, min) в зоне `timeZone` → момент UTC. */
export function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

function parseHm(hm: string): [number, number] {
  const [h, m] = hm.split(":").map(Number);
  return [h, m ?? 0];
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime();
}

/**
 * Возвращает отсортированный список стартов свободных слотов (UTC).
 */
export function generateSlots(q: SlotQuery): Date[] {
  const { from, to, durationMin, availability } = q;
  const now = q.now ?? new Date();
  const busy = q.busy ?? [];
  const tz = availability.timezone;
  const bufferMs = availability.bufferMinutes * MS_MIN;
  const durationMs = durationMin * MS_MIN;
  const earliest = new Date(
    Math.max(from.getTime(), now.getTime() + availability.leadTimeHours * 3600_000),
  );

  const result: Date[] = [];

  // Идём по календарным датам от `from` до `to` включительно.
  // Берём чуть шире по краям, чтобы не потерять слоты из-за смещения зоны.
  const dayCursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const lastDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  lastDay.setUTCDate(lastDay.getUTCDate() + 1);

  while (dayCursor.getTime() <= lastDay.getTime()) {
    const y = dayCursor.getUTCFullYear();
    const m = dayCursor.getUTCMonth() + 1;
    const d = dayCursor.getUTCDate();
    const weekday = dayCursor.getUTCDay(); // 0..6, совпадает с ключами availability.weekly
    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);

    if (availability.blackoutDates.includes(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`)) {
      continue;
    }

    const windows = availability.weekly[weekday] ?? [];
    for (const [startHm, endHm] of windows) {
      const [sh, sm] = parseHm(startHm);
      const [eh, em] = parseHm(endHm);
      const windowEnd = zonedWallTimeToUtc(y, m, d, eh, em, tz);

      let slotStart = zonedWallTimeToUtc(y, m, d, sh, sm, tz);
      while (slotStart.getTime() + durationMs <= windowEnd.getTime() + 1) {
        const slotEnd = new Date(slotStart.getTime() + durationMs);
        const withBuffer: Interval = {
          start: new Date(slotStart.getTime() - bufferMs),
          end: new Date(slotEnd.getTime() + bufferMs),
        };

        const inRange =
          slotStart.getTime() >= earliest.getTime() && slotStart.getTime() <= to.getTime();
        const free = !busy.some((b) => overlaps(withBuffer, b));

        if (inRange && free) result.push(new Date(slotStart));

        slotStart = new Date(slotStart.getTime() + availability.slotStepMinutes * MS_MIN);
      }
    }
  }

  result.sort((a, b) => a.getTime() - b.getTime());
  // Уникализируем на случай пересечения окон.
  return result.filter((v, i, arr) => i === 0 || v.getTime() !== arr[i - 1].getTime());
}

/** Проверка одного конкретного слота на свободность (используется при создании брони). */
export function isSlotAvailable(
  slotStart: Date,
  durationMin: number,
  availability: Availability,
  busy: Interval[],
  now: Date = new Date(),
): boolean {
  const horizonEnd = new Date(now.getTime() + availability.horizonDays * 86_400_000);
  const slots = generateSlots({
    from: new Date(now.getTime() - 86_400_000),
    to: horizonEnd,
    durationMin,
    now,
    availability,
    busy,
  });
  return slots.some((s) => s.getTime() === slotStart.getTime());
}

export { ymd };
