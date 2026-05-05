 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { AlertTriangle } from "lucide-react";
 
 export default function MaintenanceMode() {
   return (
     <Card className="border-warning/50">
       <CardHeader className="bg-warning/5">
         <CardTitle className="flex items-center gap-2">
           <AlertTriangle className="h-5 w-5 text-warning" /> Modo de Manutenção
         </CardTitle>
         <CardDescription>Ao ativar, apenas desenvolvedores poderão acessar o sistema.</CardDescription>
       </CardHeader>
       <CardContent className="pt-6">
         <div className="flex items-center justify-between p-6 bg-muted/20 rounded-xl border">
           <div className="space-y-1">
             <Label className="text-lg">Estado do Sistema</Label>
             <p className="text-sm text-muted-foreground">Atualmente o sistema está OPERACIONAL.</p>
           </div>
           <Switch className="scale-125" />
         </div>
       </CardContent>
     </Card>
   );
 }