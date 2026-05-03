 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/lib/auth";
 import PageHeader from "@/components/PageHeader";
 import AdminDashboard from "@/components/dashboards/AdminDashboard";
 import CampoDashboard from "@/components/dashboards/CampoDashboard";
 import GestorDashboard from "@/components/dashboards/GestorDashboard";
 import FinanceiroDashboard from "@/components/dashboards/FinanceiroDashboard";
 import AuditorDashboard from "@/components/dashboards/AuditorDashboard";
 import { Skeleton } from "@/components/ui/skeleton";
 
 export default function Dashboard() {
   const { profile, roles, hasRole, user } = useAuth();
    const [stats, setStats] = useState({
      obras: 0, obrasExec: 0, osAbertas: 0, osAprov: 0, osPend: 0, umd: 0, profs: 0, equipes: 0, osRejeitadas: 0,
      osRecentes: [] as any[], alertas: [] as any[], divergencias: 0, valorUmd: 0, auditCriticos: 0,
      umdAtual: 0, umdAnterior: 0, osAtiva: null as any
    });
   const [byStatus, setByStatus] = useState<{ status: string; n: number }[]>([]);
    const [umdHistory, setUmdHistory] = useState<{ date: string; umd: number }[]>([]);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user) return;
     const isCampo = hasRole(["campo"]) && !hasRole(["admin", "gestor", "supervisor"]);
 
     (async () => {
       setLoading(true);
        const umdQuery = supabase.from("ordens_servico").select("total_umd_aprovada, total_umd, status");
        const statusQuery = supabase.from("ordens_servico").select("status");
 
       if (isCampo) {
         umdQuery.eq("profissional_id", user.id);
         statusQuery.eq("profissional_id", user.id);
       }
        
        if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) {
          umdQuery.eq("assigned_supervisor_id", user.id);
          statusQuery.eq("assigned_supervisor_id", user.id);
        }
 
         const [obrasRes, obrasExecRes, osRejeitadasRes, osAprovRes, osPendRes, umdRes, profsRes, equipesRes, statusAggRes, historyRes, auditRes, osRecentesRes] = await Promise.all([
         supabase.from("obras").select("id"),
         supabase.from("obras").select("id").eq("status", "execucao"),
          (() => {
            let q = supabase.from("ordens_servico").select("id").eq("status", "reprovada");
            if (isCampo) q = q.eq("profissional_id", user.id);
            if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) q = q.eq("assigned_supervisor_id", user.id);
            return q;
          })(),
          (() => {
            let q = supabase.from("ordens_servico").select("id").eq("status", "aprovada");
            if (isCampo) q = q.eq("profissional_id", user.id);
            if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) q = q.eq("assigned_supervisor_id", user.id);
            return q;
          })(),
          (() => {
            let q = supabase.from("ordens_servico").select("id").in("status", ["aguardando_revisao", "em_revisao", "corrigida"]);
            if (isCampo) q = q.eq("profissional_id", user.id);
            if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) q = q.eq("assigned_supervisor_id", user.id);
            return q;
          })(),
         umdQuery,
         supabase.from("profiles").select("id").eq("ativo", true),
         supabase.from("equipes").select("id").eq("ativo", true),
         statusQuery,
           (() => {
             let q = supabase.from("ordens_servico").select("fim_em, total_umd_aprovada").eq("status", "aprovada");
             if (isCampo) q = q.eq("profissional_id", user.id);
             if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) q = q.eq("assigned_supervisor_id", user.id);
             return q.order("fim_em");
           })(),
           supabase.from("os_audit_logs").select("*, profile:profiles(nome), ordens_servico(numero)").order("created_at", { ascending: false }).limit(5),
           (() => {
             let q = supabase.from("ordens_servico").select("id, numero, status, total_umd, obra:obras(nome)").order("created_at", { ascending: false }).limit(5);
             if (isCampo) q = q.eq("profissional_id", user.id);
             if (hasRole("supervisor") && !hasRole(["admin", "gestor"])) q = q.eq("assigned_supervisor_id", user.id);
             return q;
           })(),
        ]);
       // Dados auxiliares: alertas, regras financeiras, casos críticos, OS ativa do técnico, UMD em andamento
       const [alertasRes, ruleRes, divRes, criticosRes, osAtivaRes, umdMesRes] = await Promise.all([
         supabase.from("operational_alerts").select("id, title, description, severity, created_at").eq("status", "open").order("created_at", { ascending: false }).limit(5),
         supabase.from("financial_rules").select("rule_config").eq("rule_key", "umd_unit_value").eq("active", true).maybeSingle(),
         supabase.from("financial_order_records").select("id", { count: "exact", head: true }).eq("financial_status", "divergente"),
         supabase.from("audit_findings").select("id", { count: "exact", head: true }).eq("severity", "alta").eq("status", "aberto"),
         isCampo
           ? supabase.from("ordens_servico").select("id, numero, obra:obras(nome)").eq("profissional_id", user.id).in("status", ["iniciada","em_andamento","corrigida"]).order("updated_at", { ascending: false }).limit(1).maybeSingle()
           : Promise.resolve({ data: null }),
         (() => {
           const start = new Date(); start.setDate(start.getDate() - 30);
           const prev = new Date(); prev.setDate(prev.getDate() - 60);
           return supabase.from("ordens_servico").select("total_umd_aprovada, fim_em").eq("status","aprovada").gte("fim_em", prev.toISOString());
         })(),
       ]);
       const valorUmd = Number((ruleRes as any)?.data?.rule_config?.value ?? 0);
       const now = Date.now();
       const d30 = now - 30*24*60*60*1000;
       let umdAtual = 0, umdAnterior = 0;
       (umdMesRes.data ?? []).forEach((r: any) => {
         const t = r.fim_em ? new Date(r.fim_em).getTime() : 0;
         if (t >= d30) umdAtual += Number(r.total_umd_aprovada || 0);
         else umdAnterior += Number(r.total_umd_aprovada || 0);
       });
       const osAbertasReal = (statusAggRes.data ?? []).filter((r:any) => ["iniciada","em_andamento","corrigida"].includes(r.status)).length;
        setAuditHistory(auditRes.data ?? []);
 
       const totalUmd = (umdRes.data ?? []).reduce((a: number, r: any) => a + Number(r.total_umd_aprovada || 0), 0);
       const counts: Record<string, number> = {};
       (statusAggRes.data ?? []).forEach((r: any) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
       setByStatus(Object.entries(counts).map(([status, n]) => ({ status: status.replace(/_/g, " "), n })));
       
       const history: Record<string, number> = {};
       (historyRes.data ?? []).forEach((r: any) => {
         if (!r.fim_em) return;
         const d = new Date(r.fim_em).toLocaleDateString("pt-BR", { month: "short" });
         history[d] = (history[d] ?? 0) + Number(r.total_umd_aprovada || 0);
       });
 
       setUmdHistory(Object.entries(history).map(([date, umd]) => ({ date, umd })));
       setStats({
         obras: (obrasRes.data ?? []).length,
         obrasExec: (obrasExecRes.data ?? []).length,
         osAbertas: osAbertasReal,
         osAprov: (osAprovRes.data ?? []).length,
         osPend: (osPendRes.data ?? []).length,
         osRejeitadas: (osRejeitadasRes.data ?? []).length,
         umd: Math.round(totalUmd * 100) / 100,
          profs: (profsRes.data ?? []).length,
          equipes: (equipesRes.data ?? []).length,
          osRecentes: osRecentesRes.data ?? [],
          alertas: alertasRes.data ?? [],
          divergencias: (divRes as any).count ?? 0,
          valorUmd,
          auditCriticos: (criticosRes as any).count ?? 0,
          umdAtual, umdAnterior,
          osAtiva: (osAtivaRes as any).data ?? null,
        });
       setLoading(false);
     })();
   }, [user, roles]);
 
   const renderDashboard = () => {
     if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
     
     if (hasRole("admin")) return <AdminDashboard stats={stats} byStatus={byStatus} umdHistory={umdHistory} />;
     if (hasRole("gestor") || hasRole("supervisor")) return <GestorDashboard stats={stats} byStatus={byStatus} />;
     if (hasRole("financeiro")) return <FinanceiroDashboard stats={stats} umdHistory={umdHistory} />;
      if (hasRole("auditor")) return <AuditorDashboard stats={stats} auditHistory={auditHistory} />;
     if (hasRole("campo")) return <CampoDashboard stats={stats} profile={profile} />;
     
     return <AdminDashboard stats={stats} byStatus={byStatus} umdHistory={umdHistory} />;
   };
 
   return (
     <div className="pb-8">
       <PageHeader
         title={`Olá, ${profile?.nome?.split(" ")[0] ?? ""}`}
         description={`Bem-vindo ao painel do ${roles[0] ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) : "colaborador"}.`}
       />
       {renderDashboard()}
     </div>
   );
 }