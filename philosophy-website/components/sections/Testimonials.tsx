import { testimonials } from "@/content/testimonials";
import { Section, SectionHeading } from "@/components/ui/Section";

export function Testimonials() {
  return (
    <Section id="testimonials" tone="paper-2">
      <SectionHeading
        eyebrow="Отзывы"
        title="С чем приходят и к чему приходят"
      />

      <div className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <article key={i} className="bg-paper p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  До
                </p>
                <p className="text-sm text-muted">{t.before}</p>
              </div>
              <div className="border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  После
                </p>
                <p className="text-sm text-ink">{t.after}</p>
              </div>
            </div>
            {t.attribution && (
              <p className="mt-4 text-xs text-muted">— {t.attribution}</p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
