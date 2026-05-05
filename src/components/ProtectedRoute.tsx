import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AppRole, useAuth } from "@/lib/auth";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: AppRole[] }) {
  const { user, loading, hasRole, profile } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (profile?.must_change_password && loc.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />;
  }
  if (roles && !hasRole(roles)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}