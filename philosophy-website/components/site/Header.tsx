"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { clsx } from "@/lib/clsx";

const nav = [
  { label: "Обо мне", href: "/#about" },
  { label: "Услуги", href: "/#services" },
  { label: "Отзывы", href: "/#testimonials" },
  { label: "Подробно об услугах", href: "/services" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-serif text-lg tracking-tight"
          onClick={() => setOpen(false)}
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-[#661f1f]"
          >
            Записаться
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Меню"
          aria-expanded={open}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={clsx(
              "block h-px w-6 bg-ink transition-transform",
              open && "translate-y-[7px] rotate-45",
            )}
          />
          <span className={clsx("block h-px w-6 bg-ink transition-opacity", open && "opacity-0")} />
          <span
            className={clsx(
              "block h-px w-6 bg-ink transition-transform",
              open && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col px-5 py-3 sm:px-8">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-3 text-sm text-muted"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/booking"
              className="mt-2 rounded-sm bg-accent px-4 py-3 text-center text-sm font-medium text-accent-ink"
              onClick={() => setOpen(false)}
            >
              Записаться
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
