import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Запись на встречу",
  description: "Выберите услугу и удобное время. Оплата на сайте.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const initialService =
    services.find((s) => s.slug === service && s.bookable)?.slug ?? null;

  return (
    <div className="py-14 sm:py-20">
      <Container size="narrow">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Запись</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Выберите услугу и время</h1>
        <p className="prose-measure mt-5 text-base text-muted">
          Время указано по Москве. После заполнения формы вы перейдёте на страницу оплаты.
          Как только оплата пройдёт, встреча закрепится за вами, и я пришлю подтверждение на почту.
        </p>

        <div className="mt-10">
          <BookingFlow initialService={initialService} />
        </div>
      </Container>
    </div>
  );
}
