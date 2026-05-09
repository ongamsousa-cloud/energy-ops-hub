import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, History, ListTodo, ClipboardList, CheckCircle2 } from "lucide-react";
import NewServiceOrderDialog from "@/components/os/NewServiceOrderDialog";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ObraDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hasRole } = useAuth();
  const [obra, setObra] = useState<any>(null);
  const [oss, setOss] = useState<any[]>([]);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [osDialogOpen, setOsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("oss");

  const loadData = useCallback(async () => {
    if (!id) return;
    
    // 1. Carregar dados da Obra
    const { data: obraData } = await supabase.from("obras").select("*").eq("id", id).maybeSingle();
    if (obraData) setObra(obraData);

    // 2. Carregar OSs com seus profissionais e supervisores
    const { data: ossData } = await supabase.from("ordens_servico")
      .select(`
        *, 
        profissional:profiles!ordens_servico_profissional_id_fkey(nome),
        supervisor:profiles!ordens_servico_supervisor_id_fkey(nome),
        gestor:profiles!ordens_servico_gestor_responsavel_id_fkey(nome)
      `)
      .eq("obra_id", id)
      .order("created_at", { ascending: false });
    
    if (ossData) setOss(ossData);

    if (ossData && ossData.length > 0) {
      const osIds = ossData.map(os => os.id);
      
      // 3. Carregar todas as atividades vinculadas a essas OSs
      const { data: atvsData } = await supabase.from("os_atividades")
        .select(`
          *,
          atividade:atividades(descricao, codigo_item),
          categoria:categorias(nome),
          os:ordens_servico(numero, status, operational_status, profissional:profiles!ordens_servico_profissional_id_fkey(nome))
        `)
        .in("os_id", osIds)
        .order("created_at", { ascending: false });
      
      if (atvsData) setAtividades(atvsData);

      // 4. Carregar histórico de auditoria consolidado da obra
      const { data: logsData } = await supabase.from("os_audit_logs")
        .select(`
          *,
          profile:profiles(nome),
          os:ordens_servico(numero)
        `)
        .in("os_id", osIds)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (logsData) setHistorico(logsData);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    if (!id) return;
    const ch = supabase
      .channel(`obra-os-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico", filter: `obra_id=eq.${id}` }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData, id]);

  if (!obra) return <div className="text-sm text-muted-foreground">Carregando…</div>;
  const totalUmd = oss.reduce((a, r) => a + Number(r.total_umd_aprovada || 0), 0);

  return (
    <div>
      <PageHeader 
        title={
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono font-black">{obra.numero}</span>
              <StatusBadge status={obra.status} />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-normal">
              <span className="font-bold text-foreground">{obra.nome}</span>
              {obra.cliente && (
                <>
                  <span className="opacity-50">|</span>
                  <span className="italic">Cliente: {obra.cliente}</span>
                </>
              )}
            </div>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={obra.status} />
            {hasRole(["admin", "gestor", "supervisor", "campo"]) && (
              <Button size="sm" onClick={() => setOsDialogOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Nova OS
              </Button>
            )}
          </div>
        } 
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">Local</div><div className="mt-1 text-sm">{[obra.endereco, obra.numero_endereco, obra.bairro, obra.cidade, obra.estado].filter(Boolean).join(", ") || "—"}</div></Card>
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">OS vinculadas</div><div className="mt-1 text-2xl font-semibold">{oss.length}</div></Card>
        <Card className="rounded-md border-border p-4 shadow-none"><div className="text-xs text-muted-foreground">UMD aprovada</div><div className="mt-1 text-2xl font-semibold">{totalUmd.toFixed(2)}</div></Card>
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Ordens de Serviço</h2>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Número</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">UMD</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody>{oss.map((r) => (<tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50"><td className="px-3 py-2 font-mono text-xs"><Link to={`/app/os/${r.id}`} className="hover:underline">{r.numero}</Link></td><td className="px-3 py-2">{r.profissional?.nome ?? "—"}</td><td className="px-3 py-2">{Number(r.total_umd ?? 0).toFixed(2)}</td><td className="px-3 py-2"><StatusBadge status={r.status} /></td></tr>))}</tbody>
        </table>
      </div>

      <NewServiceOrderDialog 
        open={osDialogOpen} 
        onOpenChange={setOsDialogOpen} 
        initialObraId={id}
        onSuccess={(osId) => nav(`/app/os/${osId}`)}
      />
    </div>
  );
}