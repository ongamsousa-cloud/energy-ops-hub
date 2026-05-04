import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLE_LABEL, AppRole } from "@/lib/auth";
import {
   LayoutDashboard, Briefcase, Users, UserCircle, Tag, ListChecks, Terminal,
   ClipboardList, FileBarChart2, Calculator, ShieldCheck, LogOut, Menu, Bell, Upload, MessageSquare, UserCheck, Package, Building2,
   Database, Palette, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import InstallAppButton from "@/components/InstallAppButton";
import NotificationBell from "@/components/NotificationBell";

type Item = { to: string; label: string; icon: any; roles?: AppRole[] };

const NAV: Item[] = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard },
  { to: "/app/os", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/app/obras", label: "Obras", icon: Briefcase, roles: ["admin","gestor","supervisor","financeiro","auditor"] },
  { to: "/app/equipes", label: "Equipes", icon: Users, roles: ["admin","gestor","supervisor"] },
  { to: "/app/profissionais", label: "Profissionais", icon: UserCircle, roles: ["admin","gestor"] },
  { to: "/app/usuarios/aprovacoes", label: "Aprovações de Usuários", icon: UserCheck, roles: ["admin"] },
  { to: "/app/atividades", label: "Atividades", icon: ListChecks, roles: ["admin","gestor"] },
  { to: "/app/estoque", label: "Estoque", icon: Package, roles: ["admin","gestor","supervisor","financeiro","auditor","campo"] },
  { to: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/app/aprovacoes", label: "Aprovações", icon: ShieldCheck, roles: ["admin","gestor","supervisor"] },
  { to: "/app/departamentos", label: "Departamentos", icon: Building2, roles: ["admin"] },
  { to: "/app/relatorios", label: "Relatórios", icon: FileBarChart2, roles: ["admin","gestor","financeiro","auditor"] },
   { to: "/app/medicao", label: "Medição", icon: Calculator, roles: ["admin","gestor","financeiro"] },
   { to: "/app/dev", label: "Painel Developer", icon: Terminal, roles: ["admin"] },
];

export default function AppShell() {
  const { profile, roles, hasRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from("notificacoes")
        .select("link")
        .eq("user_id", profile.id)
        .eq("lida", false);
      const c: Record<string, number> = {};
      (data ?? []).forEach((n: any) => {
        const link: string = n.link || "";
        const prefixes = ["/app/os", "/app/aprovacoes", "/app/estoque", "/app/mensagens", "/app/medicao"];
        const p = prefixes.find(pref => link.startsWith(pref));
        if (p) c[p] = (c[p] ?? 0) + 1;
      });
      setCounts(c);
    };
    load();
    const ch = supabase
      .channel("appshell-notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${profile.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  const items = NAV.filter((i) => !i.roles || hasRole(i.roles));

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/app" className="flex items-center gap-2.5">
            <img src="https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/ad8ea817-6d17-4c76-b864-22b9b9c2e855/1777828431331_eu29es_logo.png" alt="Logo" className="h-7 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none tracking-tight">Energia</span>
              <span className="text-[10px] font-medium leading-none text-muted-foreground uppercase tracking-widest">Operações</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <InstallAppButton variant="ghost" size="sm" label="Baixar app" className="hidden sm:inline-flex" />
          <NotificationBell />
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
                <span className="flex-1">{i.label}</span>
                {counts[i.to] ? (
                  <span className="ml-auto inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {counts[i.to]}
                  </span>
                ) : null}
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