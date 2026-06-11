import { Link } from "@tanstack/react-router";
import ansutLogo from "@/assets/ansut-logo-officiel.png";
import { cn } from "@/lib/utils";

// v2 - logo officiel ANSUT charte graphique PDF (PNG local 76 KB)

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, { box: string; img: string }> = {
  sm: { box: "h-8 px-2", img: "h-5" },
  md: { box: "h-10 px-2", img: "h-7" },
  lg: { box: "h-14 px-3", img: "h-10" },
};

/**
 * Logo officiel ANSUT (charte graphique).
 * - Source: charte ANSUT officielle (PDF), logo bleu #2256A3 + signature orange.
 * - Toujours rendu sur fond blanc (préserve la lisibilité).
 * - Utiliser <AnsutLogo /> partout (header, sidebar, auth, footer).
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
      <img src={ansutLogo} alt={alt} className={cn("w-auto object-contain", s.img)} />
    </span>
  );
  return withLink ? <Link to="/">{inner}</Link> : inner;
}
