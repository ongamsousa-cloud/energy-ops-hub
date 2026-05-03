import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Search, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FinanceiroMateriais() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [consumoTrend, setConsumoTrend] = useState<number>(0);
  const [itensExtras, setItensExtras] = useState<number>(0);

  useEffect(() => {
    supabase.from("os_atividades")
      .select(`
        id, quantidade, unidade, umd_total, created_at,
        atividade:atividades(codigo_item, descricao),
        os:ordens_servico(numero, obra:obras(nome))
      `)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));

    // Consumo mensal: variação % entre últimos 30d e os 30d anteriores
    (async () => {
      const now = new Date();
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
      const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
      const { data: mov } = await supabase
        .from("stock_movements")
        .select("quantity, type, created_at")
        .gte("created_at", d60.toISOString());
      let atual = 0, anterior = 0;
      (mov ?? []).forEach((m: any) => {
        if (m.type !== "saida") return;
        const t = new Date(m.created_at).getTime();
        if (t >= d30.getTime()) atual += Number(m.quantity || 0);
        else anterior += Number(m.quantity || 0);
      });
      const trend = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 1000) / 10 : (atual > 0 ? 100 : 0);
      setConsumoTrend(trend);

      // Itens extras: registros financeiros marcados is_extra
      const { count } = await supabase
        .from("financial_material_records")
        .select("id", { count: "exact", head: true })
        .eq("is_extra", true);
      setItensExtras(count ?? 0);
    })();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter(r => 
      r.atividade?.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      r.os?.numero?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Materiais e Custos" description="Consolidado de recursos aplicados em campo." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Itens Registrados</p>
              <p className="text-xl font-bold">{rows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Consumo Mensal</p>
              <p className={`text-xl font-bold ${consumoTrend >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {consumoTrend >= 0 ? "+" : ""}{consumoTrend.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Itens Extras</p>
              <p className="text-xl font-bold text-red-700">{String(itensExtras).padStart(2,"0")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filtrar por material ou OS..." 
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredRows.length === 0 ? <EmptyState title="Nenhum material encontrado" /> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="px-4 py-3">Material / Atividade</th>
                <th className="px-4 py-3">OS / Obra</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">UMD Gerada</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1">{r.atividade?.descricao}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{r.atividade?.codigo_item}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{r.os?.numero}</span>
                      <span className="text-[10px] text-muted-foreground">{r.os?.obra?.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className="font-mono">{Number(r.quantidade).toFixed(2)} {r.unidade}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                    {Number(r.umd_total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}