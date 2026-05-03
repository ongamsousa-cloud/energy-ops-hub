 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, AreaChart, Area } from "recharts";
import { Users, Briefcase, Activity, AlertCircle, CheckCircle2, MapPin, Clock, Search, Filter, TrendingUp, Heart, ShieldAlert, BarChart3, Upload, History } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useAuth } from "@/lib/auth";

interface GestorDashboardProps {
  stats: any;
  byStatus: any[];
  umdHistory?: any[];
}

export default function GestorDashboard({ stats, byStatus, umdHistory = [] }: GestorDashboardProps) {
   const { hasRole } = useAuth();
   const isSupervisor = hasRole("supervisor") && !hasRole(["admin", "gestor"]);
   const isGestor = hasRole(["gestor", "admin"]);

  const chartConfig = {
    umd: {
      label: "UMD Aprovada",
      color: "hsl(var(--primary))",
    },
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
      {isGestor && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="bg-white dark:bg-background shadow-sm border-border hover:bg-muted/50">
            <Link to="/app/atividades/importar" className="flex items-center">
              <Upload className="mr-2 h-4 w-4 text-primary" />
              Importar Excel (Serviços/Atividades)
            </Link>
          </Button>
        </div>
      )}

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
                   <div className="text-sm font-medium text-blue-600">Em execução</div>
                   <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{stats.osAbertas || 0}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="text-sm font-medium text-orange-600">Aguardando validação</div>
                   <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{stats.osPend || 0}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="text-sm font-medium text-green-600">Aprovadas</div>
                   <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{stats.osAprov || 0}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="text-sm font-medium text-red-600">Reprovadas</div>
                   <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{stats.osRejeitadas || 0}</Badge>
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
                {(!stats.alertas || stats.alertas.length === 0) ? (
                  <div className="px-6 py-6 text-xs text-muted-foreground text-center">Nenhum alerta operacional aberto.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {stats.alertas.map((a: any) => (
                      <div key={a.id} className="px-6 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                        <div className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${a.severity === 'high' || a.severity === 'critical' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.description || new Date(a.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
         </div>
       )}


      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução de Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig}>
                <AreaChart data={umdHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUmdGestor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="umd" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUmdGestor)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Status das Operações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ChartContainer config={chartConfig}>
                <BarChart data={formattedStatusData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                   <YAxis 
                     dataKey="status" 
                     type="category" 
                     fontSize={11} 
                     axisLine={false} 
                     tickLine={false}
                     width={100}
                     tick={{ fill: 'hsl(var(--muted-foreground))' }}
                   />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="n" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24}
                    animationDuration={1500}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
