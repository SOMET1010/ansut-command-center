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
  wifi_ssid: string;
  wifi_password: string;
  wifi_encryption: string;
};

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
    wifi_ssid: "",
    wifi_password: "",
    wifi_encryption: "WPA",
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
  wifi_ssid?: string | null;
  wifi_password?: string | null;
  wifi_encryption?: string | null;
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
    wifi_ssid: e.wifi_ssid ?? "",
    wifi_password: e.wifi_password ?? "",
    wifi_encryption: e.wifi_encryption ?? "WPA",
  };
}
