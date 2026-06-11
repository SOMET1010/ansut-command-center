/**
 * Redirect: org events/new → existing events.new
 * The org layout adds the org_admin guard; the nested route just forwards.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/org/events/new")({
  beforeLoad: () => {
    throw redirect({ to: "/events/new" });
  },
  component: () => null,
});