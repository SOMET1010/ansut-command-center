import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, BarChart3, Vote } from "lucide-react";

export const Route = createFileRoute("/poll/$pollId")({
  component: PollVote,
});

function PollVote() {
  const { pollId } = Route.useParams();
  const [poll, setPoll] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [step, setStep] = useState<
    "identify" | "vote" | "success" | "closed" | "already" | "error"
  >("identify");
  const [badgeCode, setBadgeCode] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from("live_polls")
        .select("*, session:event_sessions(title, event_id)")
        .eq("id", pollId)
        .single();

      if (p) {
        setPoll({ ...p, options: Array.isArray(p.options) ? p.options : [] });
        setSession(p.session);
        if (!p.is_active && p.closed_at) {
          setStep("closed");
        }
      }
      setPageLoading(false);
    }
    load();
  }, [pollId]);

  const [tokenSaved, setTokenSaved] = useState("");

  async function handleIdentify(e: React.FormEvent) {
    e.preventDefault();
    if (!badgeCode.trim()) return;
    setLoading(true);

    try {
      const { data: reg } = await supabase.rpc("me_registration", { p_qr_token: badgeCode.trim() });
      const me = Array.isArray(reg) && reg[0] ? reg[0] : null;
      if (!me || (session && me.event_id !== session.event_id)) {
        setStep("error");
        setLoading(false);
        return;
      }
      setParticipantId(me.id);
      setTokenSaved(badgeCode.trim());
      setStep("vote");
    } catch {
      setStep("error");
    }
    setLoading(false);
  }

  async function handleVote() {
    if (!tokenSaved) return;
    setLoading(true);

    let answer: any;
    if (poll.poll_type === "single") answer = selectedOption;
    else if (poll.poll_type === "multi") answer = selectedOptions;
    else if (poll.poll_type === "rating") answer = rating;
    else answer = selectedOption;

    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("cast_poll_vote", {
      p_qr_token: tokenSaved,
      p_poll_id: pollId,
      p_answer: answer,
    });
    const result = data as { ok: boolean; error?: string } | null;
    if (error || !result?.ok) {
      if (result?.error === "already_voted") setStep("already");
      else if (result?.error === "poll_closed") setStep("closed");
      else setStep("error");
    } else {
      const { data: votes } = await supabase
        .from("live_poll_votes")
        .select("answer")
        .eq("poll_id", pollId);
      if (votes) {
        const counts: Record<string, number> = {};
        votes.forEach((v: any) => {
          const ans =
            typeof v.answer === "string" ? v.answer.replace(/^"|"$/g, "") : String(v.answer);
          counts[ans] = (counts[ans] || 0) + 1;
        });
        setResults(counts);
        setTotalVotes(votes.length);
      }
      setStep("success");
    }
    setLoading(false);
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-lg text-muted-foreground">Sondage introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-purple-600">
            Sondage en direct
          </p>
          {session && <p className="mt-1 text-xs text-muted-foreground">{session.title}</p>}
        </div>

        {/* Étape : Identification */}
        {step === "identify" && (
          <form onSubmit={handleIdentify} className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-1 text-center text-lg font-bold">{poll.question}</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Identifiez-vous avec votre code badge pour voter
            </p>
            <input
              type="text"
              value={badgeCode}
              onChange={(e) => setBadgeCode(e.target.value)}
              placeholder="Code badge"
              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-center font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !badgeCode.trim()}
              className="mt-4 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Participer au vote"}
            </button>
          </form>
        )}

        {/* Étape : Vote */}
        {step === "vote" && (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-center text-lg font-bold">{poll.question}</h2>

            {/* Single choice */}
            {poll.poll_type === "single" && (
              <div className="space-y-3">
                {poll.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition ${
                      selectedOption === option
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-border bg-slate-50 text-foreground hover:border-purple-200"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple choice */}
            {poll.poll_type === "multi" && (
              <div className="space-y-3">
                {poll.options.map((option: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedOptions((prev) =>
                        prev.includes(option)
                          ? prev.filter((o) => o !== option)
                          : [...prev, option],
                      );
                    }}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition ${
                      selectedOptions.includes(option)
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-border bg-slate-50 text-foreground hover:border-purple-200"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded border-2 border-current text-xs">
                      {selectedOptions.includes(option) ? "✓" : ""}
                    </span>
                    {option}
                  </button>
                ))}
                <p className="text-center text-xs text-muted-foreground">
                  Plusieurs réponses possibles
                </p>
              </div>
            )}

            {/* Rating */}
            {poll.poll_type === "rating" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-4xl transition ${
                        star <= rating ? "text-yellow-400" : "text-slate-200"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {rating === 0 ? "Cliquez pour noter" : `${rating}/5`}
                </p>
              </div>
            )}

            <button
              onClick={handleVote}
              disabled={
                loading ||
                (poll.poll_type === "single" && !selectedOption) ||
                (poll.poll_type === "multi" && selectedOptions.length === 0) ||
                (poll.poll_type === "rating" && rating === 0)
              }
              className="mt-6 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Voter"}
            </button>
          </div>
        )}

        {/* Étape : Succès */}
        {step === "success" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-700">Vote enregistré !</h2>
            <p className="mt-2 text-sm text-muted-foreground">Merci pour votre participation.</p>

            {/* Résultats si disponibles */}
            {poll.show_results && Object.keys(results).length > 0 && (
              <div className="mt-6 space-y-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Résultats en direct
                </p>
                {poll.options.map((option: string, idx: number) => {
                  const count = results[option] || 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{option}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-center text-xs text-muted-foreground">{totalVotes} vote(s)</p>
              </div>
            )}
          </div>
        )}

        {/* Étape : Déjà voté */}
        {step === "already" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Vote className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-blue-700">Déjà voté</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous avez déjà participé à ce sondage. Un seul vote par personne est autorisé.
            </p>
          </div>
        )}

        {/* Étape : Sondage fermé */}
        {step === "closed" && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-600">Sondage terminé</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ce sondage n'est plus actif. Les résultats seront affichés sur l'écran principal.
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
            <p className="mt-2 text-sm text-muted-foreground">
              Le code badge saisi ne correspond à aucun participant inscrit.
            </p>
            <button
              onClick={() => {
                setStep("identify");
                setBadgeCode("");
              }}
              className="mt-6 rounded-xl bg-slate-100 px-6 py-2 text-sm font-medium transition hover:bg-slate-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          ANSUT Command Center — Sondage interactif
        </p>
      </div>
    </div>
  );
}
