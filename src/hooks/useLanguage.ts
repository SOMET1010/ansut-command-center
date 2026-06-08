import { useState, useEffect, useCallback } from "react";
import { type Language, type TranslationKey, getStoredLanguage, setStoredLanguage, t as translate } from "@/lib/i18n";

/**
 * Hook React pour gérer la langue courante et les traductions.
 * Persiste le choix dans localStorage et détecte automatiquement la langue du navigateur.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(stored);
    setStoredLanguage(stored); // Applique dir/lang au document
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(key, language),
    [language]
  );

  return { language, setLanguage, t };
}
