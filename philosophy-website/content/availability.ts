/**
 * Правила доступности для записи.
 * Слоты на сайте = (этот шаблон) − (занятость в Google Calendar) − (уже созданные брони).
 *
 * Время указывается в поясе `timezone`.
 * Ключи `weekly` — день недели по JS: 0 = воскресенье, 1 = понедельник, … 6 = суббота.
 */

export type TimeWindow = [start: string, end: string]; // "HH:MM"

export const availability = {
  timezone: "Europe/Moscow",

  /** Рабочие окна по дням недели. Пустой массив = выходной. */
  weekly: {
    0: [] as TimeWindow[], // Вс
    1: [["12:00", "19:00"]] as TimeWindow[], // Пн
    2: [["12:00", "19:00"]] as TimeWindow[], // Вт
    3: [["12:00", "19:00"]] as TimeWindow[], // Ср
    4: [["12:00", "19:00"]] as TimeWindow[], // Чт
    5: [["12:00", "17:00"]] as TimeWindow[], // Пт
    6: [] as TimeWindow[], // Сб
  } as Record<number, TimeWindow[]>,

  /** Шаг сетки старта слотов, минуты. */
  slotStepMinutes: 60,

  /** Буфер после каждой встречи (не показывать слот, если он налезает), минуты. */
  bufferMinutes: 15,

  /** Минимальный запас времени до встречи, часы. */
  leadTimeHours: 24,

  /** На сколько дней вперёд открыта запись. */
  horizonDays: 21,

  /** Конкретные даты-исключения (отпуск и т.п.), формат "YYYY-MM-DD". */
  blackoutDates: [] as string[],
};

export type Availability = typeof availability;
