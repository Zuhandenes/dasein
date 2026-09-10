import Image from "next/image";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section id="about" className="scroll-mt-20 border-b border-line py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr] md:gap-14">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {site.role}
            </p>
            <h1 className="text-3xl leading-tight text-balance sm:text-4xl md:text-[2.75rem]">
              {site.hero.heading}
            </h1>
            <p className="prose-measure mt-6 text-base text-muted sm:text-lg">
              {site.hero.lead}
            </p>

            <ul className="mt-7 space-y-2">
              {site.hero.hooks.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-ink">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/booking">Записаться на встречу</ButtonLink>
              <ButtonLink href="/#services" variant="outline">
                Посмотреть услуги
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {site.stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif text-xl text-ink">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mx-auto w-full max-w-xs md:max-w-none">
            <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-line bg-paper-2">
              <Image
                src={site.hero.photo.src}
                alt={site.hero.photo.alt}
                fill
                priority
                sizes="(max-width: 768px) 20rem, 24rem"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
