import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLE_LABEL, AppRole } from "@/lib/auth";
import {
  LayoutDashboard, Briefcase, Users, UserCircle, Tag, ListChecks,
  ClipboardList, FileBarChart2, Calculator, ShieldCheck, LogOut, Menu, Bell, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: any; roles?: AppRole[] };

const NAV: Item[] = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard },
  { to: "/app/obras", label: "Obras", icon: Briefcase, roles: ["admin","gestor","supervisor","financeiro","auditor"] },
  { to: "/app/equipes", label: "Equipes", icon: Users, roles: ["admin","gestor","supervisor"] },
  { to: "/app/profissionais", label: "Profissionais", icon: UserCircle, roles: ["admin","gestor"] },
  { to: "/app/categorias", label: "Categorias", icon: Tag, roles: ["admin","gestor"] },
  { to: "/app/atividades", label: "Atividades", icon: ListChecks, roles: ["admin","gestor"] },
  { to: "/app/atividades/importar", label: "Importar Excel", icon: Upload, roles: ["admin","gestor"] },
  { to: "/app/os", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/app/aprovacoes", label: "Aprovações", icon: ShieldCheck, roles: ["admin","gestor","supervisor"] },
  { to: "/app/relatorios", label: "Relatórios", icon: FileBarChart2, roles: ["admin","gestor","financeiro","auditor"] },
  { to: "/app/medicao", label: "Medição", icon: Calculator, roles: ["admin","gestor","financeiro"] },
];

export default function AppShell() {
  const { profile, roles, hasRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((i) => !i.roles || hasRole(i.roles));

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/app" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-primary" />
            <span className="text-sm font-medium tracking-tight">Energia · Operações</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
          <div className="hidden text-right md:block">
            <div className="text-xs font-medium leading-tight">{profile?.nome}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {roles[0] ? ROLE_LABEL[roles[0]] : ""}
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
                end={i.to === "/app"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    isActive && "bg-accent text-foreground font-medium"
                  )
                }
              >
                <i.icon className="h-4 w-4" strokeWidth={1.5} />
                <span>{i.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}