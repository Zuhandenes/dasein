import { site } from "@/content/site";
import { Section, SectionHeading } from "@/components/ui/Section";

export function AboutSection() {
  return (
    <Section id="about-detail">
      <SectionHeading eyebrow="Кто проводит встречи" title={site.about.heading} />

      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">
        <div className="prose-measure space-y-4 text-base text-muted">
          {site.about.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <div>
          <dl className="space-y-4">
            {site.about.credentials.map((c) => (
              <div key={c.label} className="border-b border-line pb-4 last:border-0">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  {c.label}
                </dt>
                <dd className="mt-1 text-sm text-ink">{c.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Материалы и ссылки
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {site.about.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {l.label} →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
