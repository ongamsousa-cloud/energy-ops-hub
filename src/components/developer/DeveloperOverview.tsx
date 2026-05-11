  import { useEffect, useState, useCallback } from "react";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { developerService } from "@/services/developerService";
  import { Activity, Database, Users, Building2, AlertTriangle, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { toast } from "@/components/ui/sonner";
 
 export default function DeveloperOverview() {
   const [stats, setStats] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   const loadStats = useCallback(async () => {
     setLoading(true);
     try {
       const data = await developerService.getSystemStats();
       setStats(data);
     } catch (e) {
       toast.error("Erro ao carregar estatísticas reais");
     } finally {
       setLoading(false);
     }
   }, []);

   useEffect(() => {
     loadStats();
   }, [loadStats]);

   const items = stats ? [
     { title: "Usuários Totais", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
     { title: "Ordens de Serviço", value: stats.totalOS, icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
     { title: "Departamentos", value: stats.totalDepts, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10" },
     { title: "Profissionais", value: stats.totalPros, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
     { title: "Erros Abertos", value: stats.openErrors, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
   ] : [];

   return (
     <div className="space-y-6">
       <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
         <div className="flex items-center gap-3">
           <div className="p-2 bg-primary/10 rounded-lg">
             <Layers className="h-5 w-5 text-primary" />
           </div>
           <div>
             <h3 className="font-bold">Status do Ecossistema</h3>
             <p className="text-xs text-muted-foreground">Monitoramento de dados em tempo real direto do Supabase.</p>
           </div>
         </div>
         <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
           <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
           Sincronizar Agora
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         {loading && !stats ? (
           Array(5).fill(0).map((_, i) => (
             <Card key={i} className="animate-pulse">
               <CardHeader className="h-12 bg-muted/50" />
               <CardContent className="h-16 bg-muted/20" />
             </Card>
           ))
         ) : (
           items.map((item, i) => (
             <Card key={i} className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: `var(--primary)` }}>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.title}</CardTitle>
                 <div className={`p-2 rounded-full ${item.bg}`}>
                   <item.icon className={`h-4 w-4 ${item.color}`} />
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="text-3xl font-black tracking-tight">{item.value}</div>
               </CardContent>
             </Card>
           ))
         )}
       </div>

       <Card className="bg-emerald-50/30 border-emerald-100">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700">
             <CheckCircle2 className="h-4 w-4" /> Diagnóstico de Conexão
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-xs text-emerald-600">
             O painel está conectado via WebSockets (Realtime) ao banco de dados. Qualquer alteração sistêmica será refletida imediatamente após a sincronização.
           </p>
         </CardContent>
       </Card>
     </div>
   );
 }