import { PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="rounded-md border-border p-4 shadow-none">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export default function Dashboard() {
   const { profile, roles, hasRole, user } = useAuth();
  const [stats, setStats] = useState({
    obras: 0, obrasExec: 0, osAbertas: 0, osAprov: 0, osPend: 0, umd: 0, profs: 0, equipes: 0, osRejeitadas: 0,
  });
  const [byStatus, setByStatus] = useState<{ status: string; n: number }[]>([]);
  const [umdHistory, setUmdHistory] = useState<{ date: string; umd: number }[]>([]);

  useEffect(() => {
     if (!user) return;
     const isCampo = hasRole(["campo"]) && !hasRole(["admin", "gestor", "supervisor"]);
 
     (async () => {
       const baseQuery = supabase.from("ordens_servico").select("id", { count: "exact", head: true });
       const umdQuery = supabase.from("ordens_servico").select("total_umd_aprovada, total_umd");
       const statusQuery = supabase.from("ordens_servico").select("status");
 
       if (isCampo) {
         baseQuery.eq("profissional_id", user.id);
         umdQuery.eq("profissional_id", user.id);
         statusQuery.eq("profissional_id", user.id);
       }
 
      const [obras, obrasExec, osAbertas, osAprov, osPend, osRejeitadas, umdRes, profs, equipes, statusAgg, historyRes] = await Promise.all([
        (isCampo ? supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("profissional_id", user.id) : supabase.from("ordens_servico").select("id", { count: "exact", head: true })).eq("status", "reprovada"),
        supabase.from("ordens_servico").select("fim_em, total_umd_aprovada").eq("status", "aprovada").order("fim_em"),
         supabase.from("obras").select("id", { count: "exact", head: true }),
         supabase.from("obras").select("id", { count: "exact", head: true }).eq("status", "execucao"),
         (isCampo ? supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("profissional_id", user.id) : supabase.from("ordens_servico").select("id", { count: "exact", head: true })).in("status", ["iniciada","em_andamento"]),
         (isCampo ? supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("profissional_id", user.id) : supabase.from("ordens_servico").select("id", { count: "exact", head: true })).eq("status", "aprovada"),
         (isCampo ? supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("profissional_id", user.id) : supabase.from("ordens_servico").select("id", { count: "exact", head: true })).eq("status", "aguardando_revisao"),
         umdQuery,
         supabase.from("profiles").select("id", { count: "exact", head: true }).eq("ativo", true),
         supabase.from("equipes").select("id", { count: "exact", head: true }).eq("ativo", true),
         statusQuery,
       ]);
 
       const totalUmd = (umdRes.data ?? []).reduce((a: number, r: any) => a + Number(r.total_umd_aprovada || 0), 0);
      const counts: Record<string, number> = {};
      (statusAgg.data ?? []).forEach((r: any) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
      setByStatus(Object.entries(counts).map(([status, n]) => ({ status: status.replace(/_/g," "), n })));
      const history: Record<string, number> = {};
      (historyRes.data ?? []).forEach((r: any) => {
        if (!r.fim_em) return;
        const d = new Date(r.fim_em).toLocaleDateString("pt-BR", { month: "short" });
        history[d] = (history[d] ?? 0) + Number(r.total_umd_aprovada || 0);
      });

      setUmdHistory(Object.entries(history).map(([date, umd]) => ({ date, umd })));
      setStats({
        obras: obras.count ?? 0,
        obrasExec: obrasExec.count ?? 0,
        osAbertas: osAbertas.count ?? 0,
        osAprov: osAprov.count ?? 0,
        osPend: osPend.count ?? 0,
        osRejeitadas: osRejeitadas.count ?? 0,
        umd: Math.round(totalUmd * 100) / 100,
        profs: profs.count ?? 0,
        equipes: equipes.count ?? 0,
      });
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile?.nome?.split(" ")[0] ?? ""}`}
        description="Visão consolidada da operação."
      />
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
         {!hasRole(["campo"]) || hasRole(["admin", "gestor", "supervisor"]) ? (
           <>
             <Stat label="Obras" value={stats.obras} hint={`${stats.obrasExec} em execução`} />
             <Stat label="Profissionais" value={stats.profs} />
             <Stat label="Equipes" value={stats.equipes} />
           </>
         ) : null}
         <Stat label="Minhas OS" value={stats.osAbertas + stats.osAprov + stats.osPend} hint={`${stats.osAbertas} em andamento`} />
         <Stat label="OS aprovadas" value={stats.osAprov} />
         <Stat label="UMD aprovada" value={stats.umd} hint="Acumulado" />
         {hasRole(["campo"]) && <Stat label="Aguardando Revisão" value={stats.osPend} />}
       </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        {hasRole(["admin", "gestor", "supervisor", "auditor"]) && byStatus.length > 0 && (
          <Card className="rounded-md border-border p-4 shadow-none">
            <div className="mb-4 text-sm font-medium">Status das Ordens</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus}>
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="status" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ fill: "hsl(var(--accent))" }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="n" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {hasRole(["admin", "gestor", "financeiro"]) && umdHistory.length > 0 && (
          <Card className="rounded-md border-border p-4 shadow-none">
            <div className="mb-4 text-sm font-medium">Evolução de Faturamento (UMD)</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={umdHistory}>
                  <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{ fill: "hsl(var(--accent))" }} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="umd" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {hasRole(["auditor"]) && (
          <Card className="rounded-md border-border p-4 shadow-none">
            <div className="mb-4 text-sm font-medium">Indicadores de Qualidade</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{stats.osRejeitadas}</div>
                <div className="text-[10px] uppercase text-muted-foreground">OS Rejeitadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{stats.osPend}</div>
                <div className="text-[10px] uppercase text-muted-foreground">Em Revisão</div>
              </div>
            </div>
            <div className="mt-6 text-[11px] text-muted-foreground">
              A taxa de aprovação atual é de {Math.round((stats.osAprov / (stats.osAprov + stats.osRejeitadas || 1)) * 100)}%.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}