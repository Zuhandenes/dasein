import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Об авторе — подробно",
  description: "Развёрнуто об Андрее Лемане: путь, экспертиза, философский клуб, проекты.",
};

/**
 * Задел на будущее — расширенная страница «обо мне».
 * TODO: Андрей наполняет: путь в философию, с какими кейсами работает,
 * подробнее про философский клуб, публикации, лекции.
 */
export default function AboutPage() {
  return (
    <div className="py-14 sm:py-20">
      <Container size="narrow">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Об авторе</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{site.name}</h1>

        <div className="prose-measure mt-6 space-y-4 text-base text-muted">
          {site.about.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="text-sm italic">
            TODO: развёрнутый текст — путь в философию, с какими запросами и людьми работаю,
            про философский клуб и проекты, избранные публикации.
          </p>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {site.about.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {l.label} →
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 text-sm">
          <Link href="/booking" className="text-accent hover:underline">
            Записаться на встречу →
          </Link>
        </p>
      </Container>
    </div>
  );
}
