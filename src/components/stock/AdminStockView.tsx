import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertTriangle, Activity, Boxes, History } from "lucide-react";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "#10b981", "#f59e0b"];

export default function AdminStockView({ materials, movements, warehouses, stockStats }: any) {
  const kpis = useMemo(() => {
    const totalValue = materials.reduce((s: any, m: any) => s + (m.total_value || 0), 0);
    const critical = materials.filter((m: any) => m.total_quantity <= Number(m.critical_stock || 0)).length;
    return { total: materials.length, totalValue, critical };
  }, [materials]);

  const chartTopConsumed = useMemo(() => {
    const map = new Map<string, number>();
    movements.filter((m: any) => m.type === "saida").forEach((m: any) => {
      const k = m.materials?.name || "?";
      map.set(k, (map.get(k) || 0) + Number(m.quantity));
    });
    return Array.from(map.entries()).map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a,b) => b.qtd - a.qtd).slice(0, 5);
  }, [movements]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Visão Geral do Estoque
          </h2>
          <p className="text-sm text-muted-foreground">Monitoramento estratégico do patrimônio e consumo</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/estoque-app">
            Acessar Painel Operacional completo →
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-primary/5 border-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Patrimônio em Estoque</p>
              <div className="text-2xl font-black">{kpis.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/20" />
          </div>
        </Card>
        <Card className="p-4 bg-destructive/5 border-destructive/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">Itens em Nível Crítico</p>
              <div className="text-2xl font-black">{kpis.critical}</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive/20" />
          </div>
        </Card>
        <Card className="p-4 bg-muted/5 border-muted/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Movimentações (24h)</p>
              <div className="text-2xl font-black">{movements.length}</div>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground/20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            Top 5 Materiais Mais Consumidos
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTopConsumed} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="nome" type="category" width={100} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Alertas e Rupturas Recentes
          </h3>
          <div className="space-y-4">
            {materials.filter((m: any) => m.total_quantity <= Number(m.minimum_stock)).slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">Saldo: {m.total_quantity} {m.unit}</span>
                </div>
                <Badge variant={m.total_quantity <= m.critical_stock ? "destructive" : "outline"} className="text-[9px]">
                  {m.total_quantity <= m.critical_stock ? "CRÍTICO" : "BAIXO"}
                </Badge>
              </div>
            ))}
            {materials.filter((m: any) => m.total_quantity <= Number(m.minimum_stock)).length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest">
                Sem alertas no momento
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
