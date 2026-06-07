/**
 * The Lovable preview iframe ships a fetch proxy (`lovable.js`) that
 * intercepts requests and breaks Supabase auth POSTs (/auth/v1/token,
 * /auth/v1/recover), surfacing as "Failed to fetch". Same-origin server
 * routes are NOT proxied, so we route auth calls through our own
 * /api/public/auth/* endpoints when running inside the preview.
 */
export function isLovablePreview(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return /(^|\.)id-preview--/.test(host) || host.includes("--preview-");
}
