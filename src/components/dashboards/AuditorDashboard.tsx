 import { Card } from "@/components/ui/card";
 import { ShieldCheck, AlertCircle, XCircle, Clock, CheckCircle2, History, ClipboardList, MapPin, DollarSign, Filter, Search } from "lucide-react";
 import { Link } from "react-router-dom";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
 
 interface AuditorDashboardProps {
   stats: any;
 }
 
 export default function AuditorDashboard({ stats, auditHistory = [] }: AuditorDashboardProps & { auditHistory?: any[] }) {
         {auditHistory.length > 0 && (
           <Card className="p-4 shadow-none">
             <div className="flex items-center gap-2 mb-4">
               <History className="h-4 w-4 text-muted-foreground" />
               <h4 className="text-sm font-semibold">Últimas Atividades de Auditoria</h4>
             </div>
             <div className="space-y-4">
               {auditHistory.map((log) => (
                 <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border pb-3 last:border-0">
                   <div className="mt-0.5">
                     {log.status_novo === 'aprovada' ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                   </div>
                   <div className="flex-1">
                     <div className="font-medium">
                       {log.profile?.nome} alterou <Link to={`/app/os/${log.os_id}`} className="text-primary hover:underline">OS {log.ordens_servico?.numero}</Link> para {log.status_novo}
                     </div>
                     <div className="text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                     {log.comentario && <div className="mt-1 p-2 bg-muted/50 rounded italic">"{log.comentario}"</div>}
                   </div>
                 </div>
               ))}
             </div>
           </Card>
         )}
 
   const totalAprov = stats.osAprov || 0;
   const totalReprov = stats.osRejeitadas || 0;
   const total = totalAprov + totalReprov || 1;
   const taxaAprov = (totalAprov / total) * 100;
 
   const dataPie = [
     { name: "Aprovadas", value: totalAprov || 0, color: "#10b981" },
     { name: "Reprovadas", value: totalReprov || 0, color: "#ef4444" },
   ];

   // Bar chart config for quality
   const barData = [
     { name: 'Qualidade', aprov: totalAprov, reprov: totalReprov }
   ];
 
   return (
     <div className="space-y-6">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground mb-1">Taxa de Aprovação</span>
             <span className="text-2xl font-bold text-green-600">{Math.round(taxaAprov)}%</span>
             <p className="text-[10px] text-muted-foreground mt-1">Geral histórico</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground mb-1">Aguardando Revisão</span>
             <span className="text-2xl font-bold text-amber-500">{stats.osPend}</span>
             <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
               <Clock className="h-3 w-3" />
               <span>Prazo médio: 24h</span>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground mb-1">Total Analisado</span>
             <span className="text-2xl font-bold">{total}</span>
             <p className="text-[10px] text-muted-foreground mt-1">OS revisadas</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground mb-1">Incidentes Críticos</span>
             <span className="text-2xl font-bold text-red-600">0</span>
             <p className="text-[10px] text-muted-foreground mt-1">Sem ocorrências graves</p>
           </div>
         </Card>
       </div>
 
       <div className="grid gap-6 md:grid-cols-2">
         <Card className="p-6 border-none shadow-sm flex flex-col">
           <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
             <ShieldCheck className="h-4 w-4 text-primary" />
             Taxa de Qualidade Acumulada
           </h4>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ left: -40, right: 20 }}>
                 <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" hide />
                 <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                 />
                 <Bar dataKey="aprov" name="Aprovadas" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} barSize={40} animationDuration={1500} />
                 <Bar dataKey="reprov" name="Reprovadas" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={40} animationDuration={1500} />
               </BarChart>
             </ResponsiveContainer>
             <div className="flex justify-center gap-6 mt-4 text-[11px] font-medium text-muted-foreground">
               <div className="flex items-center gap-2">
                 <div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Aprovadas ({totalAprov})
               </div>
               <div className="flex items-center gap-2">
                 <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Reprovadas ({totalReprov})
               </div>
             </div>
           </div>
         </Card>
 
         <div className="space-y-4">
           <Card className="p-4 shadow-none border-l-4 border-l-red-500">
             <div className="flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
               <div>
                 <h5 className="text-sm font-semibold">Atenção: Fotos nulas</h5>
                 <p className="text-xs text-muted-foreground mt-1">Detectado aumento de 15% em OS enviadas sem evidência de conclusão na Equipe ALFA.</p>
               </div>
             </div>
           </Card>
           <Card className="p-4 shadow-none border-l-4 border-l-blue-500">
             <div className="flex items-start gap-3">
               <ShieldCheck className="h-5 w-5 text-blue-500 mt-1" />
               <div>
                 <h5 className="text-sm font-semibold">Auditoria Semanal</h5>
                 <p className="text-xs text-muted-foreground mt-1">O relatório de conformidade está pronto para exportação.</p>
               </div>
             </div>
           </Card>
         </div>
       </div>
     </div>
   );
 }