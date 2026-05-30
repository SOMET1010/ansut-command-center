import { generateBadge } from "./badges.functions";

/** Télécharge le badge PDF pour un qr_token donné côté navigateur. */
export async function downloadBadge(qrToken: string) {
  const res = await generateBadge({ data: { qrToken } });
  if (!res.ok) throw new Error(res.error);
  const bin = atob(res.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
