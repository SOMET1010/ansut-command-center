import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./checkin";

export const Route = createFileRoute("/_authenticated/participants")({
  head: () => ({ meta: [{ title: "Participants — ANSUT EVENT" }] }),
  component: () => <ComingSoon title="Participants" phase="Phase 2" />,
});
