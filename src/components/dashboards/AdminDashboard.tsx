 import { Card } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
 import { TrendingUp, Users, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
 
 interface AdminDashboardProps {
   stats: any;
   byStatus: any[];
   umdHistory: any[];
 }
 
 export default function AdminDashboard({ stats, byStatus, umdHistory }: AdminDashboardProps) {
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