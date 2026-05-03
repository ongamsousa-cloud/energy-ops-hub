import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, ArrowLeftRight, AlertTriangle, List, Plus, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // @ts-ignore - Ignore temporary type mismatch until Supabase types refresh
      const { data: mats, error } = await supabase.from('materials').select('*').limit(20);
      if (error) {
        console.warn("Materials table might not be fully ready yet:", error);
        setMaterials([]);
      } else {
        setMaterials(mats || []);
        setStats({
          totalItems: (mats || []).length,
          lowStock: (mats || []).filter((m: any) => (m.quantity_available || 0) <= (m.minimum_stock || 0)).length,
          reserved: 0,
          movementsToday: 0
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar materiais:", err);
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
            <Button size="sm" variant="outline"><FileText className="mr-2 h-4 w-4" /> Relatórios</Button>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Material</Button>
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
                        <td className="px-4 py-3 font-medium">{m.name}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{m.category}</Badge></td>
                        <td className="px-4 py-3 text-right font-semibold">{m.quantity_available || 0} {m.unit}</td>
                        <td className="px-4 py-3">
                          {(m.quantity_available || 0) <= (m.critical_stock || 0) ? (
                            <Badge variant="destructive">Crítico</Badge>
                          ) : (m.quantity_available || 0) <= (m.minimum_stock || 0) ? (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Baixo</Badge>
                          ) : (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">OK</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost">Ver</Button>
                          <Button size="sm" variant="ghost" className="text-primary">Mover</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
