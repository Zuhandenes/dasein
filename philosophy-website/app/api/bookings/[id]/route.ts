import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { status: true, serviceName: true, startsAt: true, durationMin: true },
  });
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(booking);
}
