import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/attendance/$sessionId")({
  component: SessionAttendance,
});

function SessionAttendance() {
  const { sessionId } = Route.useParams();
  const [session, setSession] = useState<any>(null);
  const [step, setStep] = useState<"identify" | "success" | "already" | "error">("identify");
  const [badgeCode, setBadgeCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase
        .from("event_sessions")
        .select("*, event:events(title, slug)")
        .eq("id", sessionId)
        .single();
      if (sess) setSession(sess);

      const { count } = await supabase
        .from("session_attendance")
        .select("*", { count: "exact", head: true })
        .eq("session_id", sessionId);
      setAttendanceCount(count || 0);

      setPageLoading(false);
    }
    load();
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!badgeCode.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("record_session_attendance", {
        p_qr_token: badgeCode.trim(),
        p_session_id: sessionId,
      });
      if (error || !data) {
        setStep("error");
        setLoading(false);
        return;
      }
      const result = data as { ok: boolean; error?: string; already?: boolean; full_name?: string };
      if (!result.ok) {
        setStep("error");
      } else {
        setParticipantName(result.full_name ?? "");
        if (result.already) {
          setStep("already");
        } else {
          setAttendanceCount((c) => c + 1);
          setStep("success");
        }
      }
    } catch {
      setStep("error");
    }
    setLoading(false);
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-lg text-muted-foreground">Session introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-foreground">{session.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(session.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {" — "}
            {new Date(session.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {session.location && ` · ${session.location}`}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            <Users className="h-3 w-3" />
            {attendanceCount} présent{attendanceCount > 1 ? "s" : ""}
          </div>
        </div>

        {/* Étape : Identification */}
        {step === "identify" && (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-center">Confirmer votre présence</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Entrez le code qui figure sous le QR code de votre badge
            </p>
            <input
              type="text"
              value={badgeCode}
              onChange={(e) => setBadgeCode(e.target.value)}
              placeholder="Code badge (ex: a1b2c3d4-...)"
              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-center font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !badgeCode.trim()}
              className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Confirmer ma présence"}
            </button>
          </form>
        )}

        {/* Étape : Succès */}
        {step === "success" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-700">Présence confirmée !</h2>
            <p className="mt-2 text-muted-foreground">
              Merci <span className="font-semibold text-foreground">{participantName}</span>, votre participation à cette session est enregistrée.
            </p>
            <div className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              <Clock className="mb-1 inline h-4 w-4" /> Enregistré à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}

        {/* Étape : Déjà enregistré */}
        {step === "already" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-blue-700">Déjà enregistré</h2>
            <p className="mt-2 text-muted-foreground">
              <span className="font-semibold text-foreground">{participantName}</span>, votre présence à cette session est déjà confirmée. Bonne session !
            </p>
          </div>
        )}

        {/* Étape : Erreur */}
        {step === "error" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-700">Code non reconnu</h2>
            <p className="mt-2 text-muted-foreground">
              Le code badge saisi ne correspond à aucun participant inscrit à cet événement.
            </p>
            <button
              onClick={() => { setStep("identify"); setBadgeCode(""); }}
              className="mt-6 rounded-xl bg-slate-100 px-6 py-2 text-sm font-medium text-foreground transition hover:bg-slate-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {session.event?.title} — ANSUT Command Center
        </p>
      </div>
    </div>
  );
}
