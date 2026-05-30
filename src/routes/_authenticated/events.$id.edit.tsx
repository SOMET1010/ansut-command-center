import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto max-w-3xl p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/events"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
      </Button>
      <h1 className="mb-6 text-3xl font-bold">Éditer l'événement</h1>
      {values && orgId ? (
        <EventForm initial={values} organizationId={orgId} />
      ) : (
        <p className="text-muted-foreground">Chargement...</p>
      )}
    </div>
  );
}
