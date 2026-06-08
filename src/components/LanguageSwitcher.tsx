import { Globe } from "lucide-react";
import { type Language, LANGUAGES } from "@/lib/i18n";

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}

/**
 * Sélecteur de langue pour les pages publiques.
 * Affiche les 4 langues UAT : FR, EN, AR, PT.
 */
export function LanguageSwitcher({
  language,
  onLanguageChange,
  compact = false,
}: LanguageSwitcherProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white/80 backdrop-blur-sm px-2 py-1">
        <Globe className="h-3 w-3 text-muted-foreground" />
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
              language === lang.code
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
            }`}
            title={lang.label}
          >
            {lang.code}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              language === lang.code
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
            }`}
            title={lang.label}
          >
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
