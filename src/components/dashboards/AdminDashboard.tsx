import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
 import { TrendingUp, Users, Briefcase, AlertCircle, CheckCircle2, ShieldCheck, Settings, Database, Activity, FileText, Upload } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AdminDashboardProps {
  stats: any;
  byStatus: any[];
  umdHistory: any[];
}

export default function AdminDashboard({ stats, byStatus, umdHistory }: AdminDashboardProps) {
  const variacao = stats.umdAnterior > 0 ? ((stats.umdAtual - stats.umdAnterior) / stats.umdAnterior) * 100 : null;
  const variacaoLabel = variacao === null ? "Sem comparativo do período anterior" : `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}% vs 30 dias anteriores`;
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
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="bg-white dark:bg-background shadow-sm border-border hover:bg-muted/50">
          <Link to="/app/atividades/importar" className="flex items-center">
            <Upload className="mr-2 h-4 w-4 text-primary" />
            Importar Excel (Serviços/Atividades)
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-blue-50 to-white shadow-sm dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Obras</p>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.obras}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.obrasExec} em execução</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:from-emerald-950/20 dark:to-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">UMD Acumulada</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">{stats.umd.toLocaleString()}</div>
            <p className={`text-xs mt-1 ${variacao !== null && variacao < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{variacaoLabel}</p>
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
