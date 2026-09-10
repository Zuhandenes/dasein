import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BookingResult } from "@/components/booking/BookingResult";

export const metadata: Metadata = {
  title: "Оплата",
  robots: { index: false },
};

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="py-16 sm:py-24">
      <Container size="narrow">
        <BookingResult orderId={order ?? null} variant="success" />
      </Container>
    </div>
  );
}
