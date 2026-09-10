"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { services } from "@/content/services";
import { Button } from "@/components/ui/Button";
import { clsx } from "@/lib/clsx";
import { formatPrice } from "@/lib/format";

const bookable = services.filter((s) => s.bookable);

const dayLabelFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  weekday: "short",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  hour: "2-digit",
  minute: "2-digit",
});
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type FormState = {
  name: string;
  email: string;
  phone: string;
  telegram: string;
  message: string;
};

const emptyForm: FormState = { name: "", email: "", phone: "", telegram: "", message: "" };

export function BookingFlow({ initialService }: { initialService: string | null }) {
  const [serviceSlug, setServiceSlug] = useState<string | null>(initialService);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsState, setSlotsState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => bookable.find((s) => s.slug === serviceSlug) ?? null,
    [serviceSlug],
  );

  const loadSlots = useCallback(async (slug: string) => {
    setSlotsState("loading");
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/availability?service=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as { slots: string[] };
      setSlots(data.slots);
      setSlotsState("loaded");
    } catch {
      setSlotsState("error");
    }
  }, []);

  useEffect(() => {
    if (serviceSlug) loadSlots(serviceSlug);
  }, [serviceSlug, loadSlots]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of slots) {
      const key = dayKeyFmt.format(new Date(iso));
      const arr = map.get(key) ?? [];
      arr.push(iso);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [slots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          startsAt: selectedSlot,
          name: form.name,
          email: form.email,
          phone: form.phone,
          telegram: form.telegram,
          message: form.message,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setError(data.error ?? "Это время только что заняли. Выберите другое.");
        if (serviceSlug) loadSlots(serviceSlug);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Не удалось оформить запись. Попробуйте ещё раз.");
        setSubmitting(false);
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      // manual-режим без ссылки на оплату
      window.location.href = `/booking/success?order=${encodeURIComponent(data.bookingId)}&manual=1`;
    } catch {
      setError("Сбой сети. Проверьте соединение и попробуйте ещё раз.");
      setSubmitting(false);
    }
  }

  const formValid =
    form.name.trim().length >= 2 && /.+@.+\..+/.test(form.email.trim());

  return (
    <div className="space-y-10">
      {/* Шаг 1 — услуга */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          1. Услуга
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {bookable.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setServiceSlug(s.slug)}
              className={clsx(
                "rounded-sm border p-4 text-left transition-colors",
                serviceSlug === s.slug
                  ? "border-accent bg-paper-2"
                  : "border-line hover:border-ink",
              )}
            >
              <span className="block font-serif text-base">{s.name}</span>
              <span className="mt-1 block text-xs text-muted">{s.formatLabel}</span>
              <span className="mt-2 block text-sm text-accent">{formatPrice(s.priceRub)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Шаг 2 — время */}
      {service && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            2. Время{" "}
            <span className="font-normal normal-case text-muted/70">
              · {service.durationMin} мин · МСК
            </span>
          </h2>

          {slotsState === "loading" && (
            <p className="mt-4 text-sm text-muted">Загружаю свободное время…</p>
          )}
          {slotsState === "error" && (
            <p className="mt-4 text-sm text-accent">
              Не удалось загрузить расписание.{" "}
              <button className="underline" onClick={() => loadSlots(service.slug)}>
                Повторить
              </button>
            </p>
          )}
          {slotsState === "loaded" && slotsByDay.length === 0 && (
            <p className="mt-4 text-sm text-muted">
              Свободных слотов на ближайшие недели нет. Напишите мне напрямую — подберём время.
            </p>
          )}

          {slotsState === "loaded" && slotsByDay.length > 0 && (
            <div className="mt-4 space-y-5">
              {slotsByDay.map(([day, daySlots]) => (
                <div key={day}>
                  <p className="mb-2 text-sm text-ink">
                    {capitalize(dayLabelFmt.format(new Date(daySlots[0])))}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelectedSlot(iso)}
                        className={clsx(
                          "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                          selectedSlot === iso
                            ? "border-accent bg-accent text-accent-ink"
                            : "border-line hover:border-ink",
                        )}
                      >
                        {timeFmt.format(new Date(iso))}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Шаг 3 — контакты и оплата */}
      {service && selectedSlot && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            3. Контакты
          </h2>

          <div className="mt-3 rounded-sm border border-line bg-paper-2 p-4 text-sm">
            <p className="font-serif text-base">{service.name}</p>
            <p className="mt-1 text-muted">
              {capitalize(dayLabelFmt.format(new Date(selectedSlot)))},{" "}
              {timeFmt.format(new Date(selectedSlot))} (МСК) · {formatPrice(service.priceRub)}
            </p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <Field
              label="Имя"
              required
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Как к вам обращаться"
            />
            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="для подтверждения и чека"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Телефон"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+7…"
              />
              <Field
                label="Telegram"
                value={form.telegram}
                onChange={(v) => setForm({ ...form, telegram: v })}
                placeholder="@username"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-ink">
                Запрос кратко <span className="text-muted">(по желанию)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
                placeholder="С чем хотите поработать"
              />
            </div>

            {error && <p className="text-sm text-accent">{error}</p>}

            <Button type="submit" disabled={!formValid || submitting} className="w-full sm:w-auto">
              {submitting ? "Оформляю…" : `Перейти к оплате — ${formatPrice(service.priceRub)}`}
            </Button>
            <p className="text-xs text-muted">
              Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Оплата
              проходит на защищённой странице банка.
            </p>
          </form>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-ink">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
      />
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
