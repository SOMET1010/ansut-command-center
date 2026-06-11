/**
 * @deprecated — redirect to /admin/bootstrap
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin.setup")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/bootstrap", statusCode: 301 });
  },
  component: () => null,
});