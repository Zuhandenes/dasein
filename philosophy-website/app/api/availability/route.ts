import { NextResponse } from "next/server";
import { availabilityQuerySchema } from "@/lib/validation";
import { getAvailableSlots } from "@/lib/booking-service";
import { availability } from "@/content/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    service: url.searchParams.get("service"),
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const now = new Date();
  const from = parsed.data.from ? new Date(parsed.data.from) : now;
  const maxTo = new Date(now.getTime() + availability.horizonDays * 86_400_000);
  const to = parsed.data.to
    ? new Date(Math.min(new Date(parsed.data.to).getTime(), maxTo.getTime()))
    : maxTo;

  const slots = await getAvailableSlots(parsed.data.service, from, to);

  return NextResponse.json({
    timezone: availability.timezone,
    slots,
  });
}
