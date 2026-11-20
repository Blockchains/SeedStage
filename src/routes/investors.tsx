import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/investors")({
  component: () => <Outlet />,
});
