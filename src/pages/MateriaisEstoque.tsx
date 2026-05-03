 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/lib/auth";
 import PageHeader from "@/components/PageHeader";
 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Package, Truck, ArrowLeftRight, AlertTriangle, List, Plus, Search, FileText, History, Warehouse } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import NewMaterialDialog from "@/components/stock/NewMaterialDialog";
 import StockMovementDialog from "@/components/stock/StockMovementDialog";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";

 export default function MateriaisEstoque() {
   const { hasRole } = useAuth();
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
     totalItems: 0,
     lowStock: 0,
     reserved: 0,
     movementsToday: 0
   });
   const [materials, setMaterials] = useState<any[]>([]);
   const [movements, setMovements] = useState<any[]>([]);
   const [warehouses, setWarehouses] = useState<any[]>([]);
   const [searchTerm, setSearchTerm] = useState("");
   const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
   const [isMovementOpen, setIsMovementOpen] = useState(false);
   const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>();
 
   useEffect(() => {
     loadData();
   }, []);
 
   async function loadData() {
     setLoading(true);
     try {
       const [matsRes, movesRes, whRes] = await Promise.all([
         supabase.from('materials').select('*, material_categories(name), stock_levels(quantity, warehouse_id)'),
         supabase.from('stock_movements').select('*, materials(name, code), profiles(nome), warehouses!from_warehouse_id(name), warehouses!to_warehouse_id(name)').order('created_at', { ascending: false }).limit(50),
         supabase.from('warehouses').select('*').order('name')
       ]);
 
       if (matsRes.data) {
         const processedMats = matsRes.data.map(m => {
           const totalQty = (m.stock_levels as any[] || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
           return { ...m, total_quantity: totalQty };
         });
         setMaterials(processedMats);
         setStats(prev => ({
           ...prev,
           totalItems: processedMats.length,
           lowStock: processedMats.filter(m => m.total_quantity <= m.minimum_stock).length
         }));
       }
 
       if (movesRes.data) setMovements(movesRes.data);
       if (whRes.data) setWarehouses(whRes.data);
 
       // Stats de hoje
       const today = new Date();
       today.setHours(0,0,0,0);
       const { count } = await supabase.from('stock_movements').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
       setStats(prev => ({ ...prev, movementsToday: count || 0 }));
 
     } catch (err: any) {
       console.error("Erro ao carregar dados do estoque:", err);
     } finally {
       setLoading(false);
     }
   }

  return (
    <div className="space-y-6 pb-12">
       <PageHeader 
         title="Materiais e Estoque" 
         description="Controle total de almoxarifado, entradas, saídas e rastreabilidade."
         actions={
           <div className="flex gap-2">
             <Button size="sm" variant="outline" onClick={() => setIsMovementOpen(true)}>
               <ArrowLeftRight className="mr-2 h-4 w-4" /> Movimentar
             </Button>
             <Button size="sm" onClick={() => setIsNewMaterialOpen(true)}>
               <Plus className="mr-2 h-4 w-4" /> Novo Material
             </Button>
           </div>
         }
       />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Itens</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-2 bg-red-100 rounded-full text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Estoque Baixo</p>
            <p className="text-2xl font-bold">{stats.lowStock}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-full text-blue-600">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Reservados (OS)</p>
            <p className="text-2xl font-bold">{stats.reserved}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Mov. Hoje</p>
            <p className="text-2xl font-bold">{stats.movementsToday}</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="inventario" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="inventario">Inventário</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="reservas">Reservas (OS)</TabsTrigger>
          <TabsTrigger value="locais">Almoxarifados</TabsTrigger>
        </TabsList>

        <TabsContent value="inventario" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por código, nome ou categoria..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline"><List className="h-4 w-4 mr-2" /> Filtros</Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Cód.</th>
                    <th className="px-4 py-3 text-left font-medium">Material</th>
                    <th className="px-4 py-3 text-left font-medium">Categoria</th>
                    <th className="px-4 py-3 text-right font-medium">Qtd. Disponível</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b"><td colSpan={6} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                    ))
                  ) : (materials || []).length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhum material encontrado.</td></tr>
                  ) : (
                       materials.filter(m => 
                         (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (m.code || "").toLowerCase().includes(searchTerm.toLowerCase())
                       ).map((m) => (
                         <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                           <td className="px-4 py-3 font-mono text-xs">{m.code}</td>
                           <td className="px-4 py-3">
                             <div className="font-medium">{m.name}</div>
                             <div className="text-[10px] text-muted-foreground line-clamp-1">{m.description}</div>
                           </td>
                           <td className="px-4 py-3"><Badge variant="outline">{m.material_categories?.name}</Badge></td>
                           <td className="px-4 py-3 text-right font-semibold">{m.total_quantity} {m.unit}</td>
                           <td className="px-4 py-3">
                             {m.total_quantity <= m.critical_stock ? (
                               <Badge variant="destructive">Crítico</Badge>
                             ) : m.total_quantity <= m.minimum_stock ? (
                               <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Baixo</Badge>
                             ) : (
                               <Badge className="bg-green-500 hover:bg-green-600 text-white">OK</Badge>
                             )}
                           </td>
                           <td className="px-4 py-3 text-right">
                             <Button size="sm" variant="ghost" onClick={() => {
                               setSelectedMaterial(m.id);
                               setIsMovementOpen(true);
                             }} className="text-primary">Mover</Button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </Card>
           </TabsContent>
 
           <TabsContent value="movimentacoes" className="mt-4 space-y-4">
             <Card className="overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b bg-muted/50 text-muted-foreground">
                       <th className="px-4 py-3 text-left font-medium">Data</th>
                       <th className="px-4 py-3 text-left font-medium">Material</th>
                       <th className="px-4 py-3 text-left font-medium">Tipo</th>
                       <th className="px-4 py-3 text-right font-medium">Qtd</th>
                       <th className="px-4 py-3 text-left font-medium">Origem/Destino</th>
                       <th className="px-4 py-3 text-left font-medium">Responsável</th>
                     </tr>
                   </thead>
                   <tbody>
                     {movements.length === 0 ? (
                       <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhuma movimentação registrada.</td></tr>
                     ) : (
                       movements.map((move) => (
                         <tr key={move.id} className="border-b hover:bg-muted/30">
                           <td className="px-4 py-3 text-muted-foreground">
                             {format(new Date(move.created_at), "dd/MM HH:mm", { locale: ptBR })}
                           </td>
                           <td className="px-4 py-3 font-medium">
                             {move.materials?.code} - {move.materials?.name}
                           </td>
                           <td className="px-4 py-3">
                             <Badge variant={move.type === 'entrada' ? 'default' : move.type === 'saida' ? 'destructive' : 'outline'}>
                               {move.type.toUpperCase()}
                             </Badge>
                           </td>
                           <td className="px-4 py-3 text-right font-bold">{move.quantity}</td>
                           <td className="px-4 py-3 text-xs">
                             {move.from_warehouse_id && <span className="text-red-500">De: {move.warehouses_from_warehouse_id_fkey?.name || 'Local Antigo'}</span>}
                             {move.from_warehouse_id && move.to_warehouse_id && <br />}
                             {move.to_warehouse_id && <span className="text-green-500">Para: {move.warehouses_to_warehouse_id_fkey?.name || 'Local Novo'}</span>}
                             {move.os_id && <div className="mt-1 font-bold">OS #{move.os_id.substring(0,8)}</div>}
                           </td>
                           <td className="px-4 py-3 text-muted-foreground">{move.profiles?.nome}</td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </Card>
           </TabsContent>
 
           <TabsContent value="locais" className="mt-4 space-y-4">
             <div className="grid gap-4 md:grid-cols-3">
               {warehouses.map(w => (
                 <Card key={w.id} className="p-4 space-y-3">
                   <div className="flex justify-between items-start">
                     <div className="p-2 bg-accent rounded-lg"><Warehouse className="h-5 w-5" /></div>
                     {w.is_mobile && <Badge variant="secondary">Móvel</Badge>}
                   </div>
                   <div>
                     <h3 className="font-bold">{w.name}</h3>
                     <p className="text-xs text-muted-foreground">{w.location}</p>
                   </div>
                   <Button variant="outline" size="sm" className="w-full">Ver Inventário Local</Button>
                 </Card>
               ))}
               <Card className="p-4 border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                 <Plus className="h-8 w-8" />
                 <span className="text-sm font-medium">Novo Almoxarifado</span>
               </Card>
             </div>
           </TabsContent>
         </Tabs>
 
         <NewMaterialDialog 
           open={isNewMaterialOpen} 
           onOpenChange={setIsNewMaterialOpen} 
           onSuccess={loadData} 
         />
 
         <StockMovementDialog 
           open={isMovementOpen} 
           onOpenChange={(open) => {
             setIsMovementOpen(open);
             if (!open) setSelectedMaterial(undefined);
           }} 
           materialId={selectedMaterial}
           onSuccess={loadData} 
         />
       </div>
     );
   }
