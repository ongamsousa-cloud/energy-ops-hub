import { Link, Outlet } from "react-router-dom";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { LogOut, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EstoqueShell() {
  const { profile, roles, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link to="/estoque" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-none tracking-tight">Almoxarifado</span>
            <span className="text-[10px] font-medium leading-none text-muted-foreground uppercase tracking-widest">Departamento de Estoque</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px]">DEPTO. ESTOQUE</Badge>
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium leading-tight">{profile?.nome}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {roles[0] ? ROLE_LABEL[roles[0]] : "Almoxarife"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
