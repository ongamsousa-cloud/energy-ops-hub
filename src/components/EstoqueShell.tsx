import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLE_LABEL, AppRole } from "@/lib/auth";
import { 
  LogOut, Package, Bell, LayoutDashboard, Boxes, 
  Warehouse as WarehouseIcon, History, AlertCircle, 
  Menu, TrendingUp, Settings
 dark} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: any; roles?: AppRole[] };

const NAV: Item[] = [
  { to: "/estoque-app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/estoque-app/materiais", label: "Materiais", icon: Boxes },
  { to: "/estoque-app/almoxarifados", label: "Almoxarifados", icon: WarehouseIcon },
  { to: "/estoque-app/movimentacoes", label: "Movimentações", icon: History },
  { to: "/estoque-app/alertas", label: "Alertas Críticos", icon: AlertCircle },
];

export default function EstoqueShell() {
  const { profile, roles, hasRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => !i.roles || hasRole(i.roles));

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/estoque-app" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none tracking-tight">Almoxarifado</span>
              <span className="text-[10px] font-medium leading-none text-muted-foreground uppercase tracking-widest">Departamento de Estoque</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex border-primary/30 text-primary">PORTAL DO ALMOXARIFE</Badge>
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

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-14 left-0 z-20 w-60 border-r border-border bg-card transition-transform md:static md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-0.5 p-2">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.to === "/estoque-app"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    isActive && "bg-accent text-foreground font-medium border-l-2 border-primary rounded-l-none pl-2"
                  )
                }
              >
                <i.icon className="h-4 w-4" strokeWidth={1.5} />
                <span>{i.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-[10px] md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
