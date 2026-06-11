import { createContext, useContext } from "react";

export type EventLayoutContext = {
  eventId: string;
  eventName: string;
  slug: string;
  qrToken: string | null;
};

export const EventLayoutContext = createContext<EventLayoutContext | null>(null);

export function useEventLayout(): EventLayoutContext {
  const ctx = useContext(EventLayoutContext);
  if (!ctx) throw new Error("useEventLayout must be used within EventLayout route");
  return ctx;
}