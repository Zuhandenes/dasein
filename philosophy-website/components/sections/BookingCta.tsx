import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function BookingCta() {
  return (
    <section id="booking-cta" className="border-t border-line bg-accent py-16 text-accent-ink sm:py-20">
      <Container size="narrow">
        <Reveal className="text-center">
          <h2 className="text-2xl text-accent-ink sm:text-3xl">
            Первый шаг — короткий разговор
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-accent-ink/80 sm:text-base">
            Выберите удобное время. На знакомстве обсудим ваш запрос и поймём, подойдёт ли
            вам такой формат работы — без обязательств продолжать.
          </p>
          <div className="mt-8">
            <ButtonLink
              href="/booking"
              className="bg-accent-ink text-accent hover:bg-accent-ink/90"
            >
              Выбрать время
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
