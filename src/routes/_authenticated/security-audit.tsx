/**
 * @deprecated — redirect to /admin/security
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/security-audit")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/security", statusCode: 301 });
  },
  component: () => null,
});