import type { Metadata } from "next";
import Link from "next/link";
import { services, type ServiceDetailSection } from "@/content/services";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Подробно об услугах",
  description:
    "Как устроено философское консультирование, преподавание, беседа вдвоём и аналитика мировоззрения: форматы, цены, чем отличается от терапии.",
};

function DetailBlock({ section }: { section: ServiceDetailSection }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg">{section.heading}</h3>
      {section.body?.map((p) => (
        <p key={p.slice(0, 24)} className="prose-measure mt-3 text-sm text-muted">
          {p}
        </p>
      ))}
      {section.bullets && (
        <ul className="mt-3 space-y-2">
          {section.bullets.map((b) => (
            <li key={b.slice(0, 24)} className="flex gap-2.5 text-sm text-ink">
              <span aria-hidden className="mt-2 h-1 w-1 flex-none rounded-full bg-accent" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {section.table && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {section.table.columns.map((c) => (
                  <th
                    key={c}
                    className="border border-line bg-paper-2 p-3 text-left font-serif font-medium"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-line p-3 align-top text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="py-14 sm:py-20">
      <Container size="narrow">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Подробно
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Об услугах — для тех, кто выбирает</h1>
        <p className="prose-measure mt-5 text-base text-muted">
          Здесь подробнее о каждом формате: как проходят встречи, чем это отличается от
          терапии, кому подойдёт. Если после этого останутся вопросы — задайте их на
          коротком созвоне-знакомстве.
        </p>

        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-4 text-sm">
          {services.map((s) => (
            <a key={s.slug} href={`#${s.slug}`} className="text-muted hover:text-ink">
              {s.name}
            </a>
          ))}
        </nav>

        <div className="divide-y divide-line">
          {services.map((s) => (
            <section key={s.slug} id={s.slug} className="scroll-mt-24 py-12">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 className="text-2xl">{s.name}</h2>
                <span className="font-serif text-lg text-accent">{s.priceLabel}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{s.formatLabel}</p>

              <p className="prose-measure mt-5 text-base text-ink">{s.detail.lead}</p>

              {s.detail.sections.map((section) => (
                <DetailBlock key={section.heading} section={section} />
              ))}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {s.bookable ? (
                  <ButtonLink href={`/booking?service=${s.slug}`}>
                    Записаться — {formatPrice(s.priceRub)}
                  </ButtonLink>
                ) : (
                  <span className="text-sm text-muted">Запись по договорённости</span>
                )}
                <Link href="/#services" className="text-sm text-muted hover:text-ink">
                  ← ко всем услугам
                </Link>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
