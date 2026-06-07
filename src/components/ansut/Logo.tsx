import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo-ansut.jpg.asset.json";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { box: string; img: string }> = {
  sm: { box: "h-8 px-2", img: "h-5" },
  md: { box: "h-10 px-2.5", img: "h-6" },
  lg: { box: "h-14 px-4", img: "h-9" },
};

/**
 * Logo officiel ANSUT.
 * - Toujours rendu sur fond blanc (préserve la lisibilité de l'orange + bleu).
 * - Utiliser <AnsutLogo /> partout (header, sidebar, auth, footer) — ne jamais re-uploader le fichier.
 */
export function AnsutLogo({
  size = "md",
  className,
  withLink = false,
  alt = "ANSUT — Agence Nationale du Service Universel des Télécommunications-TIC",
}: {
  size?: Size;
  className?: string;
  withLink?: boolean;
  alt?: string;
}) {
  const s = SIZE[size];
  const inner = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-black/5",
        s.box,
        className,
      )}
    >
      <img src={logoAsset.url} alt={alt} className={cn("w-auto object-contain", s.img)} />
    </span>
  );
  return withLink ? <Link to="/">{inner}</Link> : inner;
}
