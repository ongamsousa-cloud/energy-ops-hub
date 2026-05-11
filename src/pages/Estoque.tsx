 import { useEffect, useMemo, useState } from "react";
 import { useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { cn } from "@/lib/utils";
 import EmptyState from "@/components/EmptyState";
import {
   Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
    TrendingUp, History, Warehouse as WarehouseIcon, Plus, Search, Activity, Trash2, Edit2, X,
    Boxes, AlertCircle, RotateCcw, MinusCircle, Download, ListChecks, Filter
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

  const canWrite = hasRole(["admin","gestor","supervisor","estoque"]);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [waitingReleaseOS, setWaitingReleaseOS] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
   const [search, setSearch] = useState("");
   const [osFilter, setOsFilter] = useState("all");
   const [equipeFilter, setEquipeFilter] = useState("all");
   const [allObras, setAllObras] = useState<any[]>([]);
   const [allEquipes, setAllEquipes] = useState<any[]>([]);

   const [newMaterialOpen, setNewMaterialOpen] = useState(false);
   const [editMaterial, setEditMaterial] = useState<any>(null);
   const [movementOpen, setMovementOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
   const [editWarehouse, setEditWarehouse] = useState<any>(null);
   const [movementType, setMovementType] = useState<string>("entrada");
   const [filters, setFilters] = useState({
     type: 'all',
     warehouse: 'all',
     material: 'all',
   });

   useEffect(() => { loadAll(); }, []);

   async function loadWaitingReleaseOS() {
     const { data } = await supabase.from("ordens_servico")
       .select("*, obra:obras(numero, nome), materials:os_materials(*, materials(name, code, unit))")
       .eq("operational_status", "aguardando_liberacao_estoque")
       .order("created_at", { ascending: true });
     setWaitingReleaseOS(data ?? []);
   }

   async function releaseMaterials(osId: string) {
     setLoading(true);
     try {
       const { error } = await supabase.from("ordens_servico").update({
         operational_status: "material_liberado"
       }).eq("id", osId);
       
       if (error) throw error;

       const { data: { user } } = await supabase.auth.getUser();

       // Log in audit
       await (supabase.from("os_audit_logs") as any).insert({
         os_id: osId,
         user_id: user?.id,
         action: 'status_change',
         old_value: 'aguardando_liberacao_estoque',
         new_value: 'material_liberado',
         details: { message: 'Materiais liberados pelo almoxarifado' }
       });

       toast.success("Materiais liberados com sucesso!");
       loadWaitingReleaseOS();
     } catch (err: any) {
       toast.error("Erro ao liberar materiais: " + err.message);
     } finally {
       setLoading(false);
     }
   }

   async function loadAll() {
     setLoading(true);
     await Promise.all([
       loadMaterials(), 
       loadMovements(), 
       loadWarehouses(), 
       loadReservations(), 
       loadAlerts(),
       loadWaitingReleaseOS(),
       supabase.from("obras").select("id, numero, nome").eq("ativo", true).then(({data}) => setAllObras(data ?? [])),
       supabase.from("equipes").select("id, nome").eq("ativo", true).then(({data}) => setAllEquipes(data ?? []))
     ]);
     setLoading(false);
   }

   async function deleteMaterial(id: string) {
     if (!confirm("Tem certeza que deseja desativar este material?")) return;
     setLoading(true);
     try {
       const { error } = await supabase.from("materials").update({ active: false }).eq("id", id);
       if (error) throw error;
       toast.success("Material desativado");
       loadMaterials();
     } catch (e: any) {
       toast.error("Erro ao desativar: " + e.message);
     } finally {
       setLoading(false);
     }
   }

   async function deleteWarehouse(id: string) {
     if (!confirm("Tem certeza que deseja desativar este almoxarifado?")) return;
     setLoading(true);
     try {
       const { error: err } = await supabase.from("warehouses").update({ active: false }).eq("id", id);
       if (err) throw err;
       toast.success("Almoxarifado desativado");
       loadWarehouses();
     } catch (e: any) {
       toast.error("Erro ao desativar: " + e.message);
     } finally {
       setLoading(false);
     }
   }

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
     const { data, error } = await supabase.from("stock_movements")
       .select(`
         *,
         materials(name, code, unit),
         profiles!stock_movements_professional_id_fkey(nome),
         creator:profiles!stock_movements_professional_id_fkey(nome),
         from_wh:warehouses!stock_movements_from_warehouse_id_fkey(name),
         to_wh:warehouses!stock_movements_to_warehouse_id_fkey(name),
        ordens_servico(numero, assigned_supervisor_id, equipe_id)
       `)
       .order("created_at", { ascending: false }).limit(200);
     
     if (error) {
       console.error("Erro ao carregar movimentações:", error);
       toast.error("Erro ao carregar dados do histórico de estoque.");
       return;
     }
     
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
     const movToday = movements.filter(m => new Date(m.created_at) >= today);
     const entriesToday = movToday.filter(m => m.type === 'entrada').length;
     const exitsToday = movToday.filter(m => m.type === 'saida').length;
     const reservedActive = reservations.filter(r => r.status === "reservado").length;
     const lossMonth = movements.filter(m => m.type === "ajuste" && new Date(m.created_at).getMonth() === new Date().getMonth())
       .reduce((s,m) => s + Number(m.total_cost || 0), 0);
     return { total, lowStock, critical, outOfStock, totalValue, movToday: movToday.length, entriesToday, exitsToday, reservedActive, lossMonth };
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
        const matchEquipe = equipeFilter === "all" || m.ordens_servico?.equipe_id === equipeFilter;
        const matchType = filters.type === 'all' || m.type === filters.type;
        const matchWarehouse = filters.warehouse === 'all' || m.from_warehouse_id === filters.warehouse || m.to_warehouse_id === filters.warehouse;
        const matchMaterial = filters.material === 'all' || m.material_id === filters.material;
        return matchOS && matchEquipe && matchType && matchWarehouse && matchMaterial;
      });
    }, [movements, osFilter, equipeFilter, filters]);
 
   const filteredMaterials = useMemo(() => {
     let filtered = materials;
     if (search) {
       const s = search.toLowerCase();
       filtered = filtered.filter(m => m.name?.toLowerCase().includes(s) || m.code?.toLowerCase().includes(s) || m.material_categories?.name?.toLowerCase().includes(s));
     }
     return filtered;
   }, [materials, search]);

  const summary = useMemo(() => {
    const today = startOfDay(new Date());
    const outToday = movements.filter(m => m.type === "saida" && new Date(m.created_at) >= today);
    const inToday = movements.filter(m => m.type === "entrada" && new Date(m.created_at) >= today);
    return { outToday, inToday };
  }, [movements]);

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
          <Kpi icon={ArrowDownToLine} label="Entradas (Hoje)" value={kpis.entriesToday} hint="Novos recebimentos" tone="success"/>
          <Kpi icon={ArrowUpFromLine} label="Saídas (Hoje)" value={kpis.exitsToday} hint="Liberações para OS" tone="info"/>
          <Kpi icon={AlertTriangle} label="Status Crítico" value={kpis.critical} hint={`${kpis.lowStock} alertas pendentes`} tone="warn"/>
          <Kpi icon={Activity} label="Operações (24h)" value={kpis.movToday} hint={`${kpis.reservedActive} reservas vinculadas`}/>
       </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="flex w-full overflow-x-auto bg-muted/50 p-1 mb-4">
           <TabsTrigger value="overview" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm"><Activity className="h-4 w-4 mr-2"/>Dashboard</TabsTrigger>
           <TabsTrigger value="entradas" className="flex-1 min-w-[120px] data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600"><ArrowDownToLine className="h-4 w-4 mr-2"/>Entradas</TabsTrigger>
            <TabsTrigger value="liberacao" className="flex-1 min-w-[120px] data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600"><ArrowUpFromLine className="h-4 w-4 mr-2"/>Pendentes Liberação {waitingReleaseOS.length > 0 && <Badge className="ml-2 scale-75" variant="secondary">{waitingReleaseOS.length}</Badge>}</TabsTrigger>
           <TabsTrigger value="materials" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm"><Boxes className="h-4 w-4 mr-2"/>Inventário</TabsTrigger>
           <TabsTrigger value="warehouses" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm"><WarehouseIcon className="h-4 w-4 mr-2"/>Depósitos</TabsTrigger>
           <TabsTrigger value="movements" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm"><History className="h-4 w-4 mr-2"/>Histórico</TabsTrigger>
           <TabsTrigger value="alerts" className="flex-1 min-w-[120px] data-[state=active]:bg-background data-[state=active]:shadow-sm"><AlertCircle className="h-4 w-4 mr-2"/>Alertas {alerts.length > 0 && <Badge className="ml-2 scale-75" variant="destructive">{alerts.length}</Badge>}</TabsTrigger>
         </TabsList>

         <TabsContent value="overview" className="mt-4 space-y-6">
           <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
             {/* Main Analytics Area (3/4) */}
             <div className="xl:col-span-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Entradas (Hoje)</p>
                      <p className="text-2xl font-black text-emerald-700">{kpis.entriesToday}</p>
                    </div>
                    <ArrowDownToLine className="h-8 w-8 text-emerald-500/20" />
                  </Card>
                  <Card className="p-4 bg-red-500/5 border-red-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Saídas (Hoje)</p>
                      <p className="text-2xl font-black text-red-700">{kpis.exitsToday}</p>
                    </div>
                    <ArrowUpFromLine className="h-8 w-8 text-red-500/20" />
                  </Card>
                  <Card className="p-4 bg-amber-500/5 border-amber-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Críticos</p>
                      <p className="text-2xl font-black text-amber-700">{kpis.critical}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-500/20" />
                  </Card>
                  <Card className="p-4 bg-primary/5 border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Atendimentos</p>
                      <p className="text-2xl font-black text-primary/80">{new Set(movements.filter(m => m.type === 'saida' && new Date(m.created_at) >= startOfDay(new Date())).map(m => m.os_id).filter(Boolean)).size}</p>
                    </div>
                    <Activity className="h-8 w-8 text-primary/20" />
                  </Card>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                        Entradas Recentes
                      </h3>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => setActiveTab("entradas")}>Ver Todas</Button>
                    </div>
                    <div className="space-y-4">
                      {movements.filter(m => m.type === 'entrada').slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{m.materials?.name}</span>
                            <span className="text-[10px] text-muted-foreground">NF: {m.invoice_number || '—'} · {m.to_wh?.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-600">+{Number(m.quantity)} {m.materials?.unit}</span>
                            <p className="text-[9px] text-muted-foreground">{format(new Date(m.created_at), "HH:mm")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
 
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ArrowUpFromLine className="h-4 w-4 text-red-500" />
                        Liberações p/ OS
                      </h3>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => setActiveTab("liberacao")}>Ver Todas</Button>
                    </div>
                    <div className="space-y-4">
                      {movements.filter(m => m.type === 'saida').slice(0, 5).map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{m.materials?.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {m.ordens_servico?.numero && <Badge variant="outline" className="text-[9px] h-4 font-mono">OS {m.ordens_servico.numero}</Badge>}
                              <span className="text-[10px] text-muted-foreground">{m.profiles?.nome}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-red-600">-{Number(m.quantity)} {m.materials?.unit}</span>
                            <p className="text-[9px] text-muted-foreground">{format(new Date(m.created_at), "HH:mm")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                 <Card className="p-6 border-none shadow-sm bg-card/50">
                   <div className="flex items-center justify-between mb-6">
                     <div>
                       <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Distribuição Patrimonial</h3>
                       <p className="text-[10px] text-muted-foreground">Valor por Categoria</p>
                     </div>
                     <TrendingUp className="h-4 w-4 text-primary" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                     <div className="h-[280px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie data={chartByCategory} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={5}>
                             {chartByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                           </Pie>
                           <Tooltip formatter={(v: any) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                           <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                         </PieChart>
                       </ResponsiveContainer>
                     </div>
                     <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm">
                         <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Ajustes & Perdas (Mês)</h4>
                         <p className="text-xl font-black text-destructive">{kpis.lossMonth.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>
                         <div className="mt-2 flex items-center text-[10px] text-destructive italic">
                           <AlertCircle className="h-3 w-3 mr-1" />
                           Quebras, extravios e ajustes manuais
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm">
                           <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Reservas</h4>
                           <p className="text-lg font-bold text-primary">{kpis.reservedActive}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-background border border-border/50 shadow-sm">
                           <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Depósitos</h4>
                           <p className="text-lg font-bold text-primary">{warehouses.length}</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 </Card>
             </div>

             {/* Sidebar Area: Activity & Status (The "Sides") */}
             <div className="space-y-6">
               <Card className="p-5 border-none shadow-sm bg-card/80">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-destructive">Reposição Crítica</h3>
                   <Badge variant="destructive" className="animate-pulse">{alerts.length}</Badge>
                 </div>
                 <div className="space-y-3">
                   {alerts.slice(0, 4).map((a) => (
                     <div key={a.id} className="group p-3 rounded-xl bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors">
                       <div className="flex items-start justify-between">
                         <div className="flex flex-col">
                           <div className="flex items-center gap-1.5 mb-1">
                             <AlertTriangle className="h-3 w-3 text-destructive" />
                             <span className="text-[9px] font-black uppercase tracking-tighter text-destructive">{a.type === 'ruptura' ? 'RUPTURA' : 'CRÍTICO'}</span>
                           </div>
                           <span className="text-xs font-bold leading-tight line-clamp-1">{a.materials?.name}</span>
                           <span className="text-[9px] text-muted-foreground mt-0.5">{a.warehouses?.name}</span>
                         </div>
                         <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => resolveAlert(a.id)}>
                           <ListChecks className="h-4 w-4 text-destructive"/>
                         </Button>
                       </div>
                     </div>
                   ))}
                   {alerts.length === 0 && (
                     <div className="text-center py-10">
                       <Activity className="h-8 w-8 text-emerald-500/20 mx-auto mb-2" />
                       <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Estoque OK</p>
                     </div>
                   )}
                 </div>
               </Card>

               <Card className="p-5 border-none shadow-sm bg-card/80 flex flex-col min-h-[400px]">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Feed de Operações</h3>
                   <History className="h-4 w-4 text-muted-foreground opacity-50" />
                 </div>
                 <div className="flex gap-1.5 mb-4">
                    <Select value={osFilter} onValueChange={setOsFilter}>
                      <SelectTrigger className="h-7 text-[9px] flex-1"><SelectValue placeholder="Obra" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Obras</SelectItem>
                        {allObras.map(o => <SelectItem key={o.id} value={o.id}>{o.numero}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                      <SelectTrigger className="h-7 text-[9px] flex-1"><SelectValue placeholder="Equipe" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Equipes</SelectItem>
                        {allEquipes.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-1">
                   {filteredMovements.slice(0, 10).map((m) => (
                     <div key={m.id} className="relative pl-4 border-l-2 pb-1 hover:bg-muted/30 transition-colors" style={{ borderLeftColor: m.type === 'entrada' ? '#10b981' : m.type === 'saida' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                       <div className="flex flex-col">
                         <div className="flex items-center justify-between">
                           <span className="text-[10px] font-bold uppercase">{TYPE_LABEL[m.type]}</span>
                           <span className="text-[9px] text-muted-foreground font-mono">{format(new Date(m.created_at), "HH:mm")}</span>
                         </div>
                         <span className="text-xs font-medium text-foreground line-clamp-1">{m.materials?.name}</span>
                         <span className="text-[9px] text-muted-foreground truncate">{m.creator?.nome}</span>
                       </div>
                     </div>
                   ))}
                 </div>
                 <Button variant="ghost" size="sm" className="w-full mt-4 text-[10px] font-bold uppercase" onClick={() => setActiveTab("movements")}>
                   Ver Histórico
                 </Button>
               </Card>
             </div>
           </div>
         </TabsContent>

        <TabsContent value="entradas" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/10">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Recebido Hoje</div>
              <div className="text-2xl font-black text-emerald-700">{summary.inToday.length}</div>
              <div className="text-[10px] text-emerald-600/70">Volumes processados</div>
            </Card>
            <Card className="p-4 bg-blue-500/5 border-blue-500/10">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Aguardando NF</div>
              <div className="text-2xl font-black text-blue-700">{movements.filter(m => m.type === "entrada" && !m.invoice_number).length}</div>
              <div className="text-[10px] text-blue-600/70">Entradas sem documento</div>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-bold">Entradas de Materiais</h3>
            </div>
            <Button onClick={() => openMovement("entrada")} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Registrar Novo Recebimento
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>NF/Fornecedor</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.filter(m => m.type === "entrada").map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{format(new Date(m.created_at), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{m.materials?.name}</div>
                      <div className="text-[10px] text-muted-foreground">{m.materials?.code}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 font-bold">+{Number(m.quantity)} {m.materials?.unit}</TableCell>
                    <TableCell className="text-xs">{m.to_wh?.name || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {m.invoice_number ? `NF: ${m.invoice_number}` : "—" }
                      {m.supplier && <div className="text-[10px] text-muted-foreground">{m.supplier}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{m.creator?.nome || "—"}</TableCell>
                  </TableRow>
                ))}
                {movements.filter(m => m.type === "entrada").length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma entrada registrada recentemente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="liberacao" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <Card className="p-4 bg-amber-500/5 border-amber-500/10">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pendentes de Liberação</div>
              <div className="text-2xl font-black text-amber-700">{waitingReleaseOS.length}</div>
              <div className="text-[10px] text-amber-600/70">Aguardando estoque</div>
            </Card>
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/10">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Liberado Hoje</div>
              <div className="text-2xl font-black text-emerald-700">{summary.outToday.length}</div>
              <div className="text-[10px] text-emerald-600/70">Saídas para campo</div>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold">Ordens Aguardando Material</h3>
            </div>
          </div>

          {waitingReleaseOS.length === 0 ? (
            <EmptyState title="Nenhuma OS pendente" description="Não há ordens de serviço aguardando liberação de estoque no momento." />
          ) : (
            <div className="grid gap-4">
              {waitingReleaseOS.map((o) => (
                <Card key={o.id} className="p-4 border-l-4 border-l-amber-500">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">OS {o.numero}</span>
                        <Badge variant="outline" className="text-[10px]">{o.prioridade || 'MÉDIA'}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm">{o.obra?.nome}</h4>
                      <div className="text-xs text-muted-foreground">Solicitado em {format(new Date(o.created_at), "dd/MM/yy HH:mm")}</div>
                      
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Materiais Planejados:</p>
                        <div className="flex flex-wrap gap-2">
                          {o.materials?.map((m: any) => (
                            <Badge key={m.id} variant="secondary" className="text-[10px] font-normal">
                              {m.materials?.name}: {m.quantity_planned} {m.materials?.unit}
                            </Badge>
                          ))}
                          {(!o.materials || o.materials.length === 0) && <span className="text-[10px] text-muted-foreground italic">Nenhum material listado</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => releaseMaterials(o.id)} className="bg-amber-600 hover:bg-amber-700">
                        Liberar Materiais
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/app/os/${o.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
                 {canWrite && <TableHead className="text-right">Ações</TableHead>}
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
                     {canWrite && (
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditMaterial(m); setNewMaterialOpen(true); }}>
                             <Edit2 className="h-3.5 w-3.5" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMaterial(m.id)}>
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                       </TableCell>
                     )}
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
               <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t relative">
                 <div><div className="text-[10px] text-muted-foreground uppercase">Itens</div><div className="font-bold">{w.items_count}</div></div>
                 <div><div className="text-[10px] text-muted-foreground uppercase">Valor</div><div className="font-bold text-xs">{w.total_value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</div></div>
                 {canWrite && (
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 text-destructive absolute right-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => { e.stopPropagation(); deleteWarehouse(w.id); }}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 )}
               </div>
             </Card>
            ))}
          </div>
        </TabsContent>

         <TabsContent value="movements" className="mt-4 space-y-4">
           <Card className="p-4 bg-muted/20 border-none shadow-none">
             <div className="flex flex-wrap gap-4 items-end">
               <div className="space-y-1.5 flex-1 min-w-[150px]">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground">Filtrar Tipo</Label>
                 <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                   <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os tipos</SelectItem>
                     {Object.entries(TYPE_LABEL).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5 flex-1 min-w-[150px]">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground">Filtrar Almoxarifado</Label>
                 <Select value={filters.warehouse} onValueChange={(v) => setFilters({ ...filters, warehouse: v })}>
                   <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os almoxarifados</SelectItem>
                     {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1.5 flex-1 min-w-[150px]">
                 <Label className="text-[10px] uppercase font-bold text-muted-foreground">Filtrar Material</Label>
                 <Select value={filters.material} onValueChange={(v) => setFilters({ ...filters, material: v })}>
                   <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os materiais</SelectItem>
                     {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => { setFilters({ type: 'all', warehouse: 'all', material: 'all' }); setOsFilter('all'); setEquipeFilter('all'); }} title="Limpar Filtros">
                 <X className="h-4 w-4" />
               </Button>
               <Button size="sm" variant="outline" className="h-9" onClick={exportMovementsToCSV}>
                 <Download className="h-4 w-4 mr-2" /> Exportar
               </Button>
             </div>
           </Card>
 
           <Card>
             <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Material</TableHead>
                <TableHead className="text-right">Qtd</TableHead><TableHead>Origem → Destino</TableHead>
                <TableHead>OS</TableHead><TableHead>Profissional</TableHead><TableHead>Por</TableHead>
              </TableRow></TableHeader>
               <TableBody>
                 {filteredMovements.map(m => (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                     <TableCell className="text-xs whitespace-nowrap py-3">{format(new Date(m.created_at),"dd/MM HH:mm",{locale:ptBR})}</TableCell>
                     <TableCell className="py-3"><Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TYPE_COLOR[m.type])}>{TYPE_LABEL[m.type]}</Badge></TableCell>
                     <TableCell className="py-3"><div className="font-bold text-xs">{m.materials?.name}</div><div className="text-[10px] text-muted-foreground font-mono">{m.materials?.code}</div></TableCell>
                     <TableCell className={cn("text-right font-mono font-bold py-3", m.type === 'entrada' ? 'text-emerald-600' : m.type === 'saida' ? 'text-red-600' : '')}>
                       {m.type === 'entrada' ? '+' : m.type === 'saida' ? '-' : ''}{Number(m.quantity)} {m.materials?.unit}
                     </TableCell>
                     <TableCell className="text-xs py-3">
                       <div className="flex flex-col gap-0.5">
                         {m.from_wh?.name && <span className="text-muted-foreground line-through decoration-muted-foreground/30">{m.from_wh.name}</span>}
                         {m.to_wh?.name && <span className="font-medium text-primary flex items-center gap-1"><ArrowDownToLine className="h-3 w-3" /> {m.to_wh.name}</span>}
                         {!m.to_wh?.name && m.from_wh?.name && <span className="font-medium text-destructive flex items-center gap-1"><ArrowUpFromLine className="h-3 w-3" /> {m.from_wh.name}</span>}
                       </div>
                     </TableCell>
                     <TableCell className="py-3">
                       {m.ordens_servico?.numero ? (
                         <Badge variant="secondary" className="font-mono text-[9px] bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-tighter">OS {m.ordens_servico.numero}</Badge>
                       ) : <span className="text-muted-foreground text-[10px]">—</span>}
                     </TableCell>
                     <TableCell className="text-xs font-medium py-3">{m.profiles?.nome || "—"}</TableCell>
                     <TableCell className="text-xs text-muted-foreground py-3 italic">{m.creator?.nome || "—"}</TableCell>
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

       <NewMaterialDialog 
         open={newMaterialOpen} 
         onOpenChange={(o) => { setNewMaterialOpen(o); if(!o) setEditMaterial(null); }} 
         onSuccess={loadMaterials} 
         material={editMaterial}
       />
      <StockMovementDialog open={movementOpen} onOpenChange={setMovementOpen} onSuccess={loadAll} defaultType={movementType as any}/>
      <WarehouseDialog open={warehouseOpen} onOpenChange={setWarehouseOpen} onSuccess={loadWarehouses} warehouse={editWarehouse}/>
    </div>
  );
}

 function Kpi({ icon: Icon, label, value, hint, tone }: any) {
   const toneClass = 
     tone === 'warn' ? "bg-amber-500/5" : 
     tone === 'success' ? "bg-emerald-500/5" : 
     tone === 'info' ? "bg-blue-500/5" : 
     "bg-primary/[0.03]";
     
   const iconClass = 
     tone === 'warn' ? "bg-amber-100 text-amber-600" : 
     tone === 'success' ? "bg-emerald-100 text-emerald-600" : 
     tone === 'info' ? "bg-blue-100 text-blue-600" : 
     "bg-primary/10 text-primary";
 
   return (
     <Card className={cn(
       "p-4 relative overflow-hidden transition-all hover:shadow-md border-none shadow-sm",
       toneClass
     )}>
      <div className="flex items-center justify-between relative z-10">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
         <div className={cn("p-1.5 rounded-lg", iconClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 relative z-10">
        <div className="text-2xl font-black tracking-tight">{value}</div>
        {hint && <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          {hint}
        </div>}
      </div>
      {/* Subtle background decoration */}
      <div className="absolute -right-2 -bottom-2 opacity-[0.05] pointer-events-none">
        <Icon size={64} />
      </div>
    </Card>
  );
}
