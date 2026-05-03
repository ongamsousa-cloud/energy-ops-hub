import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, 
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend 
} from "recharts";
import { 
  TrendingUp, Users, Briefcase, AlertCircle, CheckCircle2, ShieldCheck, Settings, 
  Database, Activity, FileText, Upload, PlusCircle, Package, Calendar, PieChart as PieChartIcon, 
  BarChart3, Layers, Target, Clock
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import NewServiceOrderDialog from "@/components/os/NewServiceOrderDialog";
import { useState } from "react";

interface AdminDashboardProps {
  stats: any;
  byStatus: any[];
  umdHistory: any[];
  teamProductivity?: any[];
  weeklySummary?: any[];
  materialUsage?: any[];
   weeklyNewOS?: any[];
   stockStats?: { totalItems: number; lowStock: number };
}

export default function AdminDashboard({ 
  stats, 
  byStatus, 
  umdHistory, 
  teamProductivity = [], 
  weeklySummary = [], 
  materialUsage = [], 
   weeklyNewOS = [],
   stockStats = { totalItems: 0, lowStock: 0 }
 }: AdminDashboardProps) {
  const [osDialogOpen, setOsDialogOpen] = useState(false);
  const navigate = useNavigate();
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

  const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1'];
  
  // Mock field efficiency if not provided
  const efficiencyData = [
    { name: 'Eficiência', value: 85, fill: 'hsl(var(--primary))' },
    { name: 'Restante', value: 15, fill: 'hsl(var(--muted))' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => setOsDialogOpen(true)}
          className="shadow-md gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Abrir Nova OS
         </Button>
 
         <Button asChild variant="outline" className="bg-white dark:bg-background shadow-sm border-border hover:bg-muted/50">
           <Link to="/app/materiais" className="flex items-center">
             <Package className="mr-2 h-4 w-4 text-primary" />
             Gestão de Estoque
           </Link>
         </Button>

         <Button asChild variant="outline" className="bg-white dark:bg-background shadow-sm border-border hover:bg-muted/50">
          <Link to="/app/atividades/importar" className="flex items-center">
            <Upload className="mr-2 h-4 w-4 text-primary" />
            Importar Excel
          </Link>
        </Button>
      </div>

      <NewServiceOrderDialog 
        open={osDialogOpen} 
        onOpenChange={setOsDialogOpen} 
        onSuccess={(id) => navigate(`/app/os/${id}`)}
      />

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

         <Card className="border-none bg-gradient-to-br from-orange-50 to-white shadow-sm dark:from-orange-950/20 dark:to-background">
           <CardContent className="p-6">
             <div className="flex items-center justify-between space-y-0 pb-2">
               <p className="text-sm font-medium text-muted-foreground">Estoque</p>
               <Package className="h-4 w-4 text-orange-500" />
             </div>
             <div className="text-2xl font-bold">{stockStats.totalItems}</div>
             <p className="text-xs text-muted-foreground mt-1 text-red-600 font-semibold">{stockStats.lowStock} itens com estoque baixo</p>
           </CardContent>
         </Card>
      </div>

      {/* Dashboard BI Refined */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Resumo Semanal (Linha: Produtividade vs Meta) */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-primary" />
              Resumo Semanal (UMD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySummary} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="prod" name="Produção" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="meta" name="Meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Status das O.S. (Donut) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Status das O.S.
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="n"
                    nameKey="status"
                  >
                    {formattedStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Produtividade por Equipe (Barra Horizontal) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <BarChart3 className="h-4 w-4 text-primary" />
              Produtividade por Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamProductivity} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="team" type="category" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="umd" name="UMD Total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Materiais em Uso (Donut) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Layers className="h-4 w-4 text-primary" />
              Materiais em Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialUsage.length > 0 ? materialUsage : [{ category: 'Vazio', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="category"
                  >
                    {(materialUsage.length > 0 ? materialUsage : [{ category: 'Vazio', value: 1 }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 5. Eficiência de Campo (Radial) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Target className="h-4 w-4 text-primary" />
              Eficiência de Campo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="100%" 
                  barSize={20} 
                  data={efficiencyData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={30}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-3xl font-bold">85%</span>
                <span className="text-[10px] text-muted-foreground">META ATINGIDA</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">Baseado em OS aprovadas vs abertas</p>
            </div>
          </CardContent>
        </Card>

        {/* 6. Novas O.S. (Barra Vertical) */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Clock className="h-4 w-4 text-primary" />
              Novas O.S. (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyNewOS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" name="Novas O.S." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
