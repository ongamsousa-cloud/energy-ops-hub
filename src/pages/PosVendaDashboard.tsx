import { useEffect, useState } from "react";
import { supabase as supaTyped } from "@/integrations/supabase/client";
const supabase: any = supaTyped;
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Headphones, ShieldCheck, Smile, AlertTriangle, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";

const STATUS = ["aberto", "em_atendimento", "aguardando_cliente", "resolvido", "fechado"];

export default function PosVendaDashboard() {
  const { profile } = useAuth();
  const [chamados, setChamados] = useState<any[]>([]);
  const [garantias, setGarantias] = useState<any[]>([]);
  const [pesquisas, setPesquisas] = useState<any[]>([]);
  const [retrabalhos, setRetrabalhos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCh, setOpenCh] = useState(false);
  const [openNps, setOpenNps] = useState(false);

  const [novoCh, setNovoCh] = useState({ titulo: "", descricao: "", categoria: "duvida", prioridade: "media", sla_horas: 24, cliente_id: "" });
  const [novoNps, setNovoNps] = useState({ cliente_id: "", nota: 9, comentario: "" });

  async function load() {
    setLoading(true);
    const [c, g, p, r, cli] = await Promise.all([
      supabase.from("chamados_posvenda").select("*").order("created_at", { ascending: false }),
      supabase.from("garantias").select("*").order("data_fim", { ascending: true }),
      supabase.from("pesquisas_satisfacao").select("*").order("created_at", { ascending: false }),
      supabase.from("retrabalhos").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes_comercial").select("id,nome").order("nome"),
    ]);
    setChamados(c.data ?? []);
    setGarantias(g.data ?? []);
    setPesquisas(p.data ?? []);
    setRetrabalhos(r.data ?? []);
    setClientes(cli.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function criarChamado() {
    if (!novoCh.titulo) return toast.error("Informe o título");
    const { error } = await supabase.from("chamados_posvenda").insert({
      ...novoCh,
      cliente_id: novoCh.cliente_id || null,
      created_by: profile?.id,
      responsavel_id: profile?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Chamado aberto");
    setOpenCh(false);
    setNovoCh({ titulo: "", descricao: "", categoria: "duvida", prioridade: "media", sla_horas: 24, cliente_id: "" });
    load();
  }

  async function criarNps() {
    const { error } = await supabase.from("pesquisas_satisfacao").insert({
      cliente_id: novoNps.cliente_id || null,
      nota: novoNps.nota,
      comentario: novoNps.comentario,
      tipo: "nps",
    });
    if (error) return toast.error(error.message);
    toast.success("Pesquisa registrada");
    setOpenNps(false);
    setNovoNps({ cliente_id: "", nota: 9, comentario: "" });
    load();
  }

  async function avancarStatus(id: string, novo: string) {
    const upd: any = { status: novo };
    if (novo === "resolvido") upd.data_resolucao = new Date().toISOString();
    if (novo === "fechado") upd.data_fechamento = new Date().toISOString();
    const { error } = await supabase.from("chamados_posvenda").update(upd).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const abertos = chamados.filter((c) => !["fechado", "resolvido", "cancelado"].includes(c.status)).length;
  const promotores = pesquisas.filter((p) => p.nota >= 9).length;
  const detratores = pesquisas.filter((p) => p.nota <= 6).length;
  const totalNps = pesquisas.length;
  const nps = totalNps > 0 ? Math.round(((promotores - detratores) / totalNps) * 100) : 0;
  const garantiasVigentes = garantias.filter((g) => g.status === "vigente").length;
  const retrabPendentes = retrabalhos.filter((r) => r.status !== "concluido" && r.status !== "cancelado").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Pós-venda" description="Chamados, garantias, NPS e retrabalhos" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chamados abertos</CardTitle>
            <Headphones className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{abertos}</div>
            <p className="text-xs text-muted-foreground mt-1">{chamados.length} no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NPS</CardTitle>
            <Smile className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nps}</div>
            <p className="text-xs text-muted-foreground mt-1">{promotores} prom. · {detratores} detr.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Garantias vigentes</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{garantiasVigentes}</div>
            <p className="text-xs text-muted-foreground mt-1">{garantias.length} histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retrabalhos pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retrabPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">{retrabalhos.length} no total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpenCh(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Novo chamado</Button>
        <Button onClick={() => setOpenNps(true)} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Registrar NPS</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Chamados por status</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-sm text-muted-foreground">Carregando…</div> : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {STATUS.map((s) => {
                const itens = chamados.filter((c) => c.status === s);
                return (
                  <div key={s} className="rounded-md border border-border bg-muted/30 p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold capitalize">{s.replace("_", " ")}</span>
                      <Badge variant="secondary" className="text-[10px]">{itens.length}</Badge>
                    </div>
                    <div className="space-y-1.5 max-h-72 overflow-auto">
                      {itens.map((c) => (
                        <div key={c.id} className="rounded bg-card border border-border p-2 text-xs">
                          <div className="font-medium truncate">{c.numero}</div>
                          <div className="truncate text-muted-foreground">{c.titulo}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {STATUS.filter(st => st !== c.status).slice(0,2).map(st => (
                              <button key={st} onClick={() => avancarStatus(c.id, st)} className="text-[9px] px-1.5 py-0.5 rounded bg-accent hover:bg-primary hover:text-primary-foreground capitalize">→ {st.replace("_"," ")}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {itens.length === 0 && <div className="text-[10px] text-muted-foreground italic">Vazio</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Garantias próximas do vencimento</CardTitle></CardHeader>
          <CardContent>
            {garantias.filter(g => g.status === "vigente").slice(0,6).map((g) => (
              <div key={g.id} className="flex justify-between border-b border-border py-1.5 text-sm">
                <span className="truncate">Vence em {new Date(g.data_fim).toLocaleDateString("pt-BR")}</span>
                <Badge variant="outline" className="text-[10px]">{g.status}</Badge>
              </div>
            ))}
            {garantias.length === 0 && <div className="text-xs text-muted-foreground italic">Sem garantias registradas.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Pesquisas recentes</CardTitle></CardHeader>
          <CardContent>
            {pesquisas.slice(0,6).map((p) => (
              <div key={p.id} className="flex justify-between border-b border-border py-1.5 text-sm">
                <span className="truncate">{p.comentario || "(sem comentário)"}</span>
                <Badge className="text-[10px]">{p.nota} · {p.categoria}</Badge>
              </div>
            ))}
            {pesquisas.length === 0 && <div className="text-xs text-muted-foreground italic">Nenhuma pesquisa registrada.</div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openCh} onOpenChange={setOpenCh}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={novoCh.titulo} onChange={(e) => setNovoCh({ ...novoCh, titulo: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={novoCh.descricao} onChange={(e) => setNovoCh({ ...novoCh, descricao: e.target.value })} /></div>
            <div>
              <Label>Cliente</Label>
              <Select value={novoCh.cliente_id} onValueChange={(v) => setNovoCh({ ...novoCh, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Categoria</Label>
                <Select value={novoCh.categoria} onValueChange={(v) => setNovoCh({ ...novoCh, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duvida">Dúvida</SelectItem>
                    <SelectItem value="reclamacao">Reclamação</SelectItem>
                    <SelectItem value="garantia">Garantia</SelectItem>
                    <SelectItem value="solicitacao">Solicitação</SelectItem>
                    <SelectItem value="sugestao">Sugestão</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={novoCh.prioridade} onValueChange={(v) => setNovoCh({ ...novoCh, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>SLA (h)</Label><Input type="number" value={novoCh.sla_horas} onChange={(e) => setNovoCh({ ...novoCh, sla_horas: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpenCh(false)}>Cancelar</Button><Button onClick={criarChamado}>Abrir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openNps} onOpenChange={setOpenNps}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar NPS</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente</Label>
              <Select value={novoNps.cliente_id} onValueChange={(v) => setNovoNps({ ...novoNps, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nota (0-10)</Label><Input type="number" min={0} max={10} value={novoNps.nota} onChange={(e) => setNovoNps({ ...novoNps, nota: Number(e.target.value) })} /></div>
            <div><Label>Comentário</Label><Textarea value={novoNps.comentario} onChange={(e) => setNovoNps({ ...novoNps, comentario: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpenNps(false)}>Cancelar</Button><Button onClick={criarNps}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}