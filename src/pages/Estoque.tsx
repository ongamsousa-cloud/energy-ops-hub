import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { cn } from "@/lib/utils";
import {
  Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  TrendingUp, History, Warehouse as WarehouseIcon, Plus, Search, Activity,
  Boxes, AlertCircle, RotateCcw, MinusCircle, Download
} from "lucide-react";
import NewMaterialDialog from "@/components/stock/NewMaterialDialog";
import StockMovementDialog from "@/components/stock/StockMovementDialog";
import WarehouseDialog from "@/components/stock/WarehouseDialog";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "#10b981", "#f59e0b"];

const TYPE_LABEL: Record<string,string> = {
  entrada: "Entrada", saida: "Saída", devolucao: "Devolução",
  transferencia: "Transferência", ajuste: "Ajuste", reserva: "Reserva"
};
const TYPE_COLOR: Record<string,string> = {
  entrada: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  saida: "bg-red-500/10 text-red-600 border-red-500/30",
  devolucao: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  transferencia: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  ajuste: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  reserva: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

export default function Estoque({ defaultTab }: { defaultTab?: string }) {
  const { hasRole } = useAuth();
  const location = useLocation();
  const isEstoquePortal = location.pathname.startsWith("/estoque-app");
  const [activeTab, setActiveTab] = useState(defaultTab || "overview");

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const canWrite = hasRole(["admin","gestor","supervisor"]);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
   const [search, setSearch] = useState("");
   const [osFilter, setOsFilter] = useState("all");
   const [equipeFilter, setEquipeFilter] = useState("all");
   const [allObras, setAllObras] = useState<any[]>([]);
   const [allEquipes, setAllEquipes] = useState<any[]>([]);

  const [newMaterialOpen, setNewMaterialOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<any>(null);
  const [movementType, setMovementType] = useState<string>("entrada");

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const ch = supabase.channel("stock-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, () => {
        loadMovements();
        loadMaterials();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stock_alerts" }, (payload) => {
        toast.error(`ALERTA DE ESTOQUE: ${payload.new.message}`, {
          duration: 5000,
          icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
        });
        loadAlerts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_levels" }, () => loadMaterials())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  function exportMovementsToCSV() {
    if (filteredMovements.length === 0) return toast.info("Nenhuma movimentação para exportar");
    
    const headers = ["Data", "Tipo", "Material", "Qtd", "Unidade", "De", "Para", "Responsável", "OS", "Notas"];
    const rows = filteredMovements.map(m => [
      format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
      TYPE_LABEL[m.type],
      m.materials?.name,
      m.quantity,
      m.materials?.unit,
      m.from_wh?.name || "-",
      m.to_wh?.name || "-",
      m.creator?.nome || "-",
      m.ordens_servico?.numero || "-",
      m.notes || "-"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `movimentacoes_estoque_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso");
  }


   async function loadAll() {
     setLoading(true);
     await Promise.all([
       loadMaterials(), 
       loadMovements(), 
       loadWarehouses(), 
       loadReservations(), 
       loadAlerts(),
       supabase.from("obras").select("id, numero, nome").eq("ativo", true).then(({data}) => setAllObras(data ?? [])),
       supabase.from("equipes").select("id, nome").eq("ativo", true).then(({data}) => setAllEquipes(data ?? []))
     ]);
     setLoading(false);
   }

  async function loadMaterials() {
    const { data } = await supabase.from("materials")
      .select("*, material_categories(name), stock_levels(quantity, warehouse_id, warehouses(name))")
      .eq("active", true).order("name");
    if (data) {
      const enriched = data.map((m: any) => ({
        ...m,
        total_quantity: (m.stock_levels || []).reduce((s: number, l: any) => s + Number(l.quantity || 0), 0),
        total_value: (m.stock_levels || []).reduce((s: number, l: any) => s + Number(l.quantity || 0), 0) * Number(m.cost_price || 0),
      }));
      setMaterials(enriched);
    }
  }
  async function loadMovements() {
    const { data } = await supabase.from("stock_movements")
      .select("*, materials(name, code, unit), profiles!stock_movements_professional_id_fkey(nome), creator:profiles!stock_movements_created_by_fkey(nome), from_wh:warehouses!stock_movements_from_warehouse_id_fkey(name), to_wh:warehouses!stock_movements_to_warehouse_id_fkey(name), ordens_servico(numero)")
      .order("created_at", { ascending: false }).limit(100);
    if (data) setMovements(data);
  }
  async function loadWarehouses() {
    const { data } = await supabase.from("warehouses")
      .select("*, stock_levels(quantity, materials(cost_price))")
      .order("name");
    if (data) {
      const enriched = data.map((w: any) => ({
        ...w,
        items_count: (w.stock_levels || []).filter((l: any) => Number(l.quantity) > 0).length,
        total_value: (w.stock_levels || []).reduce((s: number, l: any) => s + Number(l.quantity || 0) * Number(l.materials?.cost_price || 0), 0),
      }));
      setWarehouses(enriched);
    }
  }
  async function loadReservations() {
    const { data } = await supabase.from("material_reservations")
      .select("*, materials(name, code, unit), warehouses(name), ordens_servico(numero), profiles!material_reservations_created_by_fkey(nome)")
      .order("created_at", { ascending: false }).limit(50);
    if (data) setReservations(data);
  }
  async function loadAlerts() {
    const { data } = await supabase.from("stock_alerts")
      .select("*, materials(name, code), warehouses(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false }).limit(50);
    if (data) setAlerts(data);
  }

  const kpis = useMemo(() => {
    const total = materials.length;
    const lowStock = materials.filter(m => m.total_quantity > 0 && m.total_quantity <= Number(m.minimum_stock || 0)).length;
    const critical = materials.filter(m => m.total_quantity <= Number(m.critical_stock || 0)).length;
    const outOfStock = materials.filter(m => m.total_quantity <= 0).length;
    const totalValue = materials.reduce((s, m) => s + m.total_value, 0);
    const today = startOfDay(new Date());
    const movToday = movements.filter(m => new Date(m.created_at) >= today).length;
    const reservedActive = reservations.filter(r => r.status === "reservado").length;
    const lossMonth = movements.filter(m => m.type === "ajuste" && new Date(m.created_at).getMonth() === new Date().getMonth())
      .reduce((s,m) => s + Number(m.total_cost || 0), 0);
    return { total, lowStock, critical, outOfStock, totalValue, movToday, reservedActive, lossMonth };
  }, [materials, movements, reservations]);

  const chartFlow = useMemo(() => {
    const days: any[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const ds = format(d, "dd/MM");
      const day = startOfDay(d).getTime();
      const next = day + 86400000;
      const dayMov = movements.filter(m => {
        const t = new Date(m.created_at).getTime();
        return t >= day && t < next;
      });
      days.push({
        dia: ds,
        Entradas: dayMov.filter(m => m.type === "entrada").reduce((s,m) => s + Number(m.quantity), 0),
        Saídas: dayMov.filter(m => m.type === "saida").reduce((s,m) => s + Number(m.quantity), 0),
      });
    }
    return days;
  }, [movements]);

  const chartTopConsumed = useMemo(() => {
    const map = new Map<string, number>();
    movements.filter(m => m.type === "saida").forEach(m => {
      const k = `${m.materials?.code || ""} ${m.materials?.name || "?"}`;
      map.set(k, (map.get(k) || 0) + Number(m.quantity));
    });
    return Array.from(map.entries()).map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a,b) => b.qtd - a.qtd).slice(0, 8);
  }, [movements]);

  const chartByCategory = useMemo(() => {
    const map = new Map<string, number>();
    materials.forEach(m => {
      const k = m.material_categories?.name || "Sem categoria";
      map.set(k, (map.get(k) || 0) + m.total_value);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [materials]);

   const filteredMovements = useMemo(() => {
     return movements.filter(m => {
       const matchOS = osFilter === "all" || m.ordens_servico?.id === osFilter;
       // Como não temos equipe direto no stock_movements, filtramos pela OS que pertence à equipe
       const matchEquipe = equipeFilter === "all" || m.ordens_servico?.equipe_id === equipeFilter;
       return matchOS && matchEquipe;
     });
   }, [movements, osFilter, equipeFilter]);
 
   const filteredMaterials = useMemo(() => {
     let filtered = materials;
     if (search) {
       const s = search.toLowerCase();
       filtered = filtered.filter(m => m.name?.toLowerCase().includes(s) || m.code?.toLowerCase().includes(s) || m.material_categories?.name?.toLowerCase().includes(s));
     }
     return filtered;
   }, [materials, search]);

  function openMovement(type: string) {
    setMovementType(type);
    setMovementOpen(true);
  }

  async function resolveAlert(id: string) {
    const { error } = await supabase.from("stock_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (!error) { toast.success("Alerta resolvido"); loadAlerts(); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque & Materiais"
        description="Centro de controle do almoxarifado, movimentações e rastreabilidade ponta a ponta"
        actions={canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => openMovement("entrada")}><ArrowDownToLine className="h-4 w-4 mr-1.5"/>Entrada</Button>
            <Button size="sm" variant="outline" onClick={() => openMovement("saida")}><ArrowUpFromLine className="h-4 w-4 mr-1.5"/>Saída p/ OS</Button>
            <Button size="sm" variant="outline" onClick={() => openMovement("devolucao")}><RotateCcw className="h-4 w-4 mr-1.5"/>Devolução</Button>
            <Button size="sm" variant="outline" onClick={() => openMovement("transferencia")}><ArrowLeftRight className="h-4 w-4 mr-1.5"/>Transferir</Button>
            <Button size="sm" variant="outline" onClick={() => openMovement("ajuste")}><MinusCircle className="h-4 w-4 mr-1.5"/>Perda/Ajuste</Button>
            <Button size="sm" variant="secondary" onClick={exportMovementsToCSV}><Download className="h-4 w-4 mr-1.5"/>Exportar CSV</Button>
            <Button size="sm" onClick={() => setNewMaterialOpen(true)}><Plus className="h-4 w-4 mr-1.5"/>Material</Button>
          </div>
        )}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Package} label="Itens ativos" value={kpis.total} hint={`${kpis.outOfStock} sem saldo`}/>
        <Kpi icon={TrendingUp} label="Valor em estoque" value={kpis.totalValue.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} hint="Custo total"/>
        <Kpi icon={AlertTriangle} label="Estoque crítico" value={kpis.critical} hint={`${kpis.lowStock} abaixo do mínimo`} tone="warn"/>
        <Kpi icon={Activity} label="Movimentações hoje" value={kpis.movToday} hint={`${kpis.reservedActive} reservas ativas`}/>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!isEstoquePortal && (
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-1.5"/>Visão Geral</TabsTrigger>
            <TabsTrigger value="materials"><Boxes className="h-4 w-4 mr-1.5"/>Materiais</TabsTrigger>
            <TabsTrigger value="warehouses"><WarehouseIcon className="h-4 w-4 mr-1.5"/>Almoxarifados</TabsTrigger>
            <TabsTrigger value="movements"><History className="h-4 w-4 mr-1.5"/>Movimentações</TabsTrigger>
            <TabsTrigger value="reservations"><Package className="h-4 w-4 mr-1.5"/>Reservas/OS</TabsTrigger>
            <TabsTrigger value="alerts"><AlertCircle className="h-4 w-4 mr-1.5"/>Alertas {alerts.length > 0 && <Badge className="ml-1.5" variant="destructive">{alerts.length}</Badge>}</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area - Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Fluxo de Materiais</h3>
                    <Badge variant="secondary" className="text-[10px]">Últimos 14 dias</Badge>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                <Card className="p-5 border-t-4 border-t-amber-500 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-foreground">Top Consumidos</h3>
                    <Boxes className="h-4 w-4 text-amber-500" />
                  </div>
              </div>

              <Card className="p-5 shadow-sm border-none bg-accent/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-foreground">Status do Inventário</h3>
                    <p className="text-xs text-muted-foreground">Distribuição de valor por categoria e alertas</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                  </div>
                  <div className="space-y-3">
                    {chartByCategory.slice(0, 5).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-[140px]">{cat.name}</span>
                        </div>
                        <span className="font-semibold">{cat.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Activity - Right 1/3 */}
            <div className="space-y-6">
              <Card className="p-5 h-full flex flex-col shadow-sm border-l-4 border-l-primary/50">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary animate-pulse"/>
                      Feed de Operações
                    </h3>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Tempo Real</Badge>
                  </div>
                  <div className="flex gap-1">
                   <Select value={osFilter} onValueChange={setOsFilter}>
                     <SelectTrigger className="h-7 text-[10px] w-[120px]"><SelectValue placeholder="Obra"/></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todas Obras</SelectItem>
                       {allObras.map(o => <SelectItem key={o.id} value={o.id}>{o.numero}</SelectItem>)}
                     </SelectContent>
                   </Select>
                   <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                     <SelectTrigger className="h-7 text-[10px] w-[120px]"><SelectValue placeholder="Equipe"/></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todas Equipes</SelectItem>
                       {allEquipes.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px]">
                 {filteredMovements.slice(0, 15).map(m => (
                   <div key={m.id} className="flex items-start gap-2 text-xs border-l-2 pl-3 py-1.5" style={{borderColor: m.type === 'entrada' ? '#10b981' : m.type === 'saida' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}}>
                     <div className="flex-1">
                       <div className="font-medium">
                         <Badge variant="outline" className={cn("text-[9px] h-4 px-1", TYPE_COLOR[m.type])}>{TYPE_LABEL[m.type]}</Badge>
                         {" "}{Number(m.quantity)} {m.materials?.unit} de <strong>{m.materials?.name}</strong>
                       </div>
                       <div className="text-[10px] text-muted-foreground">
                         {m.creator?.nome || "—"}
                         {m.ordens_servico?.numero && <> · OS {m.ordens_servico.numero}</>}
                         {m.from_wh?.name && <> · de {m.from_wh.name}</>}
                         {m.to_wh?.name && <> → {m.to_wh.name}</>}
                       </div>
                     </div>
                     <span className="text-[10px] text-muted-foreground whitespace-nowrap">{format(new Date(m.created_at), "HH:mm", {locale: ptBR})}</span>
                   </div>
                 ))}
                 {filteredMovements.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade com estes filtros.</p>}
               </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input className="pl-9" placeholder="Buscar por código, nome ou categoria..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Código</TableHead><TableHead>Material</TableHead><TableHead>Categoria</TableHead>
                <TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Mín./Crít.</TableHead>
                <TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({length:5}).map((_,i)=>(<TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6"/></TableCell></TableRow>))
                : filteredMaterials.map(m => {
                  const status = m.total_quantity <= 0 ? "Sem saldo" : m.total_quantity <= Number(m.critical_stock) ? "Crítico" : m.total_quantity <= Number(m.minimum_stock) ? "Baixo" : "OK";
                  const stColor = status === "OK" ? "bg-emerald-500/10 text-emerald-600" : status === "Baixo" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600";
                  return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.code}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.material_categories?.name || "—"}</TableCell>
                    <TableCell className="text-right font-mono">{Number(m.total_quantity).toLocaleString("pt-BR")} {m.unit}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{m.minimum_stock}/{m.critical_stock}</TableCell>
                    <TableCell className="text-right">{Number(m.cost_price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</TableCell>
                    <TableCell className="text-right font-medium">{m.total_value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</TableCell>
                    <TableCell><Badge variant="outline" className={stColor}>{status}</Badge></TableCell>
                  </TableRow>);
                })}
                {!loading && filteredMaterials.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Nenhum material encontrado.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="mt-4 space-y-3">
          {canWrite && <div className="flex justify-end"><Button size="sm" onClick={()=>{setEditWarehouse(null); setWarehouseOpen(true);}}><Plus className="h-4 w-4 mr-1.5"/>Novo Almoxarifado</Button></div>}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {warehouses.map(w => (
              <Card key={w.id} className="p-4 cursor-pointer hover:shadow-md" onClick={()=>{ if(canWrite){ setEditWarehouse(w); setWarehouseOpen(true); }}}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4 text-primary"/>{w.name}
                      {w.is_mobile && <Badge variant="outline" className="text-[10px]">MÓVEL</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{w.location || "—"}</p>
                  </div>
                  {!w.active && <Badge variant="secondary">Inativo</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                  <div><div className="text-[10px] text-muted-foreground uppercase">Itens</div><div className="font-bold">{w.items_count}</div></div>
                  <div><div className="text-[10px] text-muted-foreground uppercase">Valor</div><div className="font-bold text-xs">{w.total_value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div></div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Material</TableHead>
                <TableHead className="text-right">Qtd</TableHead><TableHead>Origem → Destino</TableHead>
                <TableHead>OS</TableHead><TableHead>Profissional</TableHead><TableHead>Por</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(m.created_at),"dd/MM HH:mm",{locale:ptBR})}</TableCell>
                    <TableCell><Badge variant="outline" className={TYPE_COLOR[m.type]}>{TYPE_LABEL[m.type]}</Badge></TableCell>
                    <TableCell><div className="font-medium text-xs">{m.materials?.name}</div><div className="text-[10px] text-muted-foreground">{m.materials?.code}</div></TableCell>
                    <TableCell className="text-right font-mono">{Number(m.quantity)} {m.materials?.unit}</TableCell>
                    <TableCell className="text-xs">{m.from_wh?.name || "—"} {m.to_wh?.name && `→ ${m.to_wh.name}`}</TableCell>
                    <TableCell className="text-xs">{m.ordens_servico?.numero || "—"}</TableCell>
                    <TableCell className="text-xs">{m.profiles?.nome || "—"}</TableCell>
                    <TableCell className="text-xs">{m.creator?.nome || "—"}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Sem movimentações registradas.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>OS</TableHead><TableHead>Material</TableHead><TableHead>Almoxarifado</TableHead>
                <TableHead className="text-right">Qtd</TableHead><TableHead>Status</TableHead>
                <TableHead>Reservado por</TableHead><TableHead>Data</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {reservations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.ordens_servico?.numero}</TableCell>
                    <TableCell><div className="font-medium text-xs">{r.materials?.name}</div><div className="text-[10px] text-muted-foreground">{r.materials?.code}</div></TableCell>
                    <TableCell className="text-xs">{r.warehouses?.name}</TableCell>
                    <TableCell className="text-right font-mono">{Number(r.quantity)} {r.materials?.unit}</TableCell>
                    <TableCell><Badge variant={r.status === "consumido" ? "default" : r.status === "liberado" ? "secondary" : "outline"}>{r.status}</Badge></TableCell>
                    <TableCell className="text-xs">{r.profiles?.nome}</TableCell>
                    <TableCell className="text-xs">{format(new Date(r.created_at),"dd/MM/yy HH:mm",{locale:ptBR})}</TableCell>
                  </TableRow>
                ))}
                {reservations.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Sem reservas ativas.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-2">
          {alerts.length === 0 && <Card className="p-8 text-center text-muted-foreground"><AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30"/>Nenhum alerta ativo no momento. Estoque sob controle.</Card>}
          {alerts.map(a => (
            <Card key={a.id} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${a.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`}/>
                <div>
                  <div className="font-medium text-sm">{a.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a.materials?.name && <>Material: {a.materials.name} · </>}
                    {a.warehouses?.name && <>Almoxarifado: {a.warehouses.name} · </>}
                    {format(new Date(a.created_at),"dd/MM HH:mm",{locale:ptBR})}
                  </div>
                </div>
              </div>
              {canWrite && <Button size="sm" variant="outline" onClick={()=>resolveAlert(a.id)}>Resolver</Button>}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <NewMaterialDialog open={newMaterialOpen} onOpenChange={setNewMaterialOpen} onSuccess={loadMaterials}/>
      <StockMovementDialog open={movementOpen} onOpenChange={setMovementOpen} onSuccess={loadAll} defaultType={movementType as any}/>
      <WarehouseDialog open={warehouseOpen} onOpenChange={setWarehouseOpen} onSuccess={loadWarehouses} warehouse={editWarehouse}/>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <Icon className={`h-4 w-4 ${tone === 'warn' ? 'text-amber-500' : 'text-primary'}`}/>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}
