import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
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
    <div className="section-gap">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux événements
        </Link>
      </Button>

      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Nouvel événement
            </h1>
            <p className="text-sm text-muted-foreground">
              Remplissez les informations pour créer un nouvel événement.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {orgId ? (
            <EventForm initial={emptyEventValues()} organizationId={orgId} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
