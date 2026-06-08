import { useEffect, useState } from "react";
import { Wifi, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface WifiQrCodeProps {
  ssid: string;
  password?: string;
  encryption?: string; // WPA, WEP, nopass
  compact?: boolean;
}

/**
 * Composant qui génère un QR code WiFi au format standard.
 * Le participant scanne le QR code avec son téléphone pour se connecter automatiquement.
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;;
 */
export function WifiQrCode({ ssid, password, encryption = "WPA", compact = false }: WifiQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!ssid) return;

    // Format standard WiFi QR code
    const wifiString = `WIFI:T:${encryption};S:${ssid};P:${password || ""};;`;

    QRCode.toDataURL(wifiString, {
      width: compact ? 150 : 200,
      margin: 2,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl).catch(console.error);
  }, [ssid, password, encryption, compact]);

  if (!ssid || !qrDataUrl) return null;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm">
        <img src={qrDataUrl} alt="QR Code WiFi" className="h-16 w-16 rounded" />
        <div className="text-left">
          <p className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <Wifi className="h-3 w-3 text-primary" />
            {ssid}
          </p>
          {password && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Mot de passe : <span className="font-mono">{password}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Wifi className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Connexion WiFi</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Scannez ce QR code pour vous connecter automatiquement
      </p>
      <div className="mt-4 inline-block rounded-xl bg-white p-3 shadow-md">
        <img src={qrDataUrl} alt="QR Code WiFi" className="h-40 w-40" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium text-foreground">
          <span className="text-muted-foreground">Réseau :</span> {ssid}
        </p>
        {password && (
          <p className="text-xs font-medium text-foreground">
            <span className="text-muted-foreground">Mot de passe :</span>{" "}
            <span className="font-mono rounded bg-slate-100 px-1.5 py-0.5">{password}</span>
          </p>
        )}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        <QrCode className="mr-1 inline h-3 w-3" />
        Compatible iPhone et Android
      </p>
    </div>
  );
}
