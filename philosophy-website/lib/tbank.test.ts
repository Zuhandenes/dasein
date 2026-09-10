import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import { tbankToken, verifyTbankToken, isPaidStatus } from "@/lib/tbank";

const sha256 = (s: string) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

describe("tbankToken", () => {
  // Алгоритм T-Bank: ключи по алфавиту, значения склеены без разделителей,
  // Password встаёт в общий порядок сортировки.
  it("сортирует ключи и склеивает значения по правилу T-Bank", () => {
    const password = "usaf8fw8fsw21g";
    const token = tbankToken(
      {
        TerminalKey: "MerchantTerminalKey",
        Amount: 19200,
        OrderId: "21050",
        Description: "Подарочная карта на 1000 рублей",
      },
      password,
    );
    // Порядок ключей: Amount, Description, OrderId, Password, TerminalKey
    const expected = sha256(
      "19200" +
        "Подарочная карта на 1000 рублей" +
        "21050" +
        password +
        "MerchantTerminalKey",
    );
    expect(token).toBe(expected);
  });

  it("игнорирует вложенные объекты (DATA, Receipt) и сам Token", () => {
    const base = { TerminalKey: "T", Amount: 100, OrderId: "1" };
    const withNested = {
      ...base,
      DATA: { Email: "a@b.c" },
      Receipt: { Items: [] },
      Token: "old",
    };
    expect(tbankToken(base, "pw")).toBe(tbankToken(withNested, "pw"));
  });

  it("булевы значения сериализуются как true/false", () => {
    const t1 = tbankToken({ Success: true, OrderId: "1" }, "pw");
    const t2 = tbankToken({ Success: "true", OrderId: "1" }, "pw");
    expect(t1).toBe(t2);
  });
});

describe("verifyTbankToken", () => {
  const password = "secret";
  const notification = {
    TerminalKey: "T",
    OrderId: "order-1",
    Success: true,
    Status: "CONFIRMED",
    PaymentId: 123456,
    Amount: 500000,
    ErrorCode: "0",
  };

  it("принимает корректный токен", () => {
    const Token = tbankToken(notification, password);
    expect(verifyTbankToken({ ...notification, Token }, password)).toBe(true);
  });

  it("отклоняет подделанный токен", () => {
    expect(
      verifyTbankToken({ ...notification, Token: "deadbeef" }, password),
    ).toBe(false);
  });

  it("отклоняет, если сумма изменена после подписи", () => {
    const Token = tbankToken(notification, password);
    expect(
      verifyTbankToken({ ...notification, Amount: 1, Token }, password),
    ).toBe(false);
  });
});

describe("isPaidStatus", () => {
  it("CONFIRMED и AUTHORIZED — оплачено", () => {
    expect(isPaidStatus("CONFIRMED")).toBe(true);
    expect(isPaidStatus("AUTHORIZED")).toBe(true);
  });
  it("прочие статусы — нет", () => {
    expect(isPaidStatus("NEW")).toBe(false);
    expect(isPaidStatus("REJECTED")).toBe(false);
  });
});
