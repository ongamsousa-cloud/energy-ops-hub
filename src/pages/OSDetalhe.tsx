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
import { Plus, Trash2, MapPin, Camera } from "lucide-react";

export default function OSDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, hasRole } = useAuth();
  const [os, setOS] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [evid, setEvid] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [atvs, setAtvs] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
  const [form, setForm] = useState<any>({ categoria_id: "", atividade_id: "", quantidade: "", observacao: "" });

  const isOwner = os && user && os.profissional_id === user.id;
  const canApprove = hasRole(["admin","gestor","supervisor"]);
  const canEdit = isOwner && ["iniciada","em_andamento","correcao_solicitada","corrigida","rascunho"].includes(os?.status);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from("ordens_servico")
      .select("*, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome)")
      .eq("id", id).maybeSingle();
    setOS(o);
    const { data: it } = await supabase.from("os_atividades").select("*, atividade:atividades(codigo_item,descricao), categoria:categorias(nome)").eq("os_id", id).order("created_at");
    setItems(it ?? []);
    const { data: ev } = await supabase.from("evidencias").select("*").eq("os_id", id).order("created_at");
    setEvid(ev ?? []);
  }, [id]);

  useEffect(() => {
    load();
    supabase.from("categorias").select("*").eq("ativo", true).order("ordem").then(({ data }) => setCats(data ?? []));
  }, [load]);

  useEffect(() => {
    if (!form.categoria_id) { setAtvs([]); return; }
    supabase.from("atividades").select("*").eq("categoria_id", form.categoria_id).eq("ativo", true).order("codigo_item").then(({ data }) => setAtvs(data ?? []));
  }, [form.categoria_id]);

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

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const path = `${id}/${crypto.randomUUID()}-${f.name}`;
    const { error } = await supabase.storage.from("evidencias").upload(path, f, { contentType: f.type });
    if (error) return toast.error(error.message);
    await supabase.from("evidencias").insert({ os_id: id, storage_path: path, created_by: user!.id, tipo: "depois" });
    e.target.value = "";
    toast.success("Foto anexada");
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

  async function aprovar() {
    await supabase.from("os_atividades").update({ status: "aprovado" }).eq("os_id", id);
    await supabase.from("ordens_servico").update({ status: "aprovada", aprovado_por: user!.id, aprovado_em: new Date().toISOString() }).eq("id", id);
    toast.success("OS aprovada"); load();
  }
  async function reprovar() {
    const motivo = prompt("Motivo da reprovação:"); if (!motivo) return;
    await supabase.from("ordens_servico").update({ status: "reprovada", motivo_reprovacao: motivo, aprovado_por: user!.id, aprovado_em: new Date().toISOString() }).eq("id", id);
    toast.success("OS reprovada"); load();
  }
  async function correcao() {
    const obs = prompt("Observação para correção:"); if (!obs) return;
    await supabase.from("ordens_servico").update({ status: "correcao_solicitada", observacao_supervisor: obs }).eq("id", id);
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

      {/* Evidências */}
      <div className="mt-8 mb-3 flex items-end justify-between">
        <h2 className="text-sm font-medium">Evidências fotográficas</h2>
        {canEdit && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
            <Camera className="h-3.5 w-3.5" strokeWidth={1.5}/> Adicionar foto
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadFoto} />
          </label>
        )}
      </div>
      {evid.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem fotos.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {evid.map((e)=>(<EvImg key={e.id} ev={e}/>))}
        </div>
      )}

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
    supabase.storage.from("evidencias").createSignedUrl(ev.storage_path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? ""));
  }, [ev.storage_path]);
  return (
    <a href={url} target="_blank" className="block aspect-square overflow-hidden rounded border border-border bg-muted">
      {url && <img src={url} className="h-full w-full object-cover" />}
    </a>
  );
}