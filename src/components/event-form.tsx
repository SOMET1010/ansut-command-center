import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EventFormValues = {
  id?: string;
  organization_id?: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: string;
  cover_url: string;
  status: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emptyEventValues(): EventFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    location: "",
    starts_at: "",
    ends_at: "",
    capacity: "",
    cover_url: "",
    status: "draft",
  };
}

export function eventToValues(e: {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  cover_url: string | null;
  status: string;
}): EventFormValues {
  return {
    id: e.id,
    organization_id: e.organization_id,
    name: e.name,
    slug: e.slug,
    description: e.description ?? "",
    location: e.location ?? "",
    starts_at: toLocalInput(e.starts_at),
    ends_at: toLocalInput(e.ends_at),
    capacity: e.capacity?.toString() ?? "",
    cover_url: e.cover_url ?? "",
    status: e.status,
  };
}

export function EventForm({ initial, organizationId }: { initial: EventFormValues; organizationId: string }) {
  const navigate = useNavigate();
  const [v, setV] = useState<EventFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;

  function update<K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) {
    setV((prev) => {
      const next = { ...prev, [k]: val };
      if (k === "name" && !isEdit && !prev.slug) {
        next.slug = slugify(val as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.name || !v.starts_at || !v.ends_at) {
      toast.error("Nom, date de début et date de fin sont obligatoires");
      return;
    }
    if (new Date(v.ends_at) <= new Date(v.starts_at)) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    setSaving(true);
    const payload = {
      organization_id: organizationId,
      name: v.name.trim(),
      slug: v.slug.trim() || slugify(v.name),
      description: v.description || null,
      location: v.location || null,
      starts_at: new Date(v.starts_at).toISOString(),
      ends_at: new Date(v.ends_at).toISOString(),
      capacity: v.capacity ? Number(v.capacity) : null,
      cover_url: v.cover_url || null,
      status: v.status,
    };

    const { error, data } = isEdit
      ? await supabase.from("events").update(payload).eq("id", v.id!).select("id").single()
      : await supabase.from("events").insert(payload).select("id").single();

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isEdit ? "Événement mis à jour" : "Événement créé");
    navigate({ to: "/events" });
    void data;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name" className="text-sm font-semibold">Nom de l'événement *</Label>
          <Input id="name" value={v.name} onChange={(e) => update("name", e.target.value)} required placeholder="Ex: SUTEL 2026" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL publique)</Label>
          <Input id="slug" value={v.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="auto" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={v.status} onValueChange={(val) => update("status", val)}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="starts_at">Début *</Label>
          <Input id="starts_at" type="datetime-local" value={v.starts_at} onChange={(e) => update("starts_at", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_at">Fin *</Label>
          <Input id="ends_at" type="datetime-local" value={v.ends_at} onChange={(e) => update("ends_at", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input id="location" value={v.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité</Label>
          <Input id="capacity" type="number" min="0" value={v.capacity} onChange={(e) => update("capacity", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cover_url">Image de couverture (URL)</Label>
          <Input id="cover_url" value={v.cover_url} onChange={(e) => update("cover_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={6} value={v.description} onChange={(e) => update("description", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 border-t border-border pt-6">
        <Button type="submit" variant="ansut-orange" className="rounded-xl px-6" disabled={saving}>
          {saving ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer l'événement"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate({ to: "/events" })}>Annuler</Button>
      </div>
    </form>
  );
}
