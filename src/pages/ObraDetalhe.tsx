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

  const totalAtividades = atividades.length;
  const atividadesConcluidas = atividades.filter(a => a.status === 'aprovado' || a.status === 'concluido').length;
  const progresso = totalAtividades > 0 ? (atividadesConcluidas / totalAtividades) * 100 : 0;

  return (
    <div className="space-y-6">
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
            {hasRole(["admin", "gestor", "supervisor", "campo"]) && (
              <Button size="sm" onClick={() => setOsDialogOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Nova OS
              </Button>
            )}
          </div>
        } 
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-xs text-muted-foreground">Local</div>
          <div className="mt-1 text-sm truncate font-medium">
            {[obra.endereco, obra.numero_endereco, obra.bairro, obra.cidade].filter(Boolean).join(", ") || "—"}
          </div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-xs text-muted-foreground">Progresso Geral</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="text-2xl font-bold">{progresso.toFixed(0)}%</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-xs text-muted-foreground">OS Vinculadas</div>
          <div className="mt-1 text-2xl font-bold">{oss.length}</div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-xs text-muted-foreground">UMD Aprovada</div>
          <div className="mt-1 text-2xl font-bold">{totalUmd.toFixed(2)}</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6 gap-6">
          <TabsTrigger value="oss" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-2 px-0 text-sm font-semibold gap-2">
            <ClipboardList className="h-4 w-4" /> Ordens de Serviço
          </TabsTrigger>
          <TabsTrigger value="atividades" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-2 px-0 text-sm font-semibold gap-2">
            <ListTodo className="h-4 w-4" /> Acompanhamento de Atividades
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-2 px-0 text-sm font-semibold gap-2">
            <History className="h-4 w-4" /> Histórico de Execução
          </TabsTrigger>
        </TabsList>

        <TabsContent value="oss" className="mt-0">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Responsável Atual (Está com)</th>
                  <th className="px-4 py-3">Equipe / Supervisor</th>
                  <th className="px-4 py-3 text-center">UMD</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {oss.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">Nenhuma OS vinculada a esta obra.</td></tr>
                ) : (
                  oss.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold">
                        <Link to={`/app/os/${r.id}`} className="text-primary hover:underline flex items-center gap-2">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {r.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs">Está com:</span>
                            <span className="text-sm font-medium">{r.profissional?.nome || "Não atribuído"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit text-[10px] py-0">{r.equipe?.nome || "Sem equipe"}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Sup: {r.supervisor?.nome || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{Number(r.total_umd ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.operational_status || r.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="atividades" className="mt-0">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Atividade</th>
                  <th className="px-4 py-3">OS Origem</th>
                  <th className="px-4 py-3">Responsável (Está com)</th>
                  <th className="px-4 py-3 text-center">Quant.</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {atividades.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">Nenhuma atividade lançada para esta obra.</td></tr>
                ) : (
                  atividades.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-primary font-bold">{a.atividade?.codigo_item}</span>
                          <span className="font-medium">{a.atividade?.descricao || "Atividade sem descrição"}</span>
                          <span className="text-[10px] text-muted-foreground">{a.categoria?.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link to={`/app/os/${a.os_id}`} className="hover:underline text-muted-foreground">
                          #{a.os?.numero}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 gap-1.5 py-1">
                            <User className="h-3 w-3" />
                            {a.os?.profissional?.nome || "N/A"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{a.quantidade} {a.unidade}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status || a.os?.operational_status || a.os?.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <div className="space-y-4">
            {historico.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic border rounded-md bg-card">Nenhum histórico registrado para esta obra.</div>
            ) : (
              historico.map((log) => (
                <Card key={log.id} className="shadow-none border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-4">
                      <div className={cn(
                        "mt-1 p-2 rounded-full",
                        log.action === "atribuicao_alterada" ? "bg-blue-100 text-blue-600" : 
                        log.action === "status_change" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {log.action === "atribuicao_alterada" ? <User className="h-4 w-4" /> : <History className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold">
                            OS #{log.os?.numero} - {log.details?.message || log.action}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{log.profile?.nome}</span>
                          <span>•</span>
                          {log.old_value && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] py-0 h-4">{log.old_value}</Badge>
                              <span>→</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary text-primary">{log.new_value}</Badge>
                            </div>
                          )}
                        </div>
                        {log.details?.comment && (
                          <p className="text-xs bg-muted/50 p-2 rounded mt-2 border-l-2 border-primary/30 italic">
                            "{log.details.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <NewServiceOrderDialog 
        open={osDialogOpen} 
        onOpenChange={setOsDialogOpen} 
        initialObraId={id}
        onSuccess={(osId) => nav(`/app/os/${osId}`)}
      />
    </div>
  );
}