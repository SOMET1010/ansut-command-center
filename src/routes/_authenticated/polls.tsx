import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./checkin";

export const Route = createFileRoute("/_authenticated/polls")({
  head: () => ({ meta: [{ title: "Live Polling — ANSUT EVENT" }] }),
  component: () => <ComingSoon title="Live Polling" phase="Phase 4" />,
});
