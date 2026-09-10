import { describe, it, expect } from "vitest";
import { generateSlots, zonedWallTimeToUtc, isSlotAvailable } from "@/lib/slots";
import type { Availability } from "@/content/availability";

const av: Availability = {
  timezone: "Europe/Moscow",
  weekly: {
    0: [],
    1: [["12:00", "15:00"]],
    2: [["12:00", "15:00"]],
    3: [["12:00", "15:00"]],
    4: [["12:00", "15:00"]],
    5: [["12:00", "15:00"]],
    6: [],
  },
  slotStepMinutes: 60,
  bufferMinutes: 15,
  leadTimeHours: 24,
  horizonDays: 21,
  blackoutDates: [],
};

// Понедельник, 13 января 2025.
const monday = "2025-01-13";

describe("zonedWallTimeToUtc", () => {
  it("переводит московское время в UTC (МСК = UTC+3)", () => {
    const utc = zonedWallTimeToUtc(2025, 1, 13, 12, 0, "Europe/Moscow");
    expect(utc.toISOString()).toBe("2025-01-13T09:00:00.000Z");
  });
});

describe("generateSlots", () => {
  const now = new Date("2025-01-01T00:00:00.000Z"); // задолго до окна — lead-time не мешает

  it("делает слоты по шаблону (12:00, 13:00 при часовой встрече в окне 12–15)", () => {
    const slots = generateSlots({
      from: new Date(`${monday}T00:00:00.000Z`),
      to: new Date(`${monday}T23:59:59.000Z`),
      durationMin: 60,
      now,
      availability: av,
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).toEqual([
      `${monday}T09:00:00.000Z`,
      `${monday}T10:00:00.000Z`,
      `${monday}T11:00:00.000Z`,
    ]);
  });

  it("не выдаёт слоты в выходной (воскресенье)", () => {
    const sunday = "2025-01-12";
    const slots = generateSlots({
      from: new Date(`${sunday}T00:00:00.000Z`),
      to: new Date(`${sunday}T23:59:59.000Z`),
      durationMin: 60,
      now,
      availability: av,
    });
    expect(slots).toHaveLength(0);
  });

  it("уважает lead-time", () => {
    const slots = generateSlots({
      from: new Date(`${monday}T00:00:00.000Z`),
      to: new Date(`${monday}T23:59:59.000Z`),
      durationMin: 60,
      now: new Date(`${monday}T09:30:00.000Z`), // за 30 мин до окна, lead-time 24ч
      availability: av,
    });
    expect(slots).toHaveLength(0);
  });

  it("вычитает занятые интервалы с буфером", () => {
    const slots = generateSlots({
      from: new Date(`${monday}T00:00:00.000Z`),
      to: new Date(`${monday}T23:59:59.000Z`),
      durationMin: 60,
      now,
      availability: av,
      busy: [
        {
          start: new Date(`${monday}T10:00:00.000Z`),
          end: new Date(`${monday}T11:00:00.000Z`),
        },
      ],
    });
    const times = slots.map((s) => s.toISOString());
    // 10:00 занят; 09:00 (кончается 10:00) и 11:00 (начинается 11:00) отсекаются буфером 15 мин
    expect(times).toEqual([]);
  });

  it("длинная встреча (90 мин) не помещается сеткой по 60 мин в окне 3ч дважды", () => {
    const slots = generateSlots({
      from: new Date(`${monday}T00:00:00.000Z`),
      to: new Date(`${monday}T23:59:59.000Z`),
      durationMin: 90,
      now,
      availability: av,
    });
    const times = slots.map((s) => s.toISOString());
    expect(times).toEqual([`${monday}T09:00:00.000Z`, `${monday}T10:00:00.000Z`]);
  });

  it("blackoutDates исключают день", () => {
    const slots = generateSlots({
      from: new Date(`${monday}T00:00:00.000Z`),
      to: new Date(`${monday}T23:59:59.000Z`),
      durationMin: 60,
      now,
      availability: { ...av, blackoutDates: [monday] },
    });
    expect(slots).toHaveLength(0);
  });
});

describe("isSlotAvailable", () => {
  it("true для валидного слота из шаблона", () => {
    const now = new Date("2025-01-10T00:00:00.000Z");
    const slot = new Date("2025-01-13T09:00:00.000Z");
    expect(isSlotAvailable(slot, 60, av, [], now)).toBe(true);
  });

  it("false для слота вне сетки", () => {
    const now = new Date("2025-01-10T00:00:00.000Z");
    const slot = new Date("2025-01-13T09:30:00.000Z");
    expect(isSlotAvailable(slot, 60, av, [], now)).toBe(false);
  });
});
