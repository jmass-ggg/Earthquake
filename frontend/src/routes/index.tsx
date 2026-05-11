import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  if (typeof window === "undefined") return null;
  return <Navigate to={isLoggedIn() ? "/dashboard" : "/login"} />;
}
