import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  to: z.string().min(6).max(32),
  content: z.string().min(1).max(4096).optional(),
  channel: z.enum(["WhatsApp", "SMS", "Telegram", "Email"]).default("WhatsApp"),
  template: z
    .object({
      name: z.string().min(1).max(128),
      languageCode: z.string().min(2).max(10).default("fr"),
    })
    .optional(),
});

export type SendHubMessageInput = z.infer<typeof InputSchema>;

/**
 * Envoie un message via le Hub ANSUT (WhatsApp / SMS / Telegram / Email).
 * Endpoint unique : <ANSUT_HUB_URL>/api/message/send
 */
export const sendHubMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const baseUrl = process.env.ANSUT_HUB_URL;
    const username = process.env.ANSUT_HUB_USERNAME;
    const password = process.env.ANSUT_HUB_PASSWORD;

    if (!baseUrl || !username || !password) {
      console.error("ANSUT Hub credentials missing");
      return { ok: false, error: "Hub non configuré" as const };
    }

    const url = `${baseUrl.replace(/\/+$/, "")}/api/message/send`;

    const payload: Record<string, unknown> = {
      username,
      password,
      channel: data.channel,
      to: data.to,
    };
    if (data.content) payload.content = data.content;
    if (data.template) {
      payload.whatsAppTemplate = {
        name: data.template.name,
        languageCode: data.template.languageCode,
      };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("Hub send failed", res.status, text);
        return { ok: false, error: `Hub ${res.status}`, body: text };
      }
      return { ok: true, body: text };
    } catch (err) {
      console.error("Hub send exception", err);
      return { ok: false, error: "Erreur réseau Hub" as const };
    }
  });
