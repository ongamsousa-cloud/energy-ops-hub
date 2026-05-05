 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Search, Shield, Ban, CheckCircle, Key, UserPlus } from "lucide-react";
 import { developerService } from "@/services/developerService";
 import { toast } from "sonner";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";

 export default function UserPermissionManager() {
   const [users, setUsers] = useState<any[]>([]);
   const [search, setSearch] = useState("");
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     loadUsers();
   }, []);

   const loadUsers = async () => {
     try {
       const data = await developerService.getAllUsersDetailed();
       setUsers(data || []);
     } catch (e: any) {
       toast.error("Erro ao carregar usuários");
     } finally {
       setLoading(false);
     }
   };

   const handleToggleActive = async (userId: string, currentStatus: boolean) => {
     try {
       const { error } = await supabase.from("profiles").update({ ativo: !currentStatus }).eq("id", userId);
       if (error) throw error;
       setUsers(prev => prev.map(u => u.id === userId ? { ...u, ativo: !currentStatus } : u));
       toast.success(`Usuário ${!currentStatus ? 'ativado' : 'bloqueado'} com sucesso`);
     } catch (e: any) {
       toast.error("Erro ao atualizar status do usuário");
     }
   };

   const handleForceReset = async (userId: string) => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       await developerService.forcePasswordReset(userId, user.id);
       toast.success("Solicitação de reset enviada. O usuário terá que trocar a senha no próximo login.");
     } catch (e: any) {
       toast.error("Erro ao solicitar reset de senha");
     }
   };

   const filtered = users.filter(u => 
     u.nome?.toLowerCase().includes(search.toLowerCase()) || 
     u.email?.toLowerCase().includes(search.toLowerCase())
   );

   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between space-y-0">
         <div>
           <CardTitle>Gestão de Usuários e Perfis</CardTitle>
           <CardDescription>Controle total sobre permissões, status e segurança das contas.</CardDescription>
         </div>
         <div className="flex gap-4">
           <div className="relative w-64">
             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Buscar usuário..." 
               className="pl-8" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <Button className="bg-primary hover:opacity-90"><UserPlus className="h-4 w-4 mr-2" /> Novo Usuário</Button>
         </div>
       </CardHeader>
       <CardContent>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Nome</TableHead>
               <TableHead>Email</TableHead>
               <TableHead>Cargo/Role</TableHead>
               <TableHead>Status</TableHead>
               <TableHead className="text-right">Ações</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filtered.map((user) => (
               <TableRow key={user.id} className="hover:bg-muted/30">
                 <TableCell className="font-medium">{user.nome || "Sem nome"}</TableCell>
                 <TableCell>{user.email}</TableCell>
                 <TableCell>
                   <div className="flex gap-1 flex-wrap">
                     {user.user_roles?.map((r: any, idx: number) => (
                       <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px]">
                         {r.role}
                       </Badge>
                     )) || <Badge variant="secondary">USER</Badge>}
                   </div>
                 </TableCell>
                 <TableCell>
                   <Badge variant={user.ativo ? "default" : "destructive"} className={user.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}>
                     {user.ativo ? "Ativo" : "Bloqueado"}
                   </Badge>
                 </TableCell>
                 <TableCell className="text-right">
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm">Opções</Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56">
                       <DropdownMenuLabel>Ações de Desenvolvedor</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.ativo)}>
                         {user.ativo ? <><Ban className="mr-2 h-4 w-4 text-red-500" /> Bloquear Acesso</> : <><CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Reativar Acesso</>}
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleForceReset(user.id)}>
                         <Key className="mr-2 h-4 w-4" /> Forçar Reset de Senha
                       </DropdownMenuItem>
                       <DropdownMenuItem>
                         <Shield className="mr-2 h-4 w-4" /> Alterar Permissões (Roles)
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </CardContent>
     </Card>
   );
 }