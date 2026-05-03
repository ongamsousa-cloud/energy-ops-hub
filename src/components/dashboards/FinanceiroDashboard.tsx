 import { Card } from "@/components/ui/card";
 import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
 import { Calculator, TrendingUp, DollarSign, FileCheck, Landmark, Receipt, Package, AlertCircle } from "lucide-react";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { CardContent } from "@/components/ui/card";
 
 interface FinanceiroDashboardProps {
   stats: any;
   umdHistory: any[];
 }
 
  export default function FinanceiroDashboard({ stats, umdHistory }: FinanceiroDashboardProps) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Central Financeira Operacional
            </h2>
            <p className="text-xs text-muted-foreground">Transformando execuções técnicas em resultados financeiros.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/medicao">
              <Button size="sm" variant="outline" className="h-9 gap-1.5 shadow-sm">
                <Receipt className="h-4 w-4" /> Medição
              </Button>
            </Link>
            <Link to="/app/financeiro/materiais">
              <Button size="sm" variant="outline" className="h-9 gap-1.5 shadow-sm">
                <Package className="h-4 w-4" /> Materiais
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 shadow-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calculator className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total a Faturar</span>
              </div>
              <span className="text-2xl font-bold">UMD {stats.umd.toLocaleString()}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Apenas OS aprovadas</p>
            </div>
          </Card>
          <Card className="p-4 shadow-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileCheck className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">OS Aprovadas</span>
              </div>
              <span className="text-2xl font-bold">{stats.osAprov}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Processadas este mês</p>
            </div>
          </Card>
          <Card className="p-4 shadow-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Média Diária</span>
              </div>
              <span className="text-2xl font-bold">{(stats.umd / 30).toFixed(1)}</span>
              <p className="text-[10px] text-muted-foreground mt-1">UMD / dia</p>
            </div>
          </Card>
          <Card className="p-4 shadow-none">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Previsão</span>
              </div>
              <span className="text-2xl font-bold">R$ {(stats.umd * 12.5).toLocaleString()}</span>
              <p className="text-[10px] text-muted-foreground mt-1">Valor estimado (UMD=12.50)</p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-4 border-none shadow-sm md:col-span-1">
            <h5 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              Pendências Financeiras
            </h5>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm">Aguardando Análise</span>
                <span className="font-bold">{stats.osPend || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm">Divergências</span>
                <span className="font-bold text-red-500">0</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm">Faturáveis</span>
                <span className="font-bold text-green-600">{stats.osAprov || 0}</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-[10px] uppercase h-8" asChild>
              <Link to="/app/financeiro/ordens">Ver todas as OS</Link>
            </Button>
          </Card>

          <Card className="md:col-span-2 border-none shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Histórico de Medição (UMD)
              </h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={umdHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFinanceiro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={11} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={11} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="umd" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorFinanceiro)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }