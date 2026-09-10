/** Единая точка чтения окружения + флаги «включена ли интеграция». */

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  paymentMode: (process.env.PAYMENT_MODE ?? "tbank") as "tbank" | "manual",
  testMode: process.env.INTEGRATIONS_TEST_MODE === "true",

  tbank: {
    terminalKey: process.env.TBANK_TERMINAL_KEY ?? "",
    password: process.env.TBANK_PASSWORD ?? "",
    apiBaseUrl: process.env.TBANK_API_BASE_URL ?? "https://securepay.tinkoff.ru/v2",
    /** Формировать чек по 54-ФЗ в запросе Init */
    receiptEnabled: process.env.TBANK_RECEIPT_ENABLED === "true",
    /** Система налогообложения для чека: osn | usn_income | usn_income_outcome | patent | envd | esn */
    taxation: process.env.TBANK_TAXATION ?? "usn_income",
    /** Ставка НДС для позиции чека: none | vat0 | vat10 | vat20 | vat110 | vat120 */
    vat: process.env.TBANK_VAT ?? "none",
  },

  google: {
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "",
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    chatId: process.env.TELEGRAM_CHAT_ID ?? "",
  },

  mail: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.MAIL_FROM ?? "no-reply@example.com",
    admin: process.env.MAIL_ADMIN ?? "",
  },
};

export const isGoogleEnabled = () =>
  Boolean(env.google.serviceAccountJson && env.google.calendarId);

export const isTelegramEnabled = () =>
  Boolean(env.telegram.botToken && env.telegram.chatId);

export const isEmailEnabled = () =>
  Boolean(env.mail.resendApiKey || (env.mail.smtpHost && env.mail.smtpUser));

export const isTbankEnabled = () =>
  env.paymentMode === "tbank" && Boolean(env.tbank.terminalKey && env.tbank.password);
