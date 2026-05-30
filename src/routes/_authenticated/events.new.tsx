import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EventForm, emptyEventValues } from "@/components/event-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/events/new")({
  head: () => ({ meta: [{ title: "Nouvel événement — ANSUT EVENT" }] }),
  component: NewEvent,
});

function NewEvent() {
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("organizations")
      .select("id")
      .eq("slug", "ansut")
      .single()
      .then(({ data, error }) => {
        if (error) toast.error("Organisation ANSUT introuvable");
        else setOrgId(data?.id ?? null);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/events"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Nouvel événement</h1>
      {orgId ? (
        <EventForm initial={emptyEventValues()} organizationId={orgId} />
      ) : (
        <p className="text-muted-foreground">Chargement...</p>
      )}
    </div>
  );
}
