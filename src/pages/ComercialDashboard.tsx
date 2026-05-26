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
import { TrendingUp, Users, FileText, Target, Plus, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ETAPAS = [
  { key: "prospeccao", label: "Prospecção" },
  { key: "qualificacao", label: "Qualificação" },
  { key: "proposta", label: "Proposta" },
  { key: "negociacao", label: "Negociação" },
  { key: "ganho", label: "Ganho" },
  { key: "perda", label: "Perda" },
];

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ComercialDashboard() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [ops, setOps] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState(false);
  const [openOp, setOpenOp] = useState(false);
  const [openCli, setOpenCli] = useState(false);

  const [novoLead, setNovoLead] = useState({ nome_contato: "", email: "", telefone: "", origem: "site", temperatura: "morno", valor_estimado: 0 });
  const [novaOp, setNovaOp] = useState({ titulo: "", cliente_id: "", valor: 0, etapa: "prospeccao", probabilidade: 50 });
  const [novoCli, setNovoCli] = useState({ nome: "", tipo: "pj", documento: "", email: "", telefone: "", segmento: "" });

  async function load() {
    setLoading(true);
    const [l, o, p, c] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("oportunidades").select("*").order("created_at", { ascending: false }),
      supabase.from("propostas_comerciais").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes_comercial").select("*").order("nome"),
    ]);
    setLeads(l.data ?? []);
    setOps(o.data ?? []);
    setPropostas(p.data ?? []);
    setClientes(c.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function criarLead() {
    if (!novoLead.nome_contato) return toast.error("Informe o nome do contato");
    const { error } = await supabase.from("leads").insert({ ...novoLead, created_by: profile?.id, responsavel_id: profile?.id });
    if (error) return toast.error(error.message);
    toast.success("Lead criado");
    setOpenLead(false);
    setNovoLead({ nome_contato: "", email: "", telefone: "", origem: "site", temperatura: "morno", valor_estimado: 0 });
    load();
  }

  async function criarOp() {
    if (!novaOp.titulo) return toast.error("Informe o título");
    const { error } = await supabase.from("oportunidades").insert({
      ...novaOp,
      cliente_id: novaOp.cliente_id || null,
      created_by: profile?.id,
      responsavel_id: profile?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Oportunidade criada");
    setOpenOp(false);
    setNovaOp({ titulo: "", cliente_id: "", valor: 0, etapa: "prospeccao", probabilidade: 50 });
    load();
  }

  async function criarCliente() {
    if (!novoCli.nome) return toast.error("Informe o nome");
    const { error } = await supabase.from("clientes_comercial").insert({ ...novoCli, created_by: profile?.id, responsavel_id: profile?.id });
    if (error) return toast.error(error.message);
    toast.success("Cliente cadastrado");
    setOpenCli(false);
    setNovoCli({ nome: "", tipo: "pj", documento: "", email: "", telefone: "", segmento: "" });
    load();
  }

  async function moverEtapa(opId: string, novaEtapa: string) {
    const { error } = await supabase.from("oportunidades").update({ etapa: novaEtapa, data_fechamento: ["ganho","perda"].includes(novaEtapa) ? new Date().toISOString().slice(0,10) : null }).eq("id", opId);
    if (error) return toast.error(error.message);
    load();
  }

  const leadsAtivos = leads.filter((l) => !["convertido", "descartado"].includes(l.status)).length;
  const opsAbertas = ops.filter((o) => !["ganho", "perda"].includes(o.etapa));
  const receitaPrevista = opsAbertas.reduce((s, o) => s + Number(o.valor || 0) * (Number(o.probabilidade || 0) / 100), 0);
  const receitaGanha = ops.filter((o) => o.etapa === "ganho").reduce((s, o) => s + Number(o.valor || 0), 0);
  const totalFechadas = ops.filter((o) => ["ganho", "perda"].includes(o.etapa)).length;
  const ganhas = ops.filter((o) => o.etapa === "ganho").length;
  const conversao = totalFechadas > 0 ? Math.round((ganhas / totalFechadas) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Comercial" description="Funil de vendas, leads e oportunidades" />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leads ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">{leads.length} no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Oportunidades</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opsAbertas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{ops.length} histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita prevista</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtBRL(receitaPrevista)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ponderada por probabilidade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversão</CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversao}%</div>
            <p className="text-xs text-muted-foreground mt-1">Receita ganha: {fmtBRL(receitaGanha)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpenLead(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Novo lead</Button>
        <Button onClick={() => setOpenOp(true)} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Nova oportunidade</Button>
        <Button onClick={() => setOpenCli(true)} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Novo cliente</Button>
      </div>

      {/* Funil kanban */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Funil de oportunidades</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {ETAPAS.map((et) => {
                const itens = ops.filter((o) => o.etapa === et.key);
                const total = itens.reduce((s, o) => s + Number(o.valor || 0), 0);
                return (
                  <div key={et.key} className="rounded-md border border-border bg-muted/30 p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{et.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{itens.length}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mb-2">{fmtBRL(total)}</div>
                    <div className="space-y-1.5 max-h-72 overflow-auto">
                      {itens.map((o) => (
                        <div key={o.id} className="rounded bg-card border border-border p-2 text-xs">
                          <div className="font-medium truncate">{o.titulo}</div>
                          <div className="text-muted-foreground">{fmtBRL(Number(o.valor))}</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {ETAPAS.filter(e => e.key !== o.etapa).slice(0,2).map(e => (
                              <button key={e.key} onClick={() => moverEtapa(o.id, e.key)} className="text-[9px] px-1.5 py-0.5 rounded bg-accent hover:bg-primary hover:text-primary-foreground">→ {e.label}</button>
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

      {/* Leads recentes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Leads recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leads.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center justify-between border border-border rounded-md p-2 text-sm">
                <div>
                  <div className="font-medium">{l.nome_contato}</div>
                  <div className="text-xs text-muted-foreground">{l.email || l.telefone || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{l.temperatura}</Badge>
                  <Badge className="text-[10px] capitalize">{l.status}</Badge>
                </div>
              </div>
            ))}
            {leads.length === 0 && <div className="text-xs text-muted-foreground italic">Nenhum lead cadastrado ainda.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Propostas */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Propostas comerciais</CardTitle></CardHeader>
        <CardContent>
          {propostas.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">Nenhuma proposta gerada ainda.</div>
          ) : (
            <div className="space-y-2">
              {propostas.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between border border-border rounded-md p-2 text-sm">
                  <div>
                    <div className="font-medium">{p.numero} · {p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{fmtBRL(Number(p.valor_total))}</div>
                  </div>
                  <Badge className="text-[10px] capitalize">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <Dialog open={openLead} onOpenChange={setOpenLead}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do contato</Label><Input value={novoLead.nome_contato} onChange={(e) => setNovoLead({ ...novoLead, nome_contato: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>E-mail</Label><Input value={novoLead.email} onChange={(e) => setNovoLead({ ...novoLead, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={novoLead.telefone} onChange={(e) => setNovoLead({ ...novoLead, telefone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Origem</Label><Input value={novoLead.origem} onChange={(e) => setNovoLead({ ...novoLead, origem: e.target.value })} /></div>
              <div>
                <Label>Temperatura</Label>
                <Select value={novoLead.temperatura} onValueChange={(v) => setNovoLead({ ...novoLead, temperatura: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frio">Frio</SelectItem>
                    <SelectItem value="morno">Morno</SelectItem>
                    <SelectItem value="quente">Quente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Valor estimado (R$)</Label><Input type="number" value={novoLead.valor_estimado} onChange={(e) => setNovoLead({ ...novoLead, valor_estimado: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpenLead(false)}>Cancelar</Button><Button onClick={criarLead}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openOp} onOpenChange={setOpenOp}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={novaOp.titulo} onChange={(e) => setNovaOp({ ...novaOp, titulo: e.target.value })} /></div>
            <div>
              <Label>Cliente</Label>
              <Select value={novaOp.cliente_id} onValueChange={(v) => setNovaOp({ ...novaOp, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Valor (R$)</Label><Input type="number" value={novaOp.valor} onChange={(e) => setNovaOp({ ...novaOp, valor: Number(e.target.value) })} /></div>
              <div><Label>Probabilidade (%)</Label><Input type="number" min={0} max={100} value={novaOp.probabilidade} onChange={(e) => setNovaOp({ ...novaOp, probabilidade: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Etapa</Label>
              <Select value={novaOp.etapa} onValueChange={(v) => setNovaOp({ ...novaOp, etapa: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETAPAS.map((e) => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpenOp(false)}>Cancelar</Button><Button onClick={criarOp}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCli} onOpenChange={setOpenCli}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome / Razão social</Label><Input value={novoCli.nome} onChange={(e) => setNovoCli({ ...novoCli, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select value={novoCli.tipo} onValueChange={(v) => setNovoCli({ ...novoCli, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>CNPJ / CPF</Label><Input value={novoCli.documento} onChange={(e) => setNovoCli({ ...novoCli, documento: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>E-mail</Label><Input value={novoCli.email} onChange={(e) => setNovoCli({ ...novoCli, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={novoCli.telefone} onChange={(e) => setNovoCli({ ...novoCli, telefone: e.target.value })} /></div>
            </div>
            <div><Label>Segmento</Label><Input value={novoCli.segmento} onChange={(e) => setNovoCli({ ...novoCli, segmento: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpenCli(false)}>Cancelar</Button><Button onClick={criarCliente}>Cadastrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}