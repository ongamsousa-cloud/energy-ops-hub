 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, AreaChart, Area } from "recharts";
 import { Users, Briefcase, Activity, AlertCircle, CheckCircle2, MapPin, Clock, Search, Filter } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useAuth } from "@/lib/auth";

interface GestorDashboardProps {
  stats: any;
  byStatus: any[];
}

export default function GestorDashboard({ stats, byStatus }: GestorDashboardProps) {
   const { hasRole } = useAuth();
   const isSupervisor = hasRole("supervisor") && !hasRole("admin");

  const chartConfig = {
    n: {
      label: "Quantidade",
      color: "hsl(var(--primary))",
    },
  };

   const statusColors: Record<string, string> = {
     "aprovada": "#10b981",
     "reprovada": "#ef4444",
     "aguardando revisao": "#f59e0b",
     "em revisao": "#3b82f6",
     "corrigida": "#8b5cf6",
     "aberta": "#6b7280",
   };

   const formattedStatusData = byStatus.map(item => ({
     ...item,
     fill: statusColors[item.status.toLowerCase()] || "hsl(var(--primary))"
   }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
       {isSupervisor && (
         <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold tracking-tight">Central do Supervisor</h2>
           <div className="flex gap-2">
             <Link to="/app/os">
               <Button size="sm" variant="outline"><Search className="mr-1 h-3.5 w-3.5"/> Monitorar Equipe</Button>
             </Link>
             <Link to="/app/aprovacoes">
               <Button size="sm"><CheckCircle2 className="mr-1 h-3.5 w-3.5"/> Validar OS</Button>
             </Link>
           </div>
         </div>
       )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Link to="/app/relatorios">
           <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="p-6">
               <div className="flex items-center justify-between space-y-0 pb-2">
                 <p className="text-sm font-medium text-muted-foreground">Produtividade Total</p>
                 <Activity className="h-4 w-4 text-blue-500" />
               </div>
               <div className="text-2xl font-bold">{stats.umd.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground mt-1">UMD produzida no período</p>
             </CardContent>
           </Card>
         </Link>

         <Link to="/app/equipes">
           <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="p-6">
               <div className="flex items-center justify-between space-y-0 pb-2">
                 <p className="text-sm font-medium text-muted-foreground">Equipes Ativas</p>
                 <Users className="h-4 w-4 text-purple-500" />
               </div>
               <div className="text-2xl font-bold">{stats.equipes}</div>
               <p className="text-xs text-muted-foreground mt-1">Operando hoje</p>
             </CardContent>
           </Card>
         </Link>

         <Link to="/app/obras">
           <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="p-6">
               <div className="flex items-center justify-between space-y-0 pb-2">
                 <p className="text-sm font-medium text-muted-foreground">Obras em Execução</p>
                 <Briefcase className="h-4 w-4 text-emerald-500" />
               </div>
               <div className="text-2xl font-bold">{stats.obrasExec}</div>
               <p className="text-xs text-muted-foreground mt-1">Frentes de trabalho</p>
             </CardContent>
           </Card>
         </Link>

         <Link to="/app/aprovacoes">
           <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
             <CardContent className="p-6">
               <div className="flex items-center justify-between space-y-0 pb-2">
                 <p className="text-sm font-medium text-muted-foreground">OS Críticas</p>
                 <AlertCircle className="h-4 w-4 text-red-500" />
               </div>
               <div className="text-2xl font-bold text-red-600">{stats.osRejeitadas}</div>
               <p className="text-xs text-muted-foreground mt-1">Necessitam correção</p>
             </CardContent>
           </Card>
         </Link>
      </div>

       {isSupervisor && (
         <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Status das Equipes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Em deslocamento</div>
                  <Badge variant="secondary">{stats.osAbertas || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">Em execução</div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{stats.osPend || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-orange-600">Aguardando validação</div>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{stats.osPend || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-green-600">Concluídas hoje</div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{stats.osAprov || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Alertas Operacionais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="px-6 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">OS atrasada há mais de 24h</p>
                      <p className="text-xs text-muted-foreground">OS #10293 aguardando início por Equipe Norte</p>
                    </div>
                  </div>
                  <div className="px-6 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Execução sem evidência obrigatória</p>
                      <p className="text-xs text-muted-foreground">Técnico enviou OS #10442 sem foto do ponto final</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
         </div>
       )}

       <Card className="border-none shadow-sm">
         <CardHeader>
           <CardTitle className="text-base font-semibold flex items-center gap-2">
             <CheckCircle2 className="h-4 w-4 text-primary" />
             Status Operacional das Ordens
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="h-[300px] w-full">
             <ChartContainer config={chartConfig}>
               <BarChart data={formattedStatusData} layout="vertical" margin={{ left: -20, right: 20 }}>
                 <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis type="number" hide />
                 <YAxis 
                   dataKey="status" 
                   type="category" 
                   fontSize={11} 
                   axisLine={false} 
                   tickLine={false}
                   width={120}
                   tick={{ fill: 'hsl(var(--muted-foreground))' }}
                 />
                 <ChartTooltip content={<ChartTooltipContent />} />
                 <Bar 
                   dataKey="n" 
                   radius={[0, 4, 4, 0]} 
                   barSize={20}
                   animationDuration={1500}
                 />
               </BarChart>
             </ChartContainer>
           </div>
         </CardContent>
       </Card>
    </div>
  );
}
