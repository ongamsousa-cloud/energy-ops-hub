 import { Card } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
 import { Users, Briefcase, Activity, AlertCircle } from "lucide-react";
 
 interface GestorDashboardProps {
   stats: any;
   byStatus: any[];
 }
 
 export default function GestorDashboard({ stats, byStatus }: GestorDashboardProps) {
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