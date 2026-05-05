 import { useEffect, useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { developerService } from "@/services/developerService";
 import { Activity, Database, Users, Building2, AlertTriangle } from "lucide-react";
 
 export default function DeveloperOverview() {
   const [stats, setStats] = useState<any>(null);
 
   useEffect(() => {
     developerService.getSystemStats().then(setStats);
   }, []);
 
   if (!stats) return null;
 
   const items = [
     { title: "Usuários Totais", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
     { title: "Ordens de Serviço", value: stats.totalOS, icon: Database, color: "text-purple-500", bg: "bg-purple-500/10" },
     { title: "Departamentos", value: stats.totalDepts, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10" },
     { title: "Profissionais", value: stats.totalPros, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
     { title: "Erros Abertos", value: stats.openErrors, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
   ];
 
   return (
     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
       {items.map((item, i) => (
         <Card key={i}>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
             <div className={`p-2 rounded-full ${item.bg}`}>
               <item.icon className={`h-4 w-4 ${item.color}`} />
             </div>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{item.value}</div>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 }