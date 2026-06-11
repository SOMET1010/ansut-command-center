/**
 * Redirect: /staff/checkin → existing /checkin
 * Staff layout provides the guard; this route forwards to the check-in module.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/staff/checkin")({
  beforeLoad: () => {
    throw redirect({ to: "/checkin" });
  },
  component: () => null,
});