/**
 * Système de traduction multilingue pour ANSUT EVENT
 * Langues supportées : Français (fr), Anglais (en), Arabe (ar), Portugais (pt)
 * Contexte : Union Africaine des Télécommunications (UAT) — pays francophones,
 * anglophones, arabophones et lusophones.
 */

export type Language = "fr" | "en" | "ar" | "pt";

export const LANGUAGES: { code: Language; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "pt", label: "Português", flag: "🇵🇹", dir: "ltr" },
];

// Clés de traduction organisées par section
export type TranslationKey = keyof typeof translations.fr;

export const translations = {
  fr: {
    // Navigation
    "nav.home": "Accueil",
    "nav.announcements": "Annonces",
    "nav.program": "Programme",
    "nav.directory": "Annuaire",
    "nav.registration": "Inscription",
    "nav.admin": "Espace organisateur",
    "nav.messages": "Messages",
    "nav.matchmaking": "Matchmaking",

    // Page inscription
    "reg.title": "Inscription à l'événement",
    "reg.full_name": "Nom complet",
    "reg.email": "Adresse email",
    "reg.phone": "Téléphone",
    "reg.organization": "Organisation",
    "reg.position": "Fonction / Poste",
    "reg.country": "Pays",
    "reg.submit": "S'inscrire",
    "reg.success": "Inscription confirmée !",
    "reg.success_desc": "Vous recevrez un email de confirmation avec votre badge.",
    "reg.closed": "Inscriptions clôturées",
    "reg.full": "La capacité maximale a été atteinte.",

    // Agenda
    "agenda.title": "Programme",
    "agenda.search": "Rechercher une session...",
    "agenda.no_sessions": "Aucune session trouvée",
    "agenda.all_days": "Tous les jours",
    "agenda.speakers": "Intervenants",
    "agenda.location": "Lieu",

    // Networking
    "net.title": "Annuaire des participants",
    "net.search": "Rechercher un participant...",
    "net.no_results": "Aucun participant trouvé",
    "net.contact": "Contacter",
    "net.matchmaking_cta": "Matchmaking intelligent",
    "net.matchmaking_desc": "Découvrez les participants qui partagent vos centres d'intérêt",

    // Annonces
    "ann.title": "Annonces en direct",
    "ann.no_announcements": "Aucune annonce pour le moment",
    "ann.auto_refresh": "Mise à jour automatique toutes les 10 secondes",
    "ann.pinned": "Épinglé",

    // Chat / Messages
    "msg.title": "Messages",
    "msg.no_conversations": "Aucune conversation",
    "msg.type_message": "Écrire un message...",
    "msg.send": "Envoyer",

    // WiFi
    "wifi.title": "Connexion WiFi",
    "wifi.scan": "Scannez ce QR code pour vous connecter automatiquement",
    "wifi.network": "Réseau",
    "wifi.password": "Mot de passe",
    "wifi.compatible": "Compatible iPhone et Android",

    // Sondages
    "poll.title": "Sondage en direct",
    "poll.vote": "Voter",
    "poll.voted": "Vote enregistré !",
    "poll.thanks": "Merci pour votre participation.",
    "poll.already_voted": "Déjà voté",
    "poll.closed": "Sondage terminé",
    "poll.results": "Résultats en direct",

    // Chatbot
    "bot.name": "SUTA",
    "bot.subtitle": "Assistante IA",
    "bot.placeholder": "Posez votre question...",
    "bot.open": "Ouvrir l'assistant",

    // Commun
    "common.loading": "Chargement...",
    "common.error": "Une erreur est survenue",
    "common.retry": "Réessayer",
    "common.back": "Retour",
    "common.close": "Fermer",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.language": "Langue",
  },

  en: {
    "nav.home": "Home",
    "nav.announcements": "Announcements",
    "nav.program": "Program",
    "nav.directory": "Directory",
    "nav.registration": "Registration",
    "nav.admin": "Admin panel",
    "nav.messages": "Messages",
    "nav.matchmaking": "Matchmaking",

    "reg.title": "Event Registration",
    "reg.full_name": "Full name",
    "reg.email": "Email address",
    "reg.phone": "Phone",
    "reg.organization": "Organization",
    "reg.position": "Position / Title",
    "reg.country": "Country",
    "reg.submit": "Register",
    "reg.success": "Registration confirmed!",
    "reg.success_desc": "You will receive a confirmation email with your badge.",
    "reg.closed": "Registration closed",
    "reg.full": "Maximum capacity has been reached.",

    "agenda.title": "Program",
    "agenda.search": "Search a session...",
    "agenda.no_sessions": "No sessions found",
    "agenda.all_days": "All days",
    "agenda.speakers": "Speakers",
    "agenda.location": "Location",

    "net.title": "Participant Directory",
    "net.search": "Search a participant...",
    "net.no_results": "No participants found",
    "net.contact": "Contact",
    "net.matchmaking_cta": "Smart Matchmaking",
    "net.matchmaking_desc": "Discover participants who share your interests",

    "ann.title": "Live Announcements",
    "ann.no_announcements": "No announcements yet",
    "ann.auto_refresh": "Auto-refresh every 10 seconds",
    "ann.pinned": "Pinned",

    "msg.title": "Messages",
    "msg.no_conversations": "No conversations",
    "msg.type_message": "Type a message...",
    "msg.send": "Send",

    "wifi.title": "WiFi Connection",
    "wifi.scan": "Scan this QR code to connect automatically",
    "wifi.network": "Network",
    "wifi.password": "Password",
    "wifi.compatible": "Compatible with iPhone and Android",

    "poll.title": "Live Poll",
    "poll.vote": "Vote",
    "poll.voted": "Vote recorded!",
    "poll.thanks": "Thank you for participating.",
    "poll.already_voted": "Already voted",
    "poll.closed": "Poll closed",
    "poll.results": "Live results",

    "bot.name": "SUTA",
    "bot.subtitle": "AI Assistant",
    "bot.placeholder": "Ask your question...",
    "bot.open": "Open assistant",

    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
    "common.back": "Back",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.language": "Language",
  },

  ar: {
    "nav.home": "الرئيسية",
    "nav.announcements": "الإعلانات",
    "nav.program": "البرنامج",
    "nav.directory": "الدليل",
    "nav.registration": "التسجيل",
    "nav.admin": "لوحة الإدارة",
    "nav.messages": "الرسائل",
    "nav.matchmaking": "التوفيق",

    "reg.title": "التسجيل في الحدث",
    "reg.full_name": "الاسم الكامل",
    "reg.email": "البريد الإلكتروني",
    "reg.phone": "الهاتف",
    "reg.organization": "المنظمة",
    "reg.position": "المنصب / الوظيفة",
    "reg.country": "البلد",
    "reg.submit": "تسجيل",
    "reg.success": "تم تأكيد التسجيل!",
    "reg.success_desc": "ستتلقى بريدًا إلكترونيًا للتأكيد مع شارتك.",
    "reg.closed": "التسجيل مغلق",
    "reg.full": "تم الوصول إلى السعة القصوى.",

    "agenda.title": "البرنامج",
    "agenda.search": "البحث عن جلسة...",
    "agenda.no_sessions": "لم يتم العثور على جلسات",
    "agenda.all_days": "جميع الأيام",
    "agenda.speakers": "المتحدثون",
    "agenda.location": "الموقع",

    "net.title": "دليل المشاركين",
    "net.search": "البحث عن مشارك...",
    "net.no_results": "لم يتم العثور على مشاركين",
    "net.contact": "اتصال",
    "net.matchmaking_cta": "التوفيق الذكي",
    "net.matchmaking_desc": "اكتشف المشاركين الذين يشاركونك اهتماماتك",

    "ann.title": "الإعلانات المباشرة",
    "ann.no_announcements": "لا توجد إعلانات حتى الآن",
    "ann.auto_refresh": "تحديث تلقائي كل 10 ثوانٍ",
    "ann.pinned": "مثبت",

    "msg.title": "الرسائل",
    "msg.no_conversations": "لا توجد محادثات",
    "msg.type_message": "اكتب رسالة...",
    "msg.send": "إرسال",

    "wifi.title": "اتصال واي فاي",
    "wifi.scan": "امسح رمز QR هذا للاتصال تلقائيًا",
    "wifi.network": "الشبكة",
    "wifi.password": "كلمة المرور",
    "wifi.compatible": "متوافق مع iPhone و Android",

    "poll.title": "استطلاع مباشر",
    "poll.vote": "تصويت",
    "poll.voted": "تم تسجيل التصويت!",
    "poll.thanks": "شكرًا لمشاركتك.",
    "poll.already_voted": "تم التصويت بالفعل",
    "poll.closed": "انتهى الاستطلاع",
    "poll.results": "النتائج المباشرة",

    "bot.name": "SUTA",
    "bot.subtitle": "مساعدة ذكية",
    "bot.placeholder": "اطرح سؤالك...",
    "bot.open": "فتح المساعد",

    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.retry": "إعادة المحاولة",
    "common.back": "رجوع",
    "common.close": "إغلاق",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.confirm": "تأكيد",
    "common.language": "اللغة",
  },

  pt: {
    "nav.home": "Início",
    "nav.announcements": "Anúncios",
    "nav.program": "Programa",
    "nav.directory": "Diretório",
    "nav.registration": "Inscrição",
    "nav.admin": "Painel administrativo",
    "nav.messages": "Mensagens",
    "nav.matchmaking": "Matchmaking",

    "reg.title": "Inscrição no Evento",
    "reg.full_name": "Nome completo",
    "reg.email": "Endereço de email",
    "reg.phone": "Telefone",
    "reg.organization": "Organização",
    "reg.position": "Cargo / Função",
    "reg.country": "País",
    "reg.submit": "Inscrever-se",
    "reg.success": "Inscrição confirmada!",
    "reg.success_desc": "Você receberá um email de confirmação com seu crachá.",
    "reg.closed": "Inscrições encerradas",
    "reg.full": "A capacidade máxima foi atingida.",

    "agenda.title": "Programa",
    "agenda.search": "Pesquisar uma sessão...",
    "agenda.no_sessions": "Nenhuma sessão encontrada",
    "agenda.all_days": "Todos os dias",
    "agenda.speakers": "Palestrantes",
    "agenda.location": "Local",

    "net.title": "Diretório de Participantes",
    "net.search": "Pesquisar um participante...",
    "net.no_results": "Nenhum participante encontrado",
    "net.contact": "Contatar",
    "net.matchmaking_cta": "Matchmaking Inteligente",
    "net.matchmaking_desc": "Descubra participantes que compartilham seus interesses",

    "ann.title": "Anúncios ao Vivo",
    "ann.no_announcements": "Nenhum anúncio ainda",
    "ann.auto_refresh": "Atualização automática a cada 10 segundos",
    "ann.pinned": "Fixado",

    "msg.title": "Mensagens",
    "msg.no_conversations": "Nenhuma conversa",
    "msg.type_message": "Escreva uma mensagem...",
    "msg.send": "Enviar",

    "wifi.title": "Conexão WiFi",
    "wifi.scan": "Escaneie este QR code para conectar automaticamente",
    "wifi.network": "Rede",
    "wifi.password": "Senha",
    "wifi.compatible": "Compatível com iPhone e Android",

    "poll.title": "Enquete ao Vivo",
    "poll.vote": "Votar",
    "poll.voted": "Voto registrado!",
    "poll.thanks": "Obrigado por participar.",
    "poll.already_voted": "Já votou",
    "poll.closed": "Enquete encerrada",
    "poll.results": "Resultados ao vivo",

    "bot.name": "SUTA",
    "bot.subtitle": "Assistente IA",
    "bot.placeholder": "Faça sua pergunta...",
    "bot.open": "Abrir assistente",

    "common.loading": "Carregando...",
    "common.error": "Ocorreu um erro",
    "common.retry": "Tentar novamente",
    "common.back": "Voltar",
    "common.close": "Fechar",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.confirm": "Confirmar",
    "common.language": "Idioma",
  },
} as const;

/**
 * Hook et utilitaires pour le système i18n
 */

const STORAGE_KEY = "ansut_event_language";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "fr";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ["fr", "en", "ar", "pt"].includes(stored)) {
    return stored as Language;
  }
  // Détection automatique via le navigateur
  const browserLang = navigator.language?.slice(0, 2);
  if (browserLang === "en") return "en";
  if (browserLang === "ar") return "ar";
  if (browserLang === "pt") return "pt";
  return "fr";
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
  // Mettre à jour la direction du document pour l'arabe
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function t(key: TranslationKey, lang: Language = "fr"): string {
  return translations[lang]?.[key] ?? translations.fr[key] ?? key;
}
