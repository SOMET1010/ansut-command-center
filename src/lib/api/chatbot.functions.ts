import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

/**
 * Chatbot IA — ANSUT EVENT Assistant
 * Utilise l'API OpenAI (configurée via OPENAI_API_KEY et OPENAI_API_BASE)
 * pour répondre aux questions des participants sur l'événement.
 */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatInputSchema = z.object({
  messages: z.array(messageSchema),
  eventContext: z.object({
    eventName: z.string(),
    eventSlug: z.string(),
    sessions: z
      .array(
        z.object({
          title: z.string(),
          speaker: z.string().optional(),
          starts_at: z.string().optional(),
          location: z.string().optional(),
        }),
      )
      .optional(),
    wifiSsid: z.string().optional(),
    wifiPassword: z.string().optional(),
    venue: z.string().optional(),
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

    // Construire le contexte de l'événement
    let contextInfo = `\n\nContexte de l'événement actuel:\n- Nom: ${eventContext.eventName}`;
    if (eventContext.venue) contextInfo += `\n- Lieu: ${eventContext.venue}`;
    if (eventContext.wifiSsid)
      contextInfo += `\n- WiFi: Réseau "${eventContext.wifiSsid}", Mot de passe: "${eventContext.wifiPassword}"`;
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
