/** Уведомления в Telegram через Bot API. */

import { env, isTelegramEnabled } from "@/lib/env";

export async function sendTelegram(text: string): Promise<void> {
  if (env.testMode || !isTelegramEnabled()) {
    console.info("[telegram] (not sent)\n" + text);
    return;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.telegram.chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      console.error("[telegram] sendMessage failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[telegram] sendMessage error:", err);
  }
}
