import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import NewServiceOrderDialog from "@/components/os/NewServiceOrderDialog";
import { Plus, Search } from "lucide-react";
import type { Period } from "@/components/PeriodFilter";

export default function OSDashboardTab({ period }: { period: Period }) {
  const [rows, setRows] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [obraId, setObraId] = useState("all");
  const [profId, setProfId] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  async function load() {
    let q = supabase
      .from("ordens_servico")
      .select("id, numero, status, total_umd, created_at, obra:obras(numero,nome), profissional:profiles!ordens_servico_profissional_id_fkey(nome)")
      .gte("created_at", period.start.toISOString())
      .lte("created_at", period.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(300);
    if (obraId !== "all") q = q.eq("obra_id", obraId);
    if (profId !== "all") q = q.eq("profissional_id", profId);
    if (statusF !== "all") q = q.eq("status", statusF as any);
    const { data } = await q;
    setRows(data ?? []);
  }

  useEffect(() => {
    supabase.from("obras").select("id, numero, nome").then(({ data }) => setObras(data ?? []));
    supabase.from("profiles").select("id, nome").eq("ativo", true).then(({ data }) => setProfs(data ?? []));
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("os-tab")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordens_servico" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.start, period.end, obraId, profId, statusF]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => !search || r.numero.toLowerCase().includes(search.toLowerCase()) || r.obra?.nome?.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  const kpis = useMemo(() => {
    const k: Record<string, number> = { abertas: 0, revisao: 0, aprovadas: 0, reprovadas: 0 };
    rows.forEach((r) => {
      if (["iniciada", "em_andamento", "corrigida"].includes(r.status)) k.abertas++;
      else if (["aguardando_revisao", "em_revisao"].includes(r.status)) k.revisao++;
      else if (r.status === "aprovada") k.aprovadas++;
      else if (r.status === "reprovada") k.reprovadas++;
    });
    return k;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Abertas" v={kpis.abertas} color="text-info" />
        <KPI label="Em revisão" v={kpis.revisao} color="text-warning" />
        <KPI label="Aprovadas" v={kpis.aprovadas} color="text-success" />
        <KPI label="Reprovadas" v={kpis.reprovadas} color="text-destructive" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar OS ou obra..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="iniciada">Iniciada</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="aguardando_revisao">Aguardando revisão</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="reprovada">Reprovada</SelectItem>
            <SelectItem value="correcao_solicitada">Correção</SelectItem>
          </SelectContent>
        </Select>
        <Select value={obraId} onValueChange={setObraId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Obra" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.numero}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={profId} onValueChange={setProfId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Profissional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setOpenNew(true)} className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Nova OS
        </Button>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma OS no período/filtros.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Número</th>
                <th className="text-left px-3 py-2">Obra</th>
                <th className="text-left px-3 py-2">Profissional</th>
                <th className="text-right px-3 py-2">UMD</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-primary/5">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link to={`/app/os/${r.id}`} className="text-primary font-bold hover:underline">{r.numero}</Link>
                  </td>
                  <td className="px-3 py-2 truncate max-w-[200px]">{r.obra?.numero} — {r.obra?.nome}</td>
                  <td className="px-3 py-2 truncate max-w-[160px]">{r.profissional?.nome}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(r.total_umd ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <NewServiceOrderDialog open={openNew} onOpenChange={setOpenNew} onSuccess={() => load()} />
    </div>
  );
}

function KPI({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{v}</div>
    </Card>
  );
}