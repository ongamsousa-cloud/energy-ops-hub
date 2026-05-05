 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Search, UserCog } from "lucide-react";
 
 export default function UserPermissionManager() {
   const [users, setUsers] = useState<any[]>([]);
   const [search, setSearch] = useState("");
 
   useEffect(() => {
     supabase.from("profiles").select("*").order("nome").then(({ data }) => setUsers(data || []));
   }, []);
 
   const filtered = users.filter(u => 
     u.nome?.toLowerCase().includes(search.toLowerCase()) || 
     u.email?.toLowerCase().includes(search.toLowerCase())
   );
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle>Gestão de Usuários e Perfis</CardTitle>
         <div className="relative w-72">
           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Buscar usuário..." 
             className="pl-8" 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
       </CardHeader>
       <CardContent>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Nome</TableHead>
               <TableHead>Email</TableHead>
               <TableHead>Status</TableHead>
               <TableHead>Ações</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filtered.map((user) => (
               <TableRow key={user.id}>
                 <TableCell className="font-medium">{user.nome}</TableCell>
                 <TableCell>{user.email}</TableCell>
                 <TableCell>
                   <Badge variant={user.ativo ? "success" : "destructive"}>
                     {user.ativo ? "Ativo" : "Bloqueado"}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   <Button variant="ghost" size="sm"><UserCog className="h-4 w-4" /></Button>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </CardContent>
     </Card>
   );
 }