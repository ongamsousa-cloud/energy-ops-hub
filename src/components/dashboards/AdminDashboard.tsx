import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Users, Briefcase, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
 
 interface AdminDashboardProps {
   stats: any;
   byStatus: any[];
   umdHistory: any[];
 }
 
export default function AdminDashboard({ stats, byStatus, umdHistory }: AdminDashboardProps) {
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-blue-50 to-white shadow-sm dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Obras</p>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.obras}</div>
            <p className="text-xs text-muted-foreground mt-1">Crescimento de +2% este mês</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:from-emerald-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">UMD Acumulada</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{stats.umd.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtividade em alta</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-purple-50 to-white shadow-sm dark:from-purple-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Equipes</p>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.equipes}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.profs} profissionais ativos</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-amber-50 to-white shadow-sm dark:from-amber-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">OS Pendentes</p>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">{stats.osPend}</div>
            <p className="text-xs text-muted-foreground mt-1">Necessitam atenção</p>
          </CardContent>
        </Card>
      </div>

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
                    <linearGradient id="colorUmd" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorUmd)" 
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
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    width={120}
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
   return (
     <div className="space-y-6">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card className="p-4 shadow-none">
           <div className="flex items-center gap-3">
             <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/20">
               <Briefcase className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-medium uppercase text-muted-foreground">Total de Obras</p>
               <h3 className="text-2xl font-bold">{stats.obras}</h3>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex items-center gap-3">
             <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/20">
               <TrendingUp className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-medium uppercase text-muted-foreground">UMD Acumulada</p>
               <h3 className="text-2xl font-bold">{stats.umd.toLocaleString()}</h3>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex items-center gap-3">
             <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/20">
               <Users className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-medium uppercase text-muted-foreground">Profissionais</p>
               <h3 className="text-2xl font-bold">{stats.profs}</h3>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex items-center gap-3">
             <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/20">
               <AlertCircle className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[11px] font-medium uppercase text-muted-foreground">OS Pendentes</p>
               <h3 className="text-2xl font-bold">{stats.osPend}</h3>
             </div>
           </div>
         </Card>
       </div>
 
       <div className="grid gap-6 lg:grid-cols-2">
         <Card className="p-4 shadow-none">
           <div className="mb-4 flex items-center justify-between">
             <h4 className="text-sm font-semibold">Desempenho Financeiro (UMD)</h4>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={umdHistory}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                 <XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} />
                 <YAxis fontSize={11} axisLine={false} tickLine={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                 />
                 <Line type="monotone" dataKey="umd" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
         </Card>
 
         <Card className="p-4 shadow-none">
           <div className="mb-4 flex items-center justify-between">
             <h4 className="text-sm font-semibold">Distribuição de Status de OS</h4>
             <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={byStatus} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="status" type="category" fontSize={11} axisLine={false} tickLine={false} width={100} />
                 <Tooltip 
                   cursor={{ fill: "hsl(var(--accent)/0.5)" }}
                   contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                 />
                 <Bar dataKey="n" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </Card>
       </div>
     </div>
   );
 }