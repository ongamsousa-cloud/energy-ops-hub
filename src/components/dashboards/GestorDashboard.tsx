import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { Users, Briefcase, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
 
 interface GestorDashboardProps {
   stats: any;
   byStatus: any[];
 }
 
export default function GestorDashboard({ stats, byStatus }: GestorDashboardProps) {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Produtividade Total</p>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.umd.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">UMD produzida no período</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Equipes Ativas</p>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.equipes}</div>
            <p className="text-xs text-muted-foreground mt-1">Operando hoje</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Obras em Execução</p>
              <Briefcase className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{stats.obrasExec}</div>
            <p className="text-xs text-muted-foreground mt-1">Frentes de trabalho</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">OS Críticas</p>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.osRejeitadas}</div>
            <p className="text-xs text-muted-foreground mt-1">Necessitam correção</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Status Operacional das Ordens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ChartContainer config={chartConfig}>
              <BarChart data={byStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="status" 
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
                <Bar 
                  dataKey="n" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                >
                  {byStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={statusColors[entry.status.toLowerCase()] || "hsl(var(--primary))"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
   return (
     <div className="space-y-6">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <Activity className="h-4 w-4" />
               <span className="text-[11px] font-bold uppercase tracking-wider">Produtividade Total</span>
             </div>
             <span className="text-2xl font-bold">{stats.umd.toLocaleString()}</span>
             <p className="text-[10px] text-muted-foreground mt-1">UMD total produzida</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <Users className="h-4 w-4" />
               <span className="text-[11px] font-bold uppercase tracking-wider">Equipes Ativas</span>
             </div>
             <span className="text-2xl font-bold">{stats.equipes}</span>
             <p className="text-[10px] text-muted-foreground mt-1">Em campo hoje</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <div className="flex items-center gap-2 text-muted-foreground mb-1">
               <Briefcase className="h-4 w-4" />
               <span className="text-[11px] font-bold uppercase tracking-wider">Obras em Execução</span>
             </div>
             <span className="text-2xl font-bold">{stats.obrasExec}</span>
             <p className="text-[10px] text-muted-foreground mt-1">Frentes de trabalho</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <div className="flex items-center gap-2 text-red-500 mb-1">
               <AlertCircle className="h-4 w-4" />
               <span className="text-[11px] font-bold uppercase tracking-wider">OS Críticas</span>
             </div>
             <span className="text-2xl font-bold text-red-600">{stats.osRejeitadas}</span>
             <p className="text-[10px] text-muted-foreground mt-1">Reprovadas / A corrigir</p>
           </div>
         </Card>
       </div>
 
       <Card className="p-4 shadow-none">
         <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">Status Operacional das Ordens</h4>
         <div className="h-72">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={byStatus}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
               <XAxis dataKey="status" fontSize={11} axisLine={false} tickLine={false} />
               <YAxis fontSize={11} axisLine={false} tickLine={false} />
               <Tooltip 
                 cursor={{ fill: "hsl(var(--accent)/0.5)" }}
                 contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
               />
               <Bar dataKey="n" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </Card>
     </div>
   );
 }