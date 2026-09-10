import { NextResponse } from "next/server";
import { bookingInputSchema } from "@/lib/validation";
import {
  createPendingBooking,
  cancelBooking,
  SlotUnavailableError,
} from "@/lib/booking-service";
import { getService } from "@/content/services";
import { initPayment } from "@/lib/tbank";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидается JSON" }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const service = getService(parsed.data.serviceSlug)!;

  let booking;
  try {
    booking = await createPendingBooking(parsed.data);
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json(
        { error: "Это время только что заняли. Выберите, пожалуйста, другой слот." },
        { status: 409 },
      );
    }
    console.error("[bookings] create failed:", err);
    return NextResponse.json({ error: "Не удалось создать бронь" }, { status: 500 });
  }

  // Ручной режим оплаты: возвращаем бронь без платёжной ссылки.
  if (env.paymentMode === "manual") {
    return NextResponse.json({
      bookingId: booking.id,
      paymentMode: "manual",
      paymentUrl: service.paymentUrlFallback ?? null,
    });
  }

  try {
    const payment = await initPayment({
      orderId: booking.id,
      amountRub: booking.priceRub,
      description: `${service.name} — ${booking.name}`,
      customerEmail: booking.email,
      customerPhone: booking.phone ?? undefined,
    });
    return NextResponse.json({
      bookingId: booking.id,
      paymentMode: "tbank",
      paymentUrl: payment.paymentUrl,
      test: payment.test ?? false,
    });
  } catch (err) {
    console.error("[bookings] payment init failed:", err);
    // Платёж не создался — освобождаем слот, чтобы он не «завис».
    await cancelBooking(booking.id);
    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуйте позже или напишите мне напрямую." },
      { status: 502 },
    );
  }
}
