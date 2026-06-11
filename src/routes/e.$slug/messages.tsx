import { createFileRoute } from "@tanstack/react-router";
import { EventLayout } from "@/components/EventLayout";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/e/$slug/messages")({
  head: () => ({ meta: [{ title: "Messages — SUTEL 2026 | ANSUT EVENT" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { slug } = Route.useParams();

  return (
    <EventLayout eventId="" eventName="" slug={slug} qrToken={null}>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <div className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Prochainement disponible
        </div>
        <h2 className="mt-6 text-xl font-bold">Messages</h2>
        <p className="mt-1 text-xs text-muted-foreground">Module de messagerie entre participants</p>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Cette fonctionnalité sera activée pour les prochains événements. Vous pourrez échanger directement avec les participants rencontrés.
        </p>
      </div>
    </EventLayout>
  );
}