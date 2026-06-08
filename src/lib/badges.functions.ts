import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  qrToken: z.string().uuid(),
});

/**
 * Génère un badge PDF (format A6 paysage, 148x105 mm) à partir du qr_token.
 * Le qr_token étant lui-même un secret (UUID), il sert d'autorisation.
 * Renvoie le PDF encodé en base64 + un nom de fichier suggéré.
 */
export const generateBadge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: reg, error } = await supabaseAdmin
      .from("event_registrations")
      .select("id, full_name, organization, position, qr_token, event_id")
      .eq("qr_token", data.qrToken)
      .maybeSingle();

    if (error || !reg) {
      return { ok: false as const, error: "Inscription introuvable" };
    }

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("name, starts_at, location")
      .eq("id", reg.event_id)
      .single();

    // A6 paysage : 420 x 297 pt
    const W = 420;
    const H = 297;
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([W, H]);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    // Bande haute couleur ANSUT
    page.drawRectangle({ x: 0, y: H - 56, width: W, height: 56, color: rgb(0.114, 0.227, 0.541) });
    page.drawText("ANSUT EVENT", {
      x: 20,
      y: H - 36,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    if (ev?.name) {
      page.drawText(truncate(ev.name, 38), {
        x: 20,
        y: H - 50,
        size: 10,
        font,
        color: rgb(0.9, 0.9, 0.95),
      });
    }

    // Nom du participant
    page.drawText(truncate(reg.full_name, 28), {
      x: 20,
      y: H - 100,
      size: 22,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.12),
    });
    if (reg.position || reg.organization) {
      const line = [reg.position, reg.organization].filter(Boolean).join(" • ");
      page.drawText(truncate(line, 48), {
        x: 20,
        y: H - 122,
        size: 11,
        font,
        color: rgb(0.35, 0.35, 0.4),
      });
    }

    // Date / lieu
    if (ev?.starts_at) {
      const d = new Date(ev.starts_at).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      });
      page.drawText(d, { x: 20, y: 60, size: 9, font, color: rgb(0.3, 0.3, 0.35) });
    }
    if (ev?.location) {
      page.drawText(truncate(ev.location, 60), {
        x: 20,
        y: 46,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.35),
      });
    }
    page.drawText(`ID: ${reg.id.slice(0, 8).toUpperCase()}`, {
      x: 20,
      y: 24,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.55),
    });

    // QR code
    const qrPng = await QRCode.toBuffer(reg.qr_token, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = 130;
    page.drawImage(qrImg, { x: W - qrSize - 20, y: 30, width: qrSize, height: qrSize });
    page.drawText("Scannez à l'entrée", {
      x: W - qrSize - 20,
      y: 16,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.45),
    });

    const bytes = await pdf.save();
    const base64 = bufferToBase64(bytes);
    const safeName = (reg.full_name || "badge").replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "badge";
    return { ok: true as const, base64, filename: `badge-${safeName}.pdf` };
  });

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function bufferToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  // btoa is available in Workers
  return btoa(bin);
}
