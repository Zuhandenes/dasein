import type { Booking } from "@prisma/client";
import { prisma } from "@/lib/db";
import { availability } from "@/content/availability";
import { getService } from "@/content/services";
import { site } from "@/content/site";
import { generateSlots, isSlotAvailable, type Interval } from "@/lib/slots";
import { getBusyIntervals, createEvent, patchEvent } from "@/lib/google-calendar";
import { sendTelegram } from "@/lib/telegram";
import { sendEmail } from "@/lib/email";
import { formatDateTime, formatPrice } from "@/lib/format";
import { env } from "@/lib/env";
import type { BookingInput } from "@/lib/validation";

const ACTIVE_STATUSES = ["pending_payment", "paid", "confirmed"];

/** Занятость на период: активные брони из БД + занятость Google Calendar. */
export async function collectBusy(
  from: Date,
  to: Date,
  opts: { excludeBookingId?: string } = {},
): Promise<Interval[]> {
  const [dbBookings, gcalBusy] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        endsAt: { gt: from },
        startsAt: { lt: to },
        ...(opts.excludeBookingId ? { id: { not: opts.excludeBookingId } } : {}),
      },
      select: { startsAt: true, endsAt: true },
    }),
    getBusyIntervals(from, to),
  ]);

  return [
    ...dbBookings.map((b) => ({ start: b.startsAt, end: b.endsAt })),
    ...gcalBusy,
  ];
}

export async function getAvailableSlots(
  serviceSlug: string,
  from: Date,
  to: Date,
): Promise<string[]> {
  const service = getService(serviceSlug);
  if (!service) return [];
  const busy = await collectBusy(from, to);
  const slots = generateSlots({
    from,
    to,
    durationMin: service.durationMin,
    availability,
    busy,
  });
  return slots.map((d) => d.toISOString());
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("Slot is no longer available");
    this.name = "SlotUnavailableError";
  }
}

/** Создаёт бронь в статусе pending_payment + событие в календаре. */
export async function createPendingBooking(input: BookingInput): Promise<Booking> {
  const service = getService(input.serviceSlug);
  if (!service || !service.bookable) throw new Error("Unknown service");

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const now = new Date();

  const busy = await collectBusy(
    new Date(now.getTime() - 86_400_000),
    new Date(now.getTime() + (availability.horizonDays + 1) * 86_400_000),
  );
  if (!isSlotAvailable(startsAt, service.durationMin, availability, busy, now)) {
    throw new SlotUnavailableError();
  }

  const booking = await prisma.booking.create({
    data: {
      serviceSlug: service.slug,
      serviceName: service.name,
      priceRub: service.priceRub,
      durationMin: service.durationMin,
      startsAt,
      endsAt,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      telegram: input.telegram || null,
      message: input.message || null,
      status: "pending_payment",
    },
  });

  const gcalEventId = await createEvent({
    summary: `[Не оплачено] ${service.name} — ${booking.name}`,
    description: bookingDescription(booking),
    start: startsAt,
    end: endsAt,
    timeZone: availability.timezone,
    attendeeEmail: booking.email,
  });
  if (gcalEventId) {
    await prisma.booking.update({ where: { id: booking.id }, data: { gcalEventId } });
    booking.gcalEventId = gcalEventId;
  }

  await notifyAdminNewBooking(booking);
  return booking;
}

/** Идемпотентно помечает бронь оплаченной, обновляет календарь и шлёт уведомления. */
export async function markBookingPaid(
  orderId: string,
  paymentId: string,
): Promise<{ ok: boolean; alreadyDone?: boolean }> {
  const booking = await prisma.booking.findUnique({ where: { id: orderId } });
  if (!booking) return { ok: false };
  if (booking.status === "confirmed") return { ok: true, alreadyDone: true };

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "confirmed", paymentId },
  });

  if (updated.gcalEventId) {
    await patchEvent(updated.gcalEventId, {
      summary: `${updated.serviceName} — ${updated.name}`,
      description: bookingDescription(updated),
    });
  }

  await Promise.all([
    notifyAdminPaid(updated),
    notifyClientConfirmed(updated),
  ]);

  return { ok: true };
}

/** Отмена брони (например, оплата не прошла и слот нужно освободить вручную). */
export async function cancelBooking(orderId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: orderId } });
  if (!booking || booking.status === "confirmed") return;
  await prisma.booking.update({ where: { id: booking.id }, data: { status: "cancelled" } });
  if (booking.gcalEventId) {
    await patchEvent(booking.gcalEventId, {
      summary: `[Отменено] ${booking.serviceName} — ${booking.name}`,
    });
  }
}

// --- тексты уведомлений -------------------------------------------------------

function bookingDescription(b: Booking): string {
  return [
    `Услуга: ${b.serviceName}`,
    `Когда: ${formatDateTime(b.startsAt)}`,
    `Клиент: ${b.name}`,
    `Email: ${b.email}`,
    b.phone ? `Телефон: ${b.phone}` : null,
    b.telegram ? `Telegram: ${b.telegram}` : null,
    b.message ? `Запрос: ${b.message}` : null,
    `Статус: ${b.status}`,
    `ID брони: ${b.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function notifyAdminNewBooking(b: Booking): Promise<void> {
  const text = [
    "🆕 <b>Новая бронь — ожидает оплаты</b>",
    `${b.serviceName}`,
    `${formatDateTime(b.startsAt)}`,
    `${b.name} · ${b.email}${b.phone ? " · " + b.phone : ""}${b.telegram ? " · " + b.telegram : ""}`,
    b.message ? `Запрос: ${b.message}` : "",
    `Сумма: ${formatPrice(b.priceRub)}`,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([
    sendTelegram(text),
    sendEmail({
      to: env.mail.admin,
      subject: `Новая бронь: ${b.serviceName} — ${b.name}`,
      text: bookingDescription(b),
    }),
  ]);
}

async function notifyAdminPaid(b: Booking): Promise<void> {
  const text = [
    "✅ <b>Оплачено</b>",
    `${b.serviceName}`,
    `${formatDateTime(b.startsAt)}`,
    `${b.name} · ${b.email}`,
    `Сумма: ${formatPrice(b.priceRub)}`,
  ].join("\n");

  await Promise.all([
    sendTelegram(text),
    sendEmail({
      to: env.mail.admin,
      subject: `Оплачено: ${b.serviceName} — ${b.name}`,
      text: bookingDescription(b),
    }),
  ]);
}

async function notifyClientConfirmed(b: Booking): Promise<void> {
  const text = [
    `Здравствуйте, ${b.name}!`,
    "",
    `Ваша запись подтверждена и оплачена.`,
    "",
    `Услуга: ${b.serviceName}`,
    `Когда: ${formatDateTime(b.startsAt)}`,
    `Длительность: ${b.durationMin} минут`,
    "",
    `Ссылку на встречу и детали пришлю дополнительно в ответ на это письмо.`,
    `Если нужно перенести встречу — просто ответьте на это письмо.`,
    "",
    `— ${site.name}`,
  ].join("\n");

  await sendEmail({
    to: b.email,
    subject: `Запись подтверждена: ${b.serviceName}`,
    text,
  });
}
