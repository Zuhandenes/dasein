import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-sm text-muted">
          <p className="font-serif text-base text-ink">{site.name}</p>
          <p className="mt-1">
            © {year}. {site.legal.entity}
            {site.legal.inn ? `, ИНН ${site.legal.inn}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted transition-colors hover:text-ink"
            >
              {s.label}
            </a>
          ))}
          <Link href="/booking" className="text-accent hover:underline">
            Записаться
          </Link>
        </div>
      </div>
    </footer>
  );
}
