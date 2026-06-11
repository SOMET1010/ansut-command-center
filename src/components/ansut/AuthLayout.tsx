import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AnsutLogo } from "@/components/ansut/Logo";

export type AuthLayoutProps = {
  /** Brand panel: small uppercase eyebrow label */
  eyebrow: string;
  /** Brand panel: large headline (may contain <br/>) */
  headline: ReactNode;
  /** Brand panel: supporting paragraph under the headline */
  description: ReactNode;
  /** Brand panel: bullet list / perks shown under the description */
  highlights?: ReactNode;
  /** Form panel: page title (e.g. "Connexion") */
  title: string;
  /** Form panel: subtitle under the title */
  subtitle: string;
  /** Form panel: the form itself */
  children: ReactNode;
  /** Form panel: footer (e.g. link to the other auth page) */
  footer?: ReactNode;
};

/**
 * Shared layout for /login and /signup.
 * Left = branded ANSUT navy panel (hidden on mobile).
 * Right = white form panel with logo, title, content and footer.
 */
export function AuthLayout({
  eyebrow,
  headline,
  description,
  highlights,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-[#F5EFE6] lg:grid-cols-2">
      {/* LEFT — Panneau Japandi : fond ivoire + accents vert + ocre */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 text-[#1F4D3A] lg:flex">
        {/* Décor feuille très subtile */}
        <div
          className="pointer-events-none absolute -left-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #1F4D3A 0%, transparent 60%)" }}
        />
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #C9A24C 0%, transparent 60%)" }}
        />

        <Link to="/" className="relative flex items-center gap-3">
          <AnsutLogo size="lg" />
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A24C]/30 bg-[#C9A24C]/10 px-3 py-1">
            <span className="flex h-2 w-2 rounded-full bg-[#C9A24C]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A24C]">
              {eyebrow}
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight text-[#1F4D3A] sm:text-5xl">
            {headline}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#1F4D3A]/70">{description}</p>
          {highlights ? <div className="mt-8">{highlights}</div> : null}
        </div>

        <div className="relative text-xs text-[#1F4D3A]/60">© 2026 ANSUT. Tous droits réservés.</div>
      </div>

      {/* RIGHT — Form panel — fond ivoire, carte blanche centrée */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#1F4D3A]/10 bg-white p-8 shadow-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <AnsutLogo size="md" />
          </Link>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#1F4D3A]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#1F4D3A]/60">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer ? (
            <p className="mt-6 text-center text-sm text-[#1F4D3A]/60">{footer}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
