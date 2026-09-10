import Link from "next/link";
import { services } from "@/content/services";
import { Section, SectionHeading } from "@/components/ui/Section";
import { formatPrice } from "@/lib/format";

export function ServicesShort() {
  return (
    <Section id="services" tone="paper-2">
      <SectionHeading eyebrow="Услуги" title="Форматы работы" />

      <div className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
        {services.map((s) => (
          <article key={s.slug} className="flex flex-col bg-paper p-6 sm:p-8">
            <h3 className="text-xl">{s.name}</h3>
            <p className="mt-1 text-sm text-accent">{s.formatLabel}</p>
            <p className="mt-4 flex-1 text-sm text-muted">{s.summary}</p>

            <ul className="mt-5 space-y-1.5 text-sm text-ink">
              {s.audience.slice(0, 3).map((a) => (
                <li key={a} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-muted" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <span className="font-serif text-base">{formatPrice(s.priceRub)}</span>
              <span className="text-xs text-muted">{s.priceLabel}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href={`/services#${s.slug}`} className="text-muted hover:text-ink">
                Подробнее
              </Link>
              {s.bookable && (
                <Link href={`/booking?service=${s.slug}`} className="text-accent hover:underline">
                  Записаться →
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        Не уверены, какой формат подойдёт?{" "}
        <Link href="/booking?service=filosofskoe-konsultirovanie" className="text-accent hover:underline">
          Начните с короткого созвона-знакомства
        </Link>
        .
      </p>
    </Section>
  );
}
