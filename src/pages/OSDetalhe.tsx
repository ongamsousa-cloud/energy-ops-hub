import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Camera, Video, History, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OSDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const [os, setOS] = useState<any>(null);
   const [items, setItems] = useState<any[]>([]);
   const [evid, setEvid] = useState<any[]>([]);
   const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [atvs, setAtvs] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
   const [codes, setCodes] = useState<any[]>([]);
   const [form, setForm] = useState<any>({ 
     categoria_id: "", 
     atividade_id: "", 
     execution_code_id: "",
     quantidade: "", 
     observacao: "" 
   });
   const [checklist, setChecklist] = useState<Record<string, any>>({});

  const isOwner = os && user && os.profissional_id === user.id;
  const canApprove = hasRole(["admin","gestor","supervisor"]);
  const canEdit = isOwner && ["iniciada","em_andamento","correcao_solicitada","corrigida","rascunho"].includes(os?.status);

   const load = useCallback(async () => {
      const { data: o, error: osError } = await supabase.from("ordens_servico")
        .select(`
          *, 
          obra:obras(numero, nome, endereco, cidade, estado, bairro, cep), 
          profissional:profiles!ordens_servico_profissional_id_fkey(nome)
        `)
        .eq("id", id).maybeSingle();

      if (!o && !osError) {
        toast.error("Você não possui permissão para acessar esta ordem de serviço.");
        nav("/app/os");
        return;
      }
     setOS(o);
     const { data: it } = await supabase.from("os_atividades").select("*, atividade:atividades(codigo_item,descricao), categoria:categorias(nome)").eq("os_id", id).order("created_at");
     setItems(it ?? []);
     const { data: ev } = await supabase.from("os_evidences").select("*, profile:profiles(nome)").eq("os_id", id).order("created_at");
     setEvid(ev ?? []);
     const { data: logs } = await supabase.from("os_audit_logs").select("*, profile:profiles(nome)").eq("os_id", id).order("created_at", { ascending: false });
     setAuditLogs(logs ?? []);
   }, [id]);

  useEffect(() => {
    load();
    supabase.from("categorias").select("*").eq("ativo", true).order("ordem").then(({ data }) => setCats(data ?? []));
     supabase.from("execution_codes").select("*").eq("active", true).order("code").then(({ data }) => setCodes(data ?? []));
  }, [load]);

  useEffect(() => {
    if (!form.categoria_id) { setAtvs([]); return; }
    supabase.from("atividades").select("*").eq("categoria_id", form.categoria_id).eq("ativo", true).order("codigo_item").then(({ data }) => setAtvs(data ?? []));
  }, [form.categoria_id]);

   useEffect(() => {
     const code = codes.find(c => c.id === form.execution_code_id);
     if (code?.checklist_template) {
       setChecklist({}); // Reset checklist on code change
     }
   }, [form.execution_code_id, codes]);

  const ativSel = atvs.find((a) => a.id === form.atividade_id);
  const umdTotal = ativSel && form.quantidade ? Number(form.quantidade) * Number(ativSel.umd_unitaria) : 0;

  function getGeo(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((res) => {
      if (!navigator.geolocation) return res({});
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res({}), { timeout: 5000 }
      );
    });
  }

  async function addItem() {
    if (!form.categoria_id || !form.atividade_id || !form.quantidade) return toast.error("Preencha todos os campos");
    const q = Number(form.quantidade);
    if (!(q > 0)) return toast.error("Quantidade inválida");
    const geo = ativSel?.exige_localizacao ? await getGeo() : {};
    const { error } = await supabase.from("os_atividades").insert({
      os_id: id,
      atividade_id: form.atividade_id,
      categoria_id: form.categoria_id,
      quantidade: q,
      umd_unitaria: ativSel.umd_unitaria,
      umd_total: q * Number(ativSel.umd_unitaria),
      unidade: ativSel.unidade,
      observacao: form.observacao || null,
      latitude: geo.lat, longitude: geo.lng,
      created_by: user!.id,
    });
    if (error) return toast.error(error.message);
    if (os.status === "iniciada") await supabase.from("ordens_servico").update({ status: "em_andamento" }).eq("id", id);
    setAdd(false);
    setForm({ categoria_id: "", atividade_id: "", quantidade: "", observacao: "" });
    toast.success("Atividade lançada");
    load();
  }

  async function removeItem(itemId: string) {
    if (!confirm("Remover este lançamento?")) return;
    await supabase.from("os_atividades").delete().eq("id", itemId);
    load();
  }

   async function uploadEvidencia(e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean = false) {
     const f = e.target.files?.[0]; if (!f) return;
     toast.info("Processando arquivo...");
     const isVideo = f.type.startsWith("video/");
     const path = `${id}/${crypto.randomUUID()}-${f.name}`;
     const { error } = await supabase.storage.from("os-evidences").upload(path, f, { contentType: f.type });
     if (error) return toast.error(error.message);
     const geo = await getGeo();
     await supabase.from("os_evidences").insert({ 
       os_id: id, 
       url: path, 
       user_id: user!.id, 
       tipo: isVideo ? "video" : "foto",
       localizacao: geo,
       metadata: { size: f.size, name: f.name, type: f.type }
     });
     e.target.value = "";
     toast.success("Evidência enviada");
     load();
   }

  async function finalizar() {
    if (!items.length) return toast.error("OS sem atividades");
    const geo = await getGeo();
    await supabase.from("ordens_servico").update({
      status: "aguardando_revisao", fim_em: new Date().toISOString(),
      fim_lat: geo.lat, fim_lng: geo.lng,
    }).eq("id", id);
    toast.success("OS enviada para revisão");
    load();
  }

   async function registrarAuditoria(statusNovo: string, comentario: string = "") {
     await supabase.from("os_audit_logs").insert({
       os_id: id,
       user_id: user!.id,
       status_anterior: os.status,
       status_novo: statusNovo,
       comentario
     });
   }

   async function aprovar() {
     const obs = prompt("Comentário de aprovação (opcional):") || "";
     await supabase.from("os_atividades").update({ status: "aprovado" }).eq("os_id", id);
     await supabase.from("ordens_servico").update({ status: "aprovada", aprovado_por: user!.id, aprovado_em: new Date().toISOString() }).eq("id", id);
     await registrarAuditoria("aprovada", obs);
     toast.success("OS aprovada"); load();
   }
   async function reprovar() {
     const motivo = prompt("Motivo da reprovação:"); if (!motivo) return;
     await supabase.from("ordens_servico").update({ status: "reprovada", motivo_reprovacao: motivo, aprovado_por: user!.id, aprovado_em: new Date().toISOString() }).eq("id", id);
     await registrarAuditoria("reprovada", motivo);
     toast.success("OS reprovada"); load();
   }
   async function correcao() {
     const obs = prompt("Observação para correção:"); if (!obs) return;
     await supabase.from("ordens_servico").update({ status: "correcao_solicitada", observacao_supervisor: obs }).eq("id", id);
     await registrarAuditoria("correcao_solicitada", obs);
     toast.success("Correção solicitada"); load();
   }

  if (!os) return <div className="text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div>
      <PageHeader
        title={`OS ${os.numero}`}
        description={`${os.obra?.numero} · ${os.obra?.nome} · ${os.profissional?.nome}`}
        actions={<StatusBadge status={os.status} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Atividades</div>
          <div className="mt-1 text-2xl font-semibold">{items.length}</div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">UMD total</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{Number(os.total_umd ?? 0).toFixed(2)}</div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Localização</div>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5}/>
            {os.inicio_lat ? (
              <a className="hover:underline" target="_blank" href={`https://maps.google.com/?q=${os.inicio_lat},${os.inicio_lng}`}>
                {Number(os.inicio_lat).toFixed(4)}, {Number(os.inicio_lng).toFixed(4)}
              </a>
            ) : "—"}
          </div>
        </Card>
      </div>

      {/* Itens */}
      <div className="mt-8 mb-3 flex items-end justify-between">
        <h2 className="text-sm font-medium">Lançamentos</h2>
        {canEdit && (
          <Dialog open={add} onOpenChange={setAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Adicionar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Lançar atividade</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria_id} onValueChange={(v)=>setForm({...form, categoria_id: v, atividade_id: ""})}>
                    <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                    <SelectContent>{cats.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                   <div>
                     <Label>Atividade</Label>
                     <Select value={form.atividade_id} onValueChange={(v)=>setForm({...form, atividade_id: v})} disabled={!form.categoria_id}>
                       <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                       <SelectContent>{atvs.map((a)=>(<SelectItem key={a.id} value={a.id}>{a.codigo_item} · {a.descricao}</SelectItem>))}</SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label>Código Técnico (Base Técnica)</Label>
                     <Select value={form.execution_code_id} onValueChange={(v)=>setForm({...form, execution_code_id: v})}>
                       <SelectTrigger><SelectValue placeholder="Opcional"/></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="none">Nenhum</SelectItem>
                         {codes.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.code} · {c.title}</SelectItem>))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantidade ({ativSel?.unidade || "—"})</Label>
                    <Input type="number" step="0.01" value={form.quantidade} onChange={(e)=>setForm({...form, quantidade: e.target.value})}/>
                  </div>
                  <div>
                    <Label>UMD calculada</Label>
                    <Input value={umdTotal.toFixed(4)} disabled className="bg-muted/30 tabular-nums"/>
                  </div>
                </div>
                <div><Label>Observação</Label><Textarea value={form.observacao} onChange={(e)=>setForm({...form, observacao: e.target.value})}/></div>
                <Button onClick={addItem}>Salvar lançamento</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2">Un</th><th className="px-3 py-2 text-right">UMD</th><th className="px-3 py-2"/></tr>
            </thead>
            <tbody>
              {items.map((i)=>(
                <tr key={i.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{i.atividade?.codigo_item}</td>
                  <td className="px-3 py-2">{i.atividade?.descricao}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(i.quantidade).toFixed(2)}</td>
                  <td className="px-3 py-2">{i.unidade}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(i.umd_total).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    {canEdit && <Button variant="ghost" size="icon" onClick={()=>removeItem(i.id)}><Trash2 className="h-3.5 w-3.5"/></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Evidências */}
       <Tabs defaultValue="atividades" className="mt-8">
         <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
           <TabsTrigger value="atividades">Lançamentos</TabsTrigger>
           <TabsTrigger value="evidencias">Evidências</TabsTrigger>
           <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
         </TabsList>
         
         <TabsContent value="atividades" className="mt-4">
           {/* Conteúdo de Atividades moved from lines 169-232 */}
           <div className="flex items-end justify-between mb-3">
             <h2 className="text-sm font-medium">Lançamentos realizados</h2>
             {canEdit && (
               <Dialog open={add} onOpenChange={setAdd}>
                 <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Adicionar</Button></DialogTrigger>
                 <DialogContent>
                   <DialogHeader><DialogTitle>Lançar atividade</DialogTitle></DialogHeader>
                   <div className="grid gap-3">
                     <div>
                       <Label>Categoria</Label>
                       <Select value={form.categoria_id} onValueChange={(v)=>setForm({...form, categoria_id: v, atividade_id: ""})}>
                         <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                         <SelectContent>{cats.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}</SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label>Atividade</Label>
                       <Select value={form.atividade_id} onValueChange={(v)=>setForm({...form, atividade_id: v})} disabled={!form.categoria_id}>
                         <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                         <SelectContent>{atvs.map((a)=>(<SelectItem key={a.id} value={a.id}>{a.codigo_item} · {a.descricao}</SelectItem>))}</SelectContent>
                       </Select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Quantidade ({ativSel?.unidade || "—"})</Label>
                         <Input type="number" step="0.01" value={form.quantidade} onChange={(e)=>setForm({...form, quantidade: e.target.value})}/>
                       </div>
                       <div>
                         <Label>UMD calculada</Label>
                         <Input value={umdTotal.toFixed(4)} disabled className="bg-muted/30 tabular-nums"/>
                       </div>
                     </div>
                     <div><Label>Observação</Label><Textarea value={form.observacao} onChange={(e)=>setForm({...form, observacao: e.target.value})}/></div>
                     <Button onClick={addItem}>Salvar lançamento</Button>
                   </div>
                 </DialogContent>
               </Dialog>
             )}
           </div>
           {items.length === 0 ? (
             <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</div>
           ) : (
             <div className="overflow-hidden rounded-md border border-border bg-card">
               <table className="w-full text-sm">
                 <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                   <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2">Un</th><th className="px-3 py-2 text-right">UMD</th><th className="px-3 py-2"/></tr>
                 </thead>
                 <tbody>
                   {items.map((i)=>(
                     <tr key={i.id} className="border-b border-border last:border-0">
                       <td className="px-3 py-2 font-mono text-xs">{i.atividade?.codigo_item}</td>
                       <td className="px-3 py-2">{i.atividade?.descricao}</td>
                       <td className="px-3 py-2 text-right tabular-nums">{Number(i.quantidade).toFixed(2)}</td>
                       <td className="px-3 py-2">{i.unidade}</td>
                       <td className="px-3 py-2 text-right tabular-nums">{Number(i.umd_total).toFixed(2)}</td>
                       <td className="px-3 py-2 text-right">
                         {canEdit && <Button variant="ghost" size="icon" onClick={()=>removeItem(i.id)}><Trash2 className="h-3.5 w-3.5"/></Button>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </TabsContent>

          <TabsContent value="evidencias" className="mt-4">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Fotos e vídeos do campo</h2>
              </div>
              
              {canEdit && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm active:scale-95">
                    <Camera className="h-5 w-5" strokeWidth={2}/> Tirar Foto
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadEvidencia(e, true)} />
                  </label>
                  
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-sm active:scale-95">
                    <Video className="h-5 w-5" strokeWidth={2}/> Gravar Vídeo
                    <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => uploadEvidencia(e, true)} />
                  </label>

                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm active:scale-95 sm:flex-none">
                    <Plus className="h-5 w-5" strokeWidth={2}/> Arquivo
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => uploadEvidencia(e, false)} />
                  </label>
                </div>
              )}
            </div>
           {evid.length === 0 ? (
             <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem evidências registradas.</div>
           ) : (
             <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
               {evid.map((e)=>(<EvImg key={e.id} ev={e}/>))}
             </div>
           )}
         </TabsContent>

         <TabsContent value="auditoria" className="mt-4">
           <div className="space-y-4">
             {auditLogs.length === 0 ? (
               <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem histórico de auditoria.</div>
             ) : (
               <div className="relative pl-6 border-l border-border space-y-6">
                 {auditLogs.map((log) => (
                   <div key={log.id} className="relative">
                     <div className="absolute -left-[31px] bg-card border border-border rounded-full p-1">
                       {log.status_novo === 'aprovada' ? <CheckCircle className="h-4 w-4 text-success" /> : 
                        log.status_novo === 'reprovada' ? <XCircle className="h-4 w-4 text-destructive" /> : 
                        <History className="h-4 w-4 text-muted-foreground" />}
                     </div>
                     <div className="bg-muted/30 rounded-lg p-3">
                       <div className="flex justify-between items-start mb-1">
                         <div className="text-xs font-semibold">
                           {log.profile?.nome} alterou para <StatusBadge status={log.status_novo} />
                         </div>
                         <div className="text-[10px] text-muted-foreground">
                           {new Date(log.created_at).toLocaleString('pt-BR')}
                         </div>
                       </div>
                       {log.comentario && <p className="text-sm text-muted-foreground mt-2 italic">"{log.comentario}"</p>}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </TabsContent>
       </Tabs>

      {/* Ações de fluxo */}
      <div className="mt-8 flex flex-wrap gap-2">
        {canEdit && os.status !== "aguardando_revisao" && (
          <Button onClick={finalizar}>Finalizar e enviar para revisão</Button>
        )}
        {canApprove && ["aguardando_revisao","corrigida","em_revisao"].includes(os.status) && (
          <>
            <Button onClick={aprovar} className="bg-success text-success-foreground hover:bg-success/90">Aprovar</Button>
            <Button onClick={correcao} variant="outline">Solicitar correção</Button>
            <Button onClick={reprovar} variant="destructive">Reprovar</Button>
          </>
        )}
        <Button variant="ghost" onClick={()=>nav(-1)}>Voltar</Button>
      </div>

      {os.motivo_reprovacao && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <strong>Reprovada:</strong> {os.motivo_reprovacao}
        </div>
      )}
      {os.observacao_supervisor && os.status === "correcao_solicitada" && (
        <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
          <strong>Correção solicitada:</strong> {os.observacao_supervisor}
        </div>
      )}
    </div>
  );
}

   function EvImg({ ev }: { ev: any }) {
     const [url, setUrl] = useState<string>("");
     useEffect(() => {
       supabase.storage.from("os-evidences").createSignedUrl(ev.url, 3600).then(({ data }) => setUrl(data?.signedUrl ?? ""));
     }, [ev.url]);
     
     const isVideo = ev.tipo === "video";
     
     return (
       <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
         {url ? (
           isVideo ? (
             <video src={url} className="h-full w-full object-cover" />
           ) : (
             <img src={url} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
           )
         ) : null}
         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
           <a href={url} target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-full text-black hover:bg-white/90">
             <Download className="h-4 w-4" />
           </a>
           {ev.localizacao?.lat && (
             <a href={`https://maps.google.com/?q=${ev.localizacao.lat},${ev.localizacao.lng}`} target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-full text-black hover:bg-white/90">
               <MapPin className="h-4 w-4" />
             </a>
           )}
         </div>
         <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
           <div className="text-[9px] text-white truncate">{ev.profile?.nome}</div>
           <div className="text-[8px] text-white/70">{new Date(ev.created_at).toLocaleDateString()}</div>
         </div>
       </div>
     );
   }