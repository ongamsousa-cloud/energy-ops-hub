import { Card } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, XCircle, Clock, CheckCircle2, History } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface AuditorDashboardProps {
  stats: any;
  auditHistory?: any[];
}

export default function AuditorDashboard({ stats, auditHistory = [] }: AuditorDashboardProps) {
  const totalAprov = stats.osAprov || 0;
  const totalReprov = stats.osRejeitadas || 0;
  const total = totalAprov + totalReprov || 1;
  const taxaAprov = (totalAprov / (totalAprov + totalReprov || 1)) * 100;

  const barData = [{ name: "Qualidade", aprov: totalAprov, reprov: totalReprov }];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-none">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">Taxa de Aprovação</span>
          <div className="text-2xl font-bold text-green-600 mt-1">{Math.round(taxaAprov)}%</div>
          <p className="text-[10px] text-muted-foreground mt-1">Histórico geral</p>
        </Card>
        <Card className="p-4 shadow-none">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">Aguardando Revisão</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">{stats.osPend}</div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Fila de auditoria
          </div>
        </Card>
        <Card className="p-4 shadow-none">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">Total Analisado</span>
          <div className="text-2xl font-bold mt-1">{totalAprov + totalReprov}</div>
          <p className="text-[10px] text-muted-foreground mt-1">OS revisadas</p>
        </Card>
        <Card className="p-4 shadow-none">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">Casos Críticos</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.auditCriticos ?? 0}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Achados de alta severidade</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 border-none shadow-sm">
          <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Qualidade Acumulada
          </h4>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -40, right: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="aprov" name="Aprovadas" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} barSize={40} animationDuration={1500} />
                <Bar dataKey="reprov" name="Reprovadas" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={40} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Aprovadas ({totalAprov})</div>
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Reprovadas ({totalReprov})</div>
          </div>
        </Card>

        <Card className="p-4 shadow-none">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Últimas Atividades de Auditoria</h4>
          </div>
          {auditHistory.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">Nenhuma atividade registrada.</div>
          ) : (
            <div className="space-y-4">
              {auditHistory.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border pb-3 last:border-0">
                  <div className="mt-0.5">
                    {log.status_novo === "aprovada" ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {log.profile?.nome || "Usuário"} alterou{" "}
                      <Link to={`/app/os/${log.os_id}`} className="text-primary hover:underline">
                        OS {log.ordens_servico?.numero}
                      </Link>{" "}
                      para {log.status_novo}
                    </div>
                    <div className="text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString("pt-BR")}</div>
                    {log.comentario && <div className="mt-1 p-2 bg-muted/50 rounded italic">"{log.comentario}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
