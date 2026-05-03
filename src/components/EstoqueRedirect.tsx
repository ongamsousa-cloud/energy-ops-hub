import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";

export default function EstoqueRedirect({ children }: { children: React.ReactNode }) {
  const { isEstoqueDept, loading } = useAuth();
  if (loading) return null;
  if (isEstoqueDept) return <Navigate to="/estoque-app" replace />;
  return <>{children}</>;
}
