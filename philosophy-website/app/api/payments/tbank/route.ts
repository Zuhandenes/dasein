import { verifyTbankToken, isPaidStatus } from "@/lib/tbank";
import { markBookingPaid, cancelBooking } from "@/lib/booking-service";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const FAILED_STATUSES = new Set(["REJECTED", "AUTH_FAIL", "DEADLINE_EXPIRED", "CANCELED"]);

/** T-Bank ждёт в ответ ровно строку "OK". */
function ok() {
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, unknown>;

  try {
    if (contentType.includes("application/json")) {
      payload = (await request.json()) as Record<string, unknown>;
    } else {
      const form = new URLSearchParams(await request.text());
      payload = Object.fromEntries(form.entries());
    }
  } catch {
    return new Response("ERROR", { status: 400 });
  }

  const tokenValid = verifyTbankToken(payload);
  if (!tokenValid && !env.testMode) {
    console.warn("[tbank webhook] invalid token", { orderId: payload.OrderId });
    return new Response("ERROR", { status: 403 });
  }

  const orderId = String(payload.OrderId ?? "");
  const paymentId = String(payload.PaymentId ?? "");
  const status = payload.Status;
  const success = payload.Success === true || payload.Success === "true";

  if (!orderId) return ok();

  try {
    if (success && isPaidStatus(status)) {
      await markBookingPaid(orderId, paymentId);
    } else if (typeof status === "string" && FAILED_STATUSES.has(status)) {
      await cancelBooking(orderId);
    }
    // прочие промежуточные статусы (NEW, FORM_SHOWED, AUTHORIZING…) — просто подтверждаем приём
  } catch (err) {
    console.error("[tbank webhook] handling failed:", err);
    // Возвращаем 200/OK всё равно: T-Bank не должен ретраить бесконечно из-за нашей ошибки,
    // расхождения ловятся сверкой статусов вручную.
  }

  return ok();
}
