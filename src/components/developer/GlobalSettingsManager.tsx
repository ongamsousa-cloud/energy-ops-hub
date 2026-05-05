 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Save } from "lucide-react";
 
 export default function GlobalSettingsManager() {
   return (
     <Card>
       <CardHeader>
         <CardTitle>Configurações Globais do Sistema</CardTitle>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label>Nome do Sistema</Label>
             <Input defaultValue="Energy Ops" />
           </div>
           <div className="space-y-2">
             <Label>Empresa Mantenedora</Label>
             <Input defaultValue="Energy Soluções" />
           </div>
         </div>
         <div className="flex items-center justify-between p-4 border rounded-lg">
           <div className="space-y-0.5">
             <Label>Cadastro Público</Label>
             <p className="text-xs text-muted-foreground">Permitir que novos usuários se registrem sozinhos.</p>
           </div>
           <Switch />
         </div>
         <div className="flex justify-end">
           <Button><Save className="h-4 w-4 mr-2" /> Salvar Configurações</Button>
         </div>
       </CardContent>
     </Card>
   );
 }