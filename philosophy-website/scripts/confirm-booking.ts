/**
 * Ручное подтверждение оплаты брони (режим PAYMENT_MODE=manual или сверка).
 * Запуск: npm run bookings:confirm <bookingId>
 */

import { markBookingPaid } from "../lib/booking-service";
import { prisma } from "../lib/db";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Укажите ID брони: npm run bookings:confirm <bookingId>");
    process.exit(1);
  }
  const res = await markBookingPaid(id, `manual-${Date.now()}`);
  if (!res.ok) {
    console.error("Бронь не найдена:", id);
    process.exit(1);
  }
  console.log(res.alreadyDone ? "Уже подтверждена ранее." : "Бронь подтверждена, уведомления отправлены.");
  await prisma.$disconnect();
}

main();
