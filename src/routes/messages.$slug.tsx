import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnsutLogo } from "@/components/ansut/Logo";
import { MessageCircle, Send, ArrowLeft, Users, Search, Check, CheckCheck } from "lucide-react";

/* ─── Types ─── */
type Participant = {
  id: string;
  full_name: string;
  organization: string | null;
  participant_category: string;
};

type Conversation = {
  id: string;
  other: Participant;
  last_message: string | null;
  last_at: string | null;
  unread_count: number;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

/* ─── Route ─── */
export const Route = createFileRoute("/messages/$slug")({
  component: MessagesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
    to: (search.to as string) || "",
  }),
});

function MessagesPage() {
  const { slug } = Route.useParams();
  const { token, to } = Route.useSearch();
  const [myToken, setMyToken] = useState(token);
  const [tokenInput, setTokenInput] = useState("");
  const [me, setMe] = useState<Participant | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<Participant | null>(null);

  // Identifier le participant courant via son qr_token
  useEffect(() => {
    if (!myToken) return;
    async function identify() {
      const { data } = await supabase
        .from("event_registrations")
        .select("id, full_name, organization, participant_category")
        .eq("qr_token", myToken)
        .single();
      if (data) setMe(data as Participant);
    }
    identify();
  }, [myToken]);

  // Si un destinataire est spécifié (depuis l'annuaire), ouvrir/créer la conversation
  useEffect(() => {
    if (!me || !to) return;
    async function openConversation() {
      // Trouver l'événement
      const { data: event } = await supabase.from("events").select("id").eq("slug", slug).single();
      if (!event) return;

      // Créer ou récupérer la conversation
      const { data: convId } = await supabase.rpc("get_or_create_conversation", {
        p_event_id: event.id,
        p_participant_a: me!.id,
        p_participant_b: to,
      });
      if (convId) {
        setActiveConversation(convId as string);
        // Charger les infos du destinataire
        const { data: peer } = await supabase
          .from("event_registrations")
          .select("id, full_name, organization, participant_category")
          .eq("id", to)
          .single();
        if (peer) setActivePeer(peer as Participant);
      }
    }
    openConversation();
  }, [me, to, slug]);

  // Écran d'identification par token
  if (!myToken) {
    return (
      <PageShell slug={slug}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <MessageCircle className="h-12 w-12 text-primary mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Messagerie événement</h1>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Pour accéder à vos messages, entrez le code unique qui figure sur votre badge (sous le
            QR code).
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tokenInput.trim()) setMyToken(tokenInput.trim());
            }}
            className="w-full max-w-sm flex gap-2"
          >
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Votre code badge..."
              className="h-11 text-base"
            />
            <Button type="submit" className="h-11 px-5">
              Accéder
            </Button>
          </form>
        </div>
      </PageShell>
    );
  }

  if (!me) {
    return (
      <PageShell slug={slug}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell slug={slug}>
      <div className="flex h-[calc(100dvh-64px)] overflow-hidden">
        {/* Sidebar conversations (masquée sur mobile si conversation active) */}
        <div
          className={`w-full sm:w-80 sm:border-r border-slate-200 flex flex-col ${
            activeConversation ? "hidden sm:flex" : "flex"
          }`}
        >
          <ConversationList
            me={me}
            slug={slug}
            activeId={activeConversation}
            onSelect={(convId, peer) => {
              setActiveConversation(convId);
              setActivePeer(peer);
            }}
          />
        </div>

        {/* Zone de chat */}
        <div className={`flex-1 flex flex-col ${!activeConversation ? "hidden sm:flex" : "flex"}`}>
          {activeConversation && activePeer ? (
            <ChatView
              conversationId={activeConversation}
              me={me}
              peer={activePeer}
              onBack={() => {
                setActiveConversation(null);
                setActivePeer(null);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Sélectionnez une conversation ou</p>
                <Link
                  to={`/networking/${slug}`}
                  className="text-primary font-medium hover:underline"
                >
                  parcourez l'annuaire pour contacter un participant
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* ─── Liste des conversations ─── */
function ConversationList({
  me,
  slug,
  activeId,
  onSelect,
}: {
  me: Participant;
  slug: string;
  activeId: string | null;
  onSelect: (convId: string, peer: Participant) => void;
}) {
  const [search, setSearch] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", me.id],
    queryFn: async () => {
      // Charger toutes les conversations où je suis participant_a ou participant_b
      const { data: convs } = await supabase
        .from("event_conversations")
        .select("id, participant_a, participant_b, created_at")
        .or(`participant_a.eq.${me.id},participant_b.eq.${me.id}`)
        .order("created_at", { ascending: false });

      if (!convs || convs.length === 0) return [];

      // Pour chaque conversation, charger l'autre participant et le dernier message
      const results: Conversation[] = [];
      for (const conv of convs) {
        const otherId = conv.participant_a === me.id ? conv.participant_b : conv.participant_a;

        const [{ data: other }, { data: lastMsg }, { count: unread }] = await Promise.all([
          supabase
            .from("event_registrations")
            .select("id, full_name, organization, participant_category")
            .eq("id", otherId)
            .single(),
          supabase
            .from("event_messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("event_messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", me.id)
            .is("read_at", null),
        ]);

        if (other) {
          results.push({
            id: conv.id,
            other: other as Participant,
            last_message: lastMsg?.content ?? null,
            last_at: lastMsg?.created_at ?? conv.created_at,
            unread_count: unread ?? 0,
          });
        }
      }

      // Trier par dernier message
      results.sort((a, b) => {
        const da = a.last_at ? new Date(a.last_at).getTime() : 0;
        const db = b.last_at ? new Date(b.last_at).getTime() : 0;
        return db - da;
      });

      return results;
    },
    refetchInterval: 5000,
  });

  const filtered = search
    ? conversations.filter(
        (c) =>
          c.other.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (c.other.organization &&
            c.other.organization.toLowerCase().includes(search.toLowerCase())),
      )
    : conversations;

  return (
    <>
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-slate-800">Messages</h2>
          <Link
            to={`/networking/${slug}`}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <Users className="h-3.5 w-3.5" /> Annuaire
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Aucune conversation.</p>
            <Link
              to={`/networking/${slug}`}
              className="text-primary font-medium hover:underline text-xs"
            >
              Parcourir l'annuaire
            </Link>
          </div>
        ) : (
          filtered.map((conv) => {
            const initials = conv.other.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isActive = conv.id === activeId;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id, conv.other)}
                className={`w-full text-left px-3 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  isActive ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {conv.other.full_name}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

/* ─── Vue Chat ─── */
function ChatView({
  conversationId,
  me,
  peer,
  onBack,
}: {
  conversationId: string;
  me: Participant;
  peer: Participant;
  onBack: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Charger les messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_messages")
        .select("id, content, sender_id, read_at, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return (data ?? []) as Message[];
    },
    refetchInterval: 3000,
  });

  // Marquer les messages comme lus
  useEffect(() => {
    if (messages.length === 0) return;
    const unread = messages.filter((m) => m.sender_id !== me.id && !m.read_at);
    if (unread.length > 0) {
      supabase
        .from("event_messages")
        .update({ read_at: new Date().toISOString() })
        .in(
          "id",
          unread.map((m) => m.id),
        )
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["conversations", me.id] });
        });
    }
  }, [messages, me.id, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envoyer un message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("event_messages").insert({
        conversation_id: conversationId,
        sender_id: me.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", me.id] });
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = newMessage.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }, [newMessage, sendMutation]);

  const peerInitials = peer.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Header du chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onBack}
          className="sm:hidden p-1 rounded hover:bg-slate-100"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{peerInitials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{peer.full_name}</p>
          {peer.organization && (
            <p className="text-xs text-muted-foreground truncate">{peer.organization}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p>Démarrez la conversation avec {peer.full_name}.</p>
            <p className="text-xs mt-1">Les messages sont visibles uniquement par vous deux.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === me.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <div
                  className={`flex items-center gap-1 mt-1 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-[10px] ${isMine ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMine &&
                    (msg.read_at ? (
                      <CheckCheck className="h-3 w-3 text-white/70" />
                    ) : (
                      <Check className="h-3 w-3 text-white/70" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message..."
            maxLength={1000}
            className="h-11 text-base flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="h-11 w-11 rounded-full flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Messages limités à 1000 caractères. Respectez les autres participants.
        </p>
      </div>
    </>
  );
}

/* ─── Shell de page ─── */
function PageShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <AnsutLogo size="sm" />
            <span className="text-sm font-semibold text-slate-800">ANSUT EVENT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to={`/annonces/${slug}`}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Annonces
            </Link>
            <Link
              to={`/networking/${slug}`}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Annuaire
            </Link>
            <Link
              to={`/e/${slug}`}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Inscription
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
