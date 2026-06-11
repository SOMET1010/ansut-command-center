/**
 * Redirect: org events/:id/sessions → existing events.$id.sessions
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/events/$id/sessions")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/events/${params.id}/sessions` });
  },
  component: () => null,
});