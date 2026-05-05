 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { ShieldCheck, AlertCircle, Key, RefreshCcw, Search } from "lucide-react";
 import { toast } from "sonner";
 import { supabase } from "@/integrations/supabase/client";
 import { developerService } from "@/services/developerService";

 export default function PasswordResetManager() {
   const [email, setEmail] = useState("");
   const [loading, setLoading] = useState(false);
   const [userFound, setUserFound] = useState<any>(null);

   const findUser = async () => {
     if (!email) return;
     setLoading(true);
     try {
       const { data } = await supabase
         .from("profiles")
         .select("id, nome, email")
         .eq("email", email)
         .maybeSingle();
       
       if (data) {
         setUserFound(data);
         toast.success("Usuário localizado.");
       } else {
         setUserFound(null);
         toast.error("Usuário não encontrado.");
       }
     } finally {
       setLoading(false);
     }
   };

   const handleReset = async () => {
     if (!userFound) return;
     setLoading(true);
     try {
       const { data: { user: currentUser } } = await supabase.auth.getUser();
       if (!currentUser) return;

       await developerService.forcePasswordReset(userFound.id, currentUser.id);
       toast.success(`Reset de segurança para ${userFound.nome} disparado. A flag 'must_change_password' foi ativada.`);
       setUserFound(null);
       setEmail("");
     } catch (e) {
       toast.error("Erro ao processar reset administrativo.");
     } finally {
       setLoading(false);
     }
   };

   return (
     <Card className="border-primary/20 shadow-md">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <ShieldCheck className="h-5 w-5 text-primary" /> Protocolo de Segurança: Reset Forçado
         </CardTitle>
         <CardDescription>Esta ferramenta ativa a obrigatoriedade de troca de senha no próximo acesso do usuário.</CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="flex gap-2">
           <div className="space-y-2 flex-1">
             <Label>Identificar Usuário por Email</Label>
             <div className="relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="exemplo@email.com" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="pl-8"
               />
             </div>
           </div>
           <Button className="mt-8" variant="outline" onClick={findUser} disabled={loading || !email}>
             <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
         </div>

         {userFound && (
           <div className="p-4 border rounded-xl bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs font-bold uppercase text-primary tracking-widest">Alvo Confirmado</p>
                 <h4 className="text-lg font-black">{userFound.nome}</h4>
                 <p className="text-sm text-muted-foreground">{userFound.email}</p>
               </div>
               <Key className="h-8 w-8 text-primary opacity-20" />
             </div>
             
             <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 items-start">
               <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-xs text-amber-900 font-bold">AVISO DE SEGURANÇA</p>
                 <p className="text-[11px] text-amber-800 leading-tight">
                   Ao confirmar, a conta será marcada para reset. O sistema impedirá qualquer navegação do usuário até que uma nova senha seja definida. Esta ação é auditada.
                 </p>
               </div>
             </div>

             <Button onClick={handleSave} className="w-full bg-primary hover:opacity-90 font-bold" onClick={handleReset}>
               CONFIRMAR RESET FORÇADO
             </Button>
           </div>
         )}

         {!userFound && !loading && (
           <div className="text-center py-8 opacity-40">
             <ShieldCheck className="h-12 w-12 mx-auto mb-2" />
             <p className="text-sm">Insira o email para iniciar o protocolo.</p>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }