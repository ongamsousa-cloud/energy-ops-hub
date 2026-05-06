import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { Users, Briefcase, Activity, AlertCircle, CheckCircle2, Clock, Search, TrendingUp, Upload } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodFilter, { Period, presetPeriod } from "@/components/PeriodFilter";
import OSDrillDownSheet from "@/components/dashboard/OSDrillDownSheet";
import OSDashboardTab from "@/components/dashboard/OSDashboardTab";
import { supabase } from "@/integrations/supabase/client";

interface GestorDashboardProps {
  stats: any;
  byStatus: any[];
  umdHistory?: any[];
}

export default function GestorDashboard({ stats, byStatus, umdHistory = [] }: GestorDashboardProps) {
  const { hasRole } = useAuth();
  const isSupervisor = hasRole("supervisor") && !hasRole(["admin", "gestor"]);
  const isGestor = hasRole(["gestor", "admin"]);
  const [period, setPeriod] = useState<Period>(presetPeriod(30));
  const [drill, setDrill] = useState<{ open: boolean; status: string | null }>({ open: false, status: null });
  const [periodHistory, setPeriodHistory] = useState<{ date: string; umd: number }[]>([]);
  const [periodStatus, setPeriodStatus] = useState<{ status: string; n: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [hist, stat] = await Promise.all([
        supabase
          .from("ordens_servico")
          .select("fim_em, total_umd_aprovada")
          .eq("status", "aprovada")
          .gte("fim_em", period.start.toISOString())
          .lte("fim_em", period.end.toISOString())
          .order("fim_em"),
        supabase
          .from("ordens_servico")
          .select("operational_status, status")
          .gte("created_at", period.start.toISOString())
          .lte("created_at", period.end.toISOString()),
      ]);
      const h: Record<string, number> = {};
      (hist.data ?? []).forEach((r: any) => {
        if (!r.fim_em) return;
        const d = new Date(r.fim_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
        h[d] = (h[d] ?? 0) + Number(r.total_umd_aprovada || 0);
      });
      setPeriodHistory(Object.entries(h).map(([date, umd]) => ({ date, umd })));
      const s: Record<string, number> = {};
      (stat.data ?? []).forEach((r: any) => {
        const status = r.operational_status || r.status;
        s[status] = (s[status] ?? 0) + 1;
      });
      setPeriodStatus(Object.entries(s).map(([status, n]) => ({ status: status.replace(/_/g, " "), n })));
    })();
  }, [period.start, period.end]);

  const chartConfig = {
    umd: { label: "UMD Aprovada", color: "hsl(var(--primary))" },
    n: { label: "Quantidade", color: "hsl(var(--primary))" },
  };

  const statusColors: Record<string, string> = {
    aprovada: "hsl(var(--success))",
    reprovada: "hsl(var(--destructive))",
    "aguardando_aprovacao_departamento": "hsl(var(--warning))",
    "aguardando_liberacao_estoque": "hsl(var(--orange-500))",
    "material_reservado": "hsl(var(--amber-400))",
    "material_liberado": "hsl(var(--blue-400))",
    "aguardando_validacao_supervisor": "hsl(var(--warning))",
    corrigida: "hsl(var(--primary))",
    aberta: "hsl(var(--muted-foreground))",
  };
  const formattedStatusData = (periodStatus.length ? periodStatus : byStatus).map((item) => ({
    ...item,
    fill: statusColors[item.status.toLowerCase()] || "hsl(var(--primary))",
  }));
  const histData = periodHistory.length ? periodHistory : umdHistory;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="os">Ordens de Serviço</TabsTrigger>
        </TabsList>

        <TabsContent value="os" className="mt-4">
          <OSDashboardTab period={period} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {isGestor && (
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <Button asChild variant="outline" size="sm">
                <Link to="/app/atividades/importar" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4 text-primary" />
                  Importar Excel (Serviços/Atividades)
                </Link>
              </Button>
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          )}

          {isSupervisor && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Central do Supervisor</h2>
              <div className="flex gap-2">
                <Link to="/app/os">
                  <Button size="sm" variant="outline">
                    <Search className="mr-1 h-3.5 w-3.5" /> Monitorar Equipe
                  </Button>
                </Link>
                <Link to="/app/aprovacoes">
                  <Button size="sm">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Validar OS
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/app/relatorios">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Produtividade Total</p>
                    <Activity className="h-4 w-4 text-info" />
                  </div>
                  <div className="text-2xl font-bold">{stats.umd.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">UMD produzida no período</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/app/equipes">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Equipes Ativas</p>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stats.equipes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Operando hoje</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/app/obras">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Obras em Execução</p>
                    <Briefcase className="h-4 w-4 text-success" />
                  </div>
                  <div className="text-2xl font-bold">{stats.obrasExec}</div>
                  <p className="text-xs text-muted-foreground mt-1">Frentes de trabalho</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/app/aprovacoes">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-sm font-medium text-muted-foreground">OS Críticas</p>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="text-2xl font-bold text-destructive">{stats.osRejeitadas}</div>
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
                    <Clock className="h-4 w-4 text-warning" />
                    Status das Equipes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Row label="Em execução" v={stats.osAbertas || 0} cls="text-info" />
                  <Row label="Aguardando validação" v={stats.osPend || 0} cls="text-warning" />
                  <Row label="Aprovadas" v={stats.osAprov || 0} cls="text-success" />
                  <Row label="Reprovadas" v={stats.osRejeitadas || 0} cls="text-destructive" />
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Alertas Operacionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!stats.alertas || stats.alertas.length === 0 ? (
                    <div className="px-6 py-6 text-xs text-muted-foreground text-center">Nenhum alerta operacional aberto.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {stats.alertas.map((a: any) => (
                        <div key={a.id} className="px-6 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                          <div className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${a.severity === "high" || a.severity === "critical" ? "bg-destructive" : a.severity === "medium" ? "bg-warning" : "bg-warning/60"}`} />
                          <div>
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.description || new Date(a.created_at).toLocaleString("pt-BR")}</p>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Evolução de Produtividade
                  </CardTitle>
                  {!isGestor && <PeriodFilter value={period} onChange={setPeriod} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ChartContainer config={chartConfig}>
                    <AreaChart data={histData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUmdGestor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={12} axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="umd" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorUmdGestor)" animationDuration={1500} />
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
                      <YAxis dataKey="status" type="category" fontSize={11} axisLine={false} tickLine={false} width={110} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="n"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        animationDuration={1500}
                        cursor="pointer"
                        onClick={(data: any) => setDrill({ open: true, status: data?.status ?? null })}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">Clique em uma barra para ver as OS</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <OSDrillDownSheet
        open={drill.open}
        onOpenChange={(o) => setDrill({ ...drill, open: o })}
        status={drill.status}
        start={period.start}
        end={period.end}
      />
    </div>
  );
}

function Row({ label, v, cls }: { label: string; v: number; cls: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className={`text-sm font-medium ${cls}`}>{label}</div>
      <Badge variant="secondary">{v}</Badge>
    </div>
  );
}
