/**
 * Эквайринг T-Bank («Т‑Касса», Tinkoff Acquiring API v2).
 *
 * Поток:
 *   1. POST /v2/Init  -> получаем PaymentURL, редиректим клиента.
 *   2. Клиент платит на странице T-Bank.
 *   3. T-Bank шлёт POST на NotificationURL со статусом (CONFIRMED = оплачено).
 *      Проверяем Token, отвечаем строкой "OK".
 *   4. Клиент возвращается на SuccessURL / FailURL.
 *
 * Подпись (Token):
 *   - берём все корневые СКАЛЯРНЫЕ параметры запроса (без Receipt, DATA, Shops, Token);
 *   - добавляем пару { Password };
 *   - сортируем по ключу по возрастанию;
 *   - конкатенируем значения в одну строку;
 *   - SHA-256 (hex, нижний регистр).
 */

import crypto from "node:crypto";
import { env } from "@/lib/env";

const NESTED_KEYS = new Set(["Receipt", "DATA", "Data", "Shops", "Token"]);

function scalarToString(v: unknown): string {
  if (v === true) return "true";
  if (v === false) return "false";
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Токен запроса/уведомления T-Bank. */
export function tbankToken(
  payload: Record<string, unknown>,
  password = env.tbank.password,
): string {
  const entries: [string, string][] = [];
  for (const [k, v] of Object.entries(payload)) {
    if (NESTED_KEYS.has(k)) continue;
    if (v !== null && typeof v === "object") continue; // на всякий случай
    entries.push([k, scalarToString(v)]);
  }
  entries.push(["Password", password]);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const concatenated = entries.map(([, v]) => v).join("");
  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

export function verifyTbankToken(
  payload: Record<string, unknown>,
  password = env.tbank.password,
): boolean {
  const received = payload.Token;
  if (typeof received !== "string" || !received || !password) return false;
  const expected = tbankToken(payload, password);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received.toLowerCase(), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type InitPaymentInput = {
  orderId: string;
  amountRub: number;
  description: string;
  customerEmail: string;
  customerPhone?: string;
};

export type InitPaymentResult = {
  paymentUrl: string;
  paymentId: string;
  test?: boolean;
};

type TbankInitResponse = {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  Details?: string;
  PaymentId?: string;
  PaymentURL?: string;
  Status?: string;
};

function buildReceipt(input: InitPaymentInput) {
  const amountKopecks = Math.round(input.amountRub * 100);
  return {
    Email: input.customerEmail,
    ...(input.customerPhone ? { Phone: input.customerPhone } : {}),
    Taxation: env.tbank.taxation,
    Items: [
      {
        Name: input.description.slice(0, 128),
        Price: amountKopecks,
        Quantity: 1,
        Amount: amountKopecks,
        Tax: env.tbank.vat,
      },
    ],
  };
}

/**
 * Создаёт платёж в T-Bank и возвращает ссылку на оплату.
 * В INTEGRATIONS_TEST_MODE не ходит в сеть — отдаёт заглушечную ссылку.
 */
export async function initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
  const amountKopecks = Math.round(input.amountRub * 100);

  if (env.testMode || !env.tbank.terminalKey) {
    const url = new URL(`${env.siteUrl}/booking/success`);
    url.searchParams.set("order", input.orderId);
    url.searchParams.set("test", "1");
    console.info("[tbank] TEST MODE Init", { orderId: input.orderId, amountKopecks });
    return { paymentUrl: url.toString(), paymentId: `test-${input.orderId}`, test: true };
  }

  const base: Record<string, unknown> = {
    TerminalKey: env.tbank.terminalKey,
    Amount: amountKopecks,
    OrderId: input.orderId,
    Description: input.description.slice(0, 250),
    NotificationURL: `${env.siteUrl}/api/payments/tbank`,
    SuccessURL: `${env.siteUrl}/booking/success?order=${encodeURIComponent(input.orderId)}`,
    FailURL: `${env.siteUrl}/booking/fail?order=${encodeURIComponent(input.orderId)}`,
    DATA: {
      Email: input.customerEmail,
      ...(input.customerPhone ? { Phone: input.customerPhone } : {}),
    },
  };

  const body: Record<string, unknown> = {
    ...base,
    Token: tbankToken(base),
  };
  if (env.tbank.receiptEnabled) {
    body.Receipt = buildReceipt(input);
  }

  const res = await fetch(`${env.tbank.apiBaseUrl}/Init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as TbankInitResponse;
  if (!json.Success || !json.PaymentURL || !json.PaymentId) {
    throw new Error(
      `T-Bank Init failed: ${json.ErrorCode} ${json.Message ?? ""} ${json.Details ?? ""}`.trim(),
    );
  }

  return { paymentUrl: json.PaymentURL, paymentId: String(json.PaymentId) };
}

/** Статусы уведомления, означающие успешную оплату (одностадийная схема). */
export function isPaidStatus(status: unknown): boolean {
  return status === "CONFIRMED" || status === "AUTHORIZED";
}
