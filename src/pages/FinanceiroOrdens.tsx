import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calculator, Receipt, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FinanceiroOrdens() {
  const { user, hasRole } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    supabase.from("ordens_servico")
      .select(`
        *, 
        obra:obras(numero, nome, cidade, estado), 
        profissional:profiles!ordens_servico_profissional_id_fkey(nome),
        financial:financial_order_records(*)
      `)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchSearch = r.numero?.toLowerCase().includes(search.toLowerCase()) ||
                         r.obra?.nome?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status_financeiro === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [rows, search, filterStatus]);

  const stats = useMemo(() => {
    const total = filteredRows.reduce((acc, r) => acc + Number(r.valor_aprovado || 0), 0);
    const billable = filteredRows.filter(r => r.financial?.is_billable).length;
    return { total, billable };
  }, [filteredRows]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ordens Financeiras" description="Acompanhamento de custos e faturamento por OS." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Aprovado</p>
              <p className="text-xl font-bold text-emerald-700">R$ {stats.total.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Receipt className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Faturáveis</p>
              <p className="text-xl font-bold text-blue-700">{stats.billable} OS</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Calculator className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Margem Média</p>
              <p className="text-xl font-bold text-purple-700">62%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar OS ou Obra..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48 h-10">
            <SelectValue placeholder="Status Financeiro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="aguardando_analise">Aguardando Análise</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="faturado">Faturado</SelectItem>
            <SelectItem value="com_divergencia">Com Divergência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRows.length === 0 ? <EmptyState title="Nenhuma ordem encontrada" /> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Obra / Local</th>
                <th className="px-4 py-3 text-right">Custo Real</th>
                <th className="px-4 py-3 text-right">Vlr. Aprovado</th>
                <th className="px-4 py-3">Status Financeiro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <Link to={`/app/os/${r.id}`} className="font-mono font-bold text-primary hover:underline">{r.numero}</Link>
                      <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1">{r.obra?.nome}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{r.obra?.cidade}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    R$ {Number(r.financial?.real_cost || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                    R$ {Number(r.valor_aprovado || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase",
                      r.status_financeiro === 'aguardando_analise' ? "text-orange-600 bg-orange-50 border-orange-200" :
                      r.status_financeiro === 'aprovado' ? "text-green-600 bg-green-50 border-green-200" :
                      r.status_financeiro === 'faturado' ? "text-blue-600 bg-blue-50 border-blue-200" : "text-muted-foreground"
                    )}>
                      {r.status_financeiro?.replace('_', ' ') || 'SEM IMPACTO'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/app/os/${r.id}`}>Detalhes</Link>
                    </Button>
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