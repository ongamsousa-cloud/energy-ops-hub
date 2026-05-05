 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { ShieldCheck, AlertCircle } from "lucide-react";
 import { toast } from "sonner";
 
 export default function PasswordResetManager() {
   const [email, setEmail] = useState("");
 
   const handleReset = () => {
     toast.info("Função de reset administrativo sendo preparada via Edge Function.");
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <ShieldCheck className="h-5 w-5 text-primary" /> Reset de Segurança
         </CardTitle>
         <CardDescription>Gere senhas temporárias e force a troca no próximo login.</CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="space-y-2">
           <Label>Email do Usuário Alvo</Label>
           <Input 
             placeholder="exemplo@email.com" 
             value={email}
             onChange={(e) => setEmail(e.target.value)}
           />
         </div>
         <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex gap-2">
           <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
           <p className="text-xs text-amber-800">
             Esta ação é irreversível e será registrada nos logs de auditoria com seu IP e timestamp.
           </p>
         </div>
         <Button onClick={handleReset} className="w-full">Gerar Senha Temporária</Button>
       </CardContent>
     </Card>
   );
 }