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
  const { profile, roles, hasRole } = useAuth();
  const [stats, setStats] = useState({
    obras: 0, obrasExec: 0, osAbertas: 0, osAprov: 0, osPend: 0, umd: 0, profs: 0, equipes: 0,
  });
  const [byStatus, setByStatus] = useState<{ status: string; n: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [obras, obrasExec, osAbertas, osAprov, osPend, umd, profs, equipes, statusAgg] = await Promise.all([
        supabase.from("obras").select("id", { count: "exact", head: true }),
        supabase.from("obras").select("id", { count: "exact", head: true }).eq("status", "execucao"),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).in("status", ["iniciada","em_andamento"]),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("status", "aprovada"),
        supabase.from("ordens_servico").select("id", { count: "exact", head: true }).eq("status", "aguardando_revisao"),
        supabase.from("ordens_servico").select("total_umd_aprovada"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("equipes").select("id", { count: "exact", head: true }).eq("ativo", true),
        supabase.from("ordens_servico").select("status"),
      ]);
      const totalUmd = (umd.data ?? []).reduce((a: number, r: any) => a + Number(r.total_umd_aprovada || 0), 0);
      const counts: Record<string, number> = {};
      (statusAgg.data ?? []).forEach((r: any) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
      setByStatus(Object.entries(counts).map(([status, n]) => ({ status: status.replace(/_/g," "), n })));
      setStats({
        obras: obras.count ?? 0,
        obrasExec: obrasExec.count ?? 0,
        osAbertas: osAbertas.count ?? 0,
        osAprov: osAprov.count ?? 0,
        osPend: osPend.count ?? 0,
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
        <Stat label="Obras" value={stats.obras} hint={`${stats.obrasExec} em execução`} />
        <Stat label="OS abertas" value={stats.osAbertas} hint={`${stats.osPend} aguardando revisão`} />
        <Stat label="OS aprovadas" value={stats.osAprov} />
        <Stat label="UMD aprovada" value={stats.umd} hint="Acumulado" />
        <Stat label="Profissionais" value={stats.profs} />
        <Stat label="Equipes" value={stats.equipes} />
      </div>

      {hasRole(["admin","gestor","supervisor","financeiro","auditor"]) && byStatus.length > 0 && (
        <Card className="mt-6 rounded-md border-border p-4 shadow-none">
          <div className="mb-3 text-sm font-medium">Ordens por status</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip cursor={{ fill: "hsl(var(--accent))" }} contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="n" fill="hsl(var(--primary))" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}