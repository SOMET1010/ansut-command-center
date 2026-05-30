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
      // Variables ordonnées qui remplaceront {{1}}, {{2}}, ... dans le template
      parameters: z.array(z.string().max(1024)).max(20).optional(),
    })
    .optional(),
});

export type SendHubMessageInput = z.infer<typeof InputSchema>;

/**
 * Envoie un message via le Hub ANSUT (WhatsApp / SMS / Telegram / Email).
 * Endpoint unique : <ANSUT_HUB_URL>/api/message/send
 *
 * Pour WhatsApp avec template, on envoie `whatsAppTemplate` avec :
 *  - name           : nom du template approuvé côté Hub
 *  - languageCode   : code langue (ex. "fr")
 *  - parameters     : valeurs ordonnées injectées dans {{1}}, {{2}}, ...
 *  - components     : structure compatible WhatsApp Cloud API (body / parameters)
 * On envoie les deux formats pour maximiser la compatibilité côté Hub.
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

    if (data.template) {
      const params = data.template.parameters ?? [];
      payload.whatsAppTemplate = {
        name: data.template.name,
        languageCode: data.template.languageCode,
        parameters: params,
        components: params.length
          ? [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ]
          : [],
      };
      // Fallback texte si le Hub ignore le template
      if (!data.content && params.length) {
        payload.content = params.join(" — ");
      }
    }
    if (data.content) payload.content = data.content;

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

/**
 * Construit les variables ordonnées pour le template de confirmation d'inscription.
 * Doit correspondre à un template approuvé côté Hub (ex. `ansut_event_confirmation`)
 * avec un corps du type :
 *   "Bonjour {{1}}, votre inscription à {{2}} le {{3}} ({{4}}) est confirmée."
 */
export function buildRegistrationTemplateParams(opts: {
  fullName: string;
  eventName: string;
  startsAt: string | Date;
  location?: string | null;
}): string[] {
  const date = new Date(opts.startsAt).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return [
    opts.fullName.trim(),
    opts.eventName.trim(),
    date,
    (opts.location ?? "en ligne").trim() || "en ligne",
  ];
}
