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
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* LEFT — Branded navy panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-secondary/25 blur-[120px]" />

        <Link to="/" className="relative flex items-center gap-3">
          <AnsutLogo size="lg" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold">EVENT</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/75">
              Plateforme officielle du SUTEL
            </div>
          </div>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-secondary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              {eyebrow}
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight text-white">
            {headline}
          </h2>
          <p className="mt-4 max-w-md text-base text-white/75">{description}</p>
          {highlights ? <div className="mt-8">{highlights}</div> : null}
        </div>

        <div className="relative text-xs text-white/60">
          © 2026 ANSUT. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <AnsutLogo size="md" />
            <span className="text-lg font-semibold">EVENT</span>
          </Link>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
