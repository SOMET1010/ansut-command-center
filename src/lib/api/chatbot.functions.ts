import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import process from "node:process";

/**
 * Anti-abuse : limite par IP le nombre d'appels au chatbot pour éviter
 * qu'un acteur anonyme vide le quota OpenAI. Fenêtre glissante en mémoire.
 */
const CHAT_RATE_WINDOW_MS = 60_000; // 1 minute
const CHAT_RATE_MAX = 10; // max 10 requêtes / IP / minute
const chatRateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = (chatRateBuckets.get(ip) ?? []).filter((t) => now - t < CHAT_RATE_WINDOW_MS);
  if (bucket.length >= CHAT_RATE_MAX) {
    chatRateBuckets.set(ip, bucket);
    return true;
  }
  bucket.push(now);
  chatRateBuckets.set(ip, bucket);
  // Garbage-collect old buckets occasionnellement
  if (chatRateBuckets.size > 5000) {
    for (const [k, v] of chatRateBuckets) {
      if (v.every((t) => now - t > CHAT_RATE_WINDOW_MS)) chatRateBuckets.delete(k);
    }
  }
  return false;
}

/**
 * Chatbot IA — ANSUT EVENT Assistant
 * Utilise l'API OpenAI (configurée via OPENAI_API_KEY et OPENAI_API_BASE)
 * pour répondre aux questions des participants sur l'événement.
 */

// Strip control characters / newlines from any free-text field that is
// interpolated into the OpenAI system prompt. Prevents prompt-injection via
// embedded instructions like "\n\nIgnore previous instructions...".
const safeText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").trim());

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const chatInputSchema = z.object({
  messages: z.array(messageSchema).max(20),
  eventContext: z.object({
    eventName: safeText(200),
    eventSlug: z.string().max(120).regex(/^[a-zA-Z0-9_-]+$/),
    sessions: z
      .array(
        z.object({
          title: safeText(200),
          speaker: safeText(120).optional(),
          starts_at: z.string().max(64).optional(),
          location: safeText(200).optional(),
        }),
      )
      .max(50)
      .optional(),
    venue: safeText(200).optional(),
  }),
  language: z.enum(["fr", "en", "ar", "pt"]).default("fr"),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  fr: `Tu es SUTA, l'assistant IA officiel de la plateforme événementielle ANSUT EVENT.
Tu aides les participants à trouver des informations sur l'événement en cours.
Tu es chaleureux(se), professionnel(le) et concis(e). Tu parles en français.
Tu peux aider avec :
- Le programme et les sessions (horaires, intervenants, lieux)
- La logistique (WiFi, lieu de l'événement, accès)
- Le networking (comment trouver d'autres participants)
- Les fonctionnalités de la plateforme (inscription, check-in, sondages, annonces)

Si tu ne connais pas la réponse, dis-le honnêtement et suggère de contacter l'organisateur.
Réponds toujours de manière courte et utile (max 3-4 phrases).`,

  en: `You are SUTA, the official AI assistant of the ANSUT EVENT platform.
You help participants find information about the current event.
You are warm, professional, and concise. You speak in English.
You can help with:
- The program and sessions (schedules, speakers, locations)
- Logistics (WiFi, venue, access)
- Networking (how to find other participants)
- Platform features (registration, check-in, polls, announcements)

If you don't know the answer, say so honestly and suggest contacting the organizer.
Always respond briefly and helpfully (max 3-4 sentences).`,

  ar: `أنت SUTA، المساعد الرسمي لمنصة ANSUT EVENT.
تساعد المشاركين في العثور على معلومات حول الحدث الحالي.
أنت ودود ومحترف وموجز. تتحدث بالعربية.
يمكنك المساعدة في:
- البرنامج والجلسات (المواعيد، المتحدثون، الأماكن)
- اللوجستيات (واي فاي، مكان الحدث، الوصول)
- التواصل (كيفية العثور على مشاركين آخرين)
- ميزات المنصة (التسجيل، تسجيل الحضور، الاستطلاعات، الإعلانات)

إذا كنت لا تعرف الإجابة، قل ذلك بصدق واقترح الاتصال بالمنظم.
أجب دائمًا بإيجاز وبشكل مفيد (3-4 جمل كحد أقصى).`,

  pt: `Você é SUTA, o assistente oficial de IA da plataforma ANSUT EVENT.
Você ajuda os participantes a encontrar informações sobre o evento em curso.
Você é caloroso(a), profissional e conciso(a). Você fala em português.
Você pode ajudar com:
- O programa e as sessões (horários, palestrantes, locais)
- Logística (WiFi, local do evento, acesso)
- Networking (como encontrar outros participantes)
- Funcionalidades da plataforma (inscrição, check-in, enquetes, anúncios)

Se você não sabe a resposta, diga honestamente e sugira contatar o organizador.
Sempre responda de forma breve e útil (máximo 3-4 frases).`,
};

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator(chatInputSchema)
  .handler(async ({ data }) => {
    const { messages, eventContext, language } = data;

    // Rate-limit par IP (cf-connecting-ip uniquement — x-forwarded-for est
    // facilement spoofable et ne doit pas être utilisé en fallback).
    const req = getRequest();
    const ip = req?.headers.get("cf-connecting-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return {
        reply:
          language === "fr"
            ? "Vous envoyez trop de messages. Patientez une minute avant de réessayer."
            : "Too many requests. Please wait a minute before trying again.",
        error: true,
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";

    if (!apiKey) {
      return {
        reply:
          language === "fr"
            ? "Le service d'assistant est temporairement indisponible. Veuillez réessayer plus tard."
            : language === "en"
              ? "The assistant service is temporarily unavailable. Please try again later."
              : language === "ar"
                ? "خدمة المساعد غير متاحة مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا."
                : "O serviço de assistente está temporariamente indisponível. Por favor, tente novamente mais tarde.",
        error: true,
      };
    }

    // Construire le contexte de l'événement. Les identifiants WiFi sont
    // volontairement exclus du prompt : ils sont sensibles (réservés au
    // staff via get_event_wifi) et ne doivent pas être divulgués par le
    // chatbot, qui est accessible aux visiteurs anonymes.
    let contextInfo = `\n\nContexte de l'événement actuel:\n- Nom: ${eventContext.eventName}`;
    if (eventContext.venue) contextInfo += `\n- Lieu: ${eventContext.venue}`;
      
    if (eventContext.sessions && eventContext.sessions.length > 0) {
      contextInfo += `\n- Sessions au programme:`;
      for (const s of eventContext.sessions.slice(0, 10)) {
        contextInfo += `\n  • ${s.title}`;
        if (s.speaker) contextInfo += ` (par ${s.speaker})`;
        if (s.starts_at) contextInfo += ` — ${s.starts_at}`;
        if (s.location) contextInfo += ` [${s.location}]`;
      }
    }

    const systemPrompt = (SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.fr) + contextInfo;

    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-10), // Garder les 10 derniers messages pour le contexte
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API error:", response.status, errText);
        return {
          reply:
            language === "fr"
              ? "Désolé, je rencontre un problème technique. Réessayez dans un instant."
              : "Sorry, I'm experiencing a technical issue. Please try again in a moment.",
          error: true,
        };
      }

      const result = await response.json();
      const reply = result.choices?.[0]?.message?.content?.trim() || "...";

      return { reply, error: false };
    } catch (err) {
      console.error("Chatbot error:", err);
      return {
        reply:
          language === "fr"
            ? "Désolé, une erreur est survenue. Veuillez réessayer."
            : "Sorry, an error occurred. Please try again.",
        error: true,
      };
    }
  });
