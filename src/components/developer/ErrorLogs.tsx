 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Bug, AlertCircle } from "lucide-react";
 
 export default function ErrorLogs() {
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Bug className="h-5 w-5 text-destructive" /> Logs de Exceções em Tempo Real
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
           <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
           <p>Nenhum erro crítico registrado nas últimas 24 horas.</p>
         </div>
       </CardContent>
     </Card>
   );
 }