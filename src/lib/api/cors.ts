/**
 * CORS allowlist pour les routes API publiques sensibles (auth).
 *
 * Sont autorisés :
 * - Le domaine de production (configurable via APP_PUBLIC_URL)
 * - Tout sous-domaine *.lovable.app et *.lovableproject.com (previews Lovable)
 *
 * Toute autre origine reçoit `null`, ce qui bloque l'accès cross-origin pour
 * les requêtes credentialed et empêche un site tiers / phishing de lire la
 * réponse JWT.
 */
const ALLOWED_PATTERNS: Array<string | RegExp> = [
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*lovableproject\.com$/i,
];

export function resolveAllowedOrigin(request: Request): string {
  const origin = request.headers.get("origin") ?? "";
  if (!origin) return "null";

  const extra = process.env.APP_PUBLIC_URL?.trim();
  if (extra && origin === extra) return origin;

  for (const pattern of ALLOWED_PATTERNS) {
    if (typeof pattern === "string" ? pattern === origin : pattern.test(origin)) {
      return origin;
    }
  }
  return "null";
}

export function corsHeaders(request: Request, methods: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
