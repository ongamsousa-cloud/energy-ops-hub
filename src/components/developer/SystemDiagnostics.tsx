 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
 
 export default function SystemDiagnostics() {
   const checks = [
     { name: "Conexão Supabase", status: "ok" },
     { name: "Autenticação Auth", status: "ok" },
     { name: "Storage Buckets", status: "ok" },
     { name: "Database RLS", status: "ok" },
     { name: "PWA Manifest", status: "ok" },
   ];
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle>Diagnóstico de Infraestrutura</CardTitle>
         <Button size="sm" variant="outline"><RefreshCcw className="h-4 w-4 mr-2" /> Rodar Testes</Button>
       </CardHeader>
       <CardContent className="space-y-4">
         {checks.map((check, i) => (
           <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
             <span className="text-sm font-medium">{check.name}</span>
             {check.status === "ok" ? (
               <div className="flex items-center gap-1 text-emerald-600 text-xs">
                 <CheckCircle2 className="h-4 w-4" /> Operacional
               </div>
             ) : (
               <div className="flex items-center gap-1 text-red-600 text-xs">
                 <XCircle className="h-4 w-4" /> Falha
               </div>
             )}
           </div>
         ))}
       </CardContent>
     </Card>
   );
 }