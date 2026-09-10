/**
 * Google Calendar через сервисный аккаунт.
 * Календарь должен быть расшарен на email сервисного аккаунта с правом
 * «Внесение изменений в мероприятия».
 *
 * Если GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_CALENDAR_ID не заданы —
 * все методы становятся безопасными no-op (сайт продолжает работать
 * на шаблоне доступности + бронях из БД).
 */

import { google } from "googleapis";
import { env, isGoogleEnabled } from "@/lib/env";
import type { Interval } from "@/lib/slots";

function loadCredentials(): { client_email: string; private_key: string } | null {
  const raw = env.google.serviceAccountJson.trim();
  if (!raw) return null;
  const json = raw.startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(json);
  return {
    client_email: parsed.client_email,
    private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
  };
}

function calendarClient() {
  const creds = loadCredentials();
  if (!creds) return null;
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

/** Занятые интервалы в календаре за период. */
export async function getBusyIntervals(from: Date, to: Date): Promise<Interval[]> {
  if (!isGoogleEnabled()) return [];
  try {
    const calendar = calendarClient();
    if (!calendar) return [];
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: [{ id: env.google.calendarId }],
      },
    });
    const busy = res.data.calendars?.[env.google.calendarId]?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch (err) {
    console.error("[gcal] freebusy failed, treating as no busy intervals:", err);
    return [];
  }
}

export type CalendarEventInput = {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  timeZone: string;
  attendeeEmail?: string;
};

/** Создаёт событие, возвращает его id (или null, если интеграция выключена/ошибка). */
export async function createEvent(input: CalendarEventInput): Promise<string | null> {
  if (!isGoogleEnabled()) return null;
  try {
    const calendar = calendarClient();
    if (!calendar) return null;
    const res = await calendar.events.insert({
      calendarId: env.google.calendarId,
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.start.toISOString(), timeZone: input.timeZone },
        end: { dateTime: input.end.toISOString(), timeZone: input.timeZone },
        ...(input.attendeeEmail
          ? { attendees: [{ email: input.attendeeEmail }] }
          : {}),
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("[gcal] createEvent failed:", err);
    return null;
  }
}

export async function patchEvent(
  eventId: string,
  patch: { summary?: string; description?: string },
): Promise<void> {
  if (!isGoogleEnabled() || !eventId) return;
  try {
    const calendar = calendarClient();
    if (!calendar) return;
    await calendar.events.patch({
      calendarId: env.google.calendarId,
      eventId,
      requestBody: patch,
    });
  } catch (err) {
    console.error("[gcal] patchEvent failed:", err);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  if (!isGoogleEnabled() || !eventId) return;
  try {
    const calendar = calendarClient();
    if (!calendar) return;
    await calendar.events.delete({ calendarId: env.google.calendarId, eventId });
  } catch (err) {
    console.error("[gcal] deleteEvent failed:", err);
  }
}
