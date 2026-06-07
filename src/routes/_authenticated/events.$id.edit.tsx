import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EventForm, eventToValues, type EventFormValues } from "@/components/event-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/events/$id/edit")({
  head: () => ({ meta: [{ title: "Éditer l'événement — ANSUT EVENT" }] }),
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const [values, setValues] = useState<EventFormValues | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("events").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error) toast.error(error.message);
      else if (data) {
        setValues(eventToValues(data));
        setOrgId(data.organization_id);
      }
    });
  }, [id]);

  return (
    <div className="section-gap">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/events"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux événements</Link>
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Edit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Éditer l'événement</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Modifiez les informations de votre événement.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="card-elevated rounded-2xl border border-border bg-card p-6 sm:p-8">
          {values && orgId ? (
            <EventForm initial={values} organizationId={orgId} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-3 text-sm text-muted-foreground">Chargement...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
