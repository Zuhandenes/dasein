"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

type Status = {
  status: "pending_payment" | "paid" | "confirmed" | "cancelled";
  serviceName: string;
  startsAt: string;
  durationMin: number;
};

export function BookingResult({
  orderId,
  variant,
}: {
  orderId: string | null;
  variant: "success" | "fail";
}) {
  const [data, setData] = useState<Status | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let stopped = false;
    let attempts = 0;

    async function poll() {
      if (stopped) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/bookings/${orderId}`);
        if (res.ok) {
          const json = (await res.json()) as Status;
          if (stopped) return;
          setData(json);
          if (json.status === "confirmed" || json.status === "cancelled") return;
        }
      } catch {
        /* сеть — попробуем ещё раз */
      }
      if (!stopped && attempts < 12) setTimeout(poll, 2500);
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [orderId]);

  const confirmed = data?.status === "confirmed";
  const cancelled = data?.status === "cancelled";

  if (variant === "fail" && !confirmed) {
    return (
      <Shell title="Оплата не завершена">
        <p className="text-muted">
          Похоже, оплата не прошла или была отменена. Слот пока не закреплён — попробуйте
          ещё раз или напишите мне напрямую, разберёмся.
        </p>
        <Actions retry />
      </Shell>
    );
  }

  if (confirmed && data) {
    return (
      <Shell title="Запись подтверждена">
        <p className="text-muted">
          Оплата получена. Встреча закреплена за вами, подтверждение отправлено на почту.
        </p>
        <div className="mt-5 rounded-sm border border-line bg-paper-2 p-4 text-sm">
          <p className="font-serif text-base">{data.serviceName}</p>
          <p className="mt-1 text-muted">
            {formatDateTime(data.startsAt)} · {data.durationMin} мин
          </p>
        </div>
        <Actions />
      </Shell>
    );
  }

  if (cancelled) {
    return (
      <Shell title="Бронь отменена">
        <p className="text-muted">
          Оплата не поступила, и слот освобождён. Если это ошибка — напишите мне.
        </p>
        <Actions retry />
      </Shell>
    );
  }

  return (
    <Shell title="Проверяем оплату…">
      <p className="text-muted">
        Это занимает несколько секунд. Страница обновится сама. Если статус не меняется
        пару минут — напишите мне, я проверю вручную.
      </p>
      <Actions />
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <div className="prose-measure mt-5 text-base">{children}</div>
    </div>
  );
}

function Actions({ retry }: { retry?: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap gap-4 text-sm">
      {retry && (
        <Link href="/booking" className="text-accent hover:underline">
          Выбрать время заново →
        </Link>
      )}
      <Link href="/" className="text-muted hover:text-ink">
        На главную
      </Link>
    </div>
  );
}
