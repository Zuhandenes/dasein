import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BookingResult } from "@/components/booking/BookingResult";

export const metadata: Metadata = {
  title: "Оплата не завершена",
  robots: { index: false },
};

export default async function BookingFailPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="py-16 sm:py-24">
      <Container size="narrow">
        <BookingResult orderId={order ?? null} variant="fail" />
      </Container>
    </div>
  );
}
