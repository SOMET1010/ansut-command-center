/**
 * Redirect: org events/:id/edit → existing events.$id.edit
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/events/$id/edit")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/events/${params.id}/edit` });
  },
  component: () => null,
});