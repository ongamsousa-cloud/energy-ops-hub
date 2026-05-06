import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
 import { ROLE_LABEL, AppRole, useAuth } from "@/lib/auth";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
  import { Shield, UserPlus, Search, MoreHorizontal, Settings, Key, UserMinus, Pencil } from "lucide-react";
  import ProfessionalModal from "@/components/professional/ProfessionalModal";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { 
   DropdownMenu, 
   DropdownMenuContent, 
   DropdownMenuItem, 
   DropdownMenuLabel, 
   DropdownMenuSeparator, 
   DropdownMenuTrigger 
 } from "@/components/ui/dropdown-menu";

 const ROLES: AppRole[] = ["admin", "gestor", "supervisor", "campo", "financeiro", "auditor", "estoque", "developer"];

 export default function Profissionais() {
   const [rows, setRows] = useState<any[]>([]);
   const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
   const [search, setSearch] = useState("");
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedProf, setSelectedProf] = useState<any>(null);
  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("*, user_roles(role), departments(id,name)")
      .order("nome");
    setRows(data ?? []);
    const { data: depts } = await supabase.from("departments").select("id,name").eq("active", true).order("name");
    setDepartments(depts ?? []);
  }
  useEffect(() => { load(); }, []);
  async function setRole(uid: string, role: AppRole) {
    await supabase.from("user_roles").delete().eq("user_id", uid);
     const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
    if (error) toast.error(error.message); else { toast.success("Perfil atualizado"); load(); }
  }
  async function setDept(uid: string, deptId: string) {
    const { error } = await supabase.from("profiles").update({ department_id: deptId }).eq("id", uid);
    if (error) toast.error(error.message); else { toast.success("Departamento atualizado"); load(); }
  }
   const filteredRows = rows.filter(p => 
     p.nome?.toLowerCase().includes(search.toLowerCase()) || 
     p.email?.toLowerCase().includes(search.toLowerCase()) ||
     p.cargo?.toLowerCase().includes(search.toLowerCase())
   );

   const openEdit = (prof: any) => {
     setSelectedProf(prof);
     setModalOpen(true);
   };

   const openNew = () => {
     setSelectedProf(null);
     setModalOpen(true);
   };

   return (
     <div className="space-y-6">
       <PageHeader 
         title="Profissionais" 
         description="Equipe e papéis de acesso ao sistema." 
         actions={
           <Button onClick={openNew} size="sm" className="gap-2">
             <UserPlus className="h-4 w-4" /> Novo Profissional
           </Button>
         }
       />

       <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Buscar por nome, email ou cargo..." 
             className="pl-9"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
         </div>
       </div>

       {filteredRows.length === 0 ? <EmptyState title="Nenhum profissional encontrado" /> : (
         <div className="overflow-hidden rounded-md border border-border bg-card">
           <table className="w-full text-sm">
             <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
               <tr>
                 <th className="px-3 py-2 w-10"></th>
                 <th className="px-3 py-2">Nome</th>
                 <th className="px-3 py-2">Email</th>
                 <th className="px-3 py-2">Cargo</th>
                 <th className="px-3 py-2 w-48">Perfil</th>
                 <th className="px-3 py-2 w-48">Departamento</th>
                 <th className="px-3 py-2 w-10"></th>
               </tr>
             </thead>
             <tbody>{filteredRows.map((p)=>{ const role = p.user_roles?.[0]?.role as AppRole | undefined; return (
               <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                 <td className="px-3 py-2">
                   <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                     {p.foto_url ? (
                       <img src={p.foto_url} alt={p.nome} className="h-full w-full object-cover" />
                     ) : (
                       <span className="text-[10px] font-bold text-primary">{p.nome?.substring(0, 2).toUpperCase()}</span>
                     )}
                   </div>
                 </td>
                 <td className="px-3 py-2 font-medium">{p.nome}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.email}</td>
                <td className="px-3 py-2">{p.cargo ?? "—"}</td>
                <td className="px-3 py-2">
                  <Select value={role ?? "campo"} onValueChange={(v)=>setRole(p.id, v as AppRole)}>
                    <SelectTrigger className="h-8"><SelectValue/></SelectTrigger>
                    <SelectContent>{ROLES.map((r)=>(<SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>))}</SelectContent>
                   </Select>
                 </td>
                 <td className="px-3 py-2">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                     <Pencil className="h-4 w-4" />
                   </Button>
                 </td>
                <td className="px-3 py-2">
                  <Select value={p.department_id ?? ""} onValueChange={(v)=>setDept(p.id, v)}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="—"/></SelectTrigger>
                    <SelectContent>{departments.map((d)=>(<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                  </Select>
                </td>
              </tr>
            );})}</tbody>
          </table>
        </div>
       )}

       <ProfessionalModal 
         open={modalOpen} 
         onOpenChange={setModalOpen} 
         onSuccess={load} 
         professional={selectedProf}
         departments={departments}
       />
     </div>
   );
}