import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
  import { Plus, Pencil, Trash2, Building2, User, Search } from "lucide-react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Departamentos() {
  const [deps, setDeps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
   const [editingDep, setEditingDep] = useState<any>(null);
   const [managers, setManagers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
      name: "",
      acronym: "",
      description: "",
      active: true,
      manager_id: "none"
    });
    const [searchTerm, setSearchTerm] = useState("");

   const fetchDeps = async () => {
     setLoading(true);
     const { data, error } = await supabase
       .from("departments")
       .select(`
         *,
         manager:profiles(nome)
       `)
       .order("name");
     if (error) toast.error(error.message);
     else setDeps(data || []);
     setLoading(false);
   };

    const fetchManagers = async () => {
      try {
        const { data: roleRecords } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "gestor", "developer"]);
        
        if (roleRecords && roleRecords.length > 0) {
          const userIds = roleRecords.map(r => r.user_id);
          const { data, error } = await supabase
            .from("profiles")
            .select("id, nome")
            .in("id", userIds)
            .eq("ativo", true)
            .order("nome");
          
          if (!error) setManagers(data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar gestores:", err);
      }
    };

   useEffect(() => {
     fetchDeps();
     fetchManagers();
   }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Nome é obrigatório");

    try {
      const dataToSave = {
        name: formData.name.trim(),
        acronym: formData.acronym.trim().toUpperCase(),
        description: formData.description.trim(),
        active: formData.active,
        manager_id: formData.manager_id === "none" || !formData.manager_id ? null : formData.manager_id
      };

      if (editingDep) {
        const { error } = await supabase
          .from("departments")
          .update(dataToSave)
          .eq("id", editingDep.id);
        if (error) throw error;
        toast.success("Departamento atualizado");
      } else {
        const { error } = await supabase
          .from("departments")
          .insert(dataToSave);
        if (error) throw error;
        toast.success("Departamento criado");
      }
      setModalOpen(false);
      fetchDeps();
    } catch (e: any) {
      console.error("Erro ao salvar departamento:", e);
      toast.error(e.message || "Erro ao salvar alterações");
    }
  };

  const openEdit = (dep: any) => {
    setEditingDep(dep);
    setFormData({
      name: dep.name,
      acronym: dep.acronym || "",
      description: dep.description || "",
      active: dep.active === false ? false : true,
      manager_id: dep.manager_id || "none"
    });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingDep(null);
    setFormData({
      name: "",
      acronym: "",
      description: "",
      active: true,
      manager_id: "none"
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este departamento? Esta ação é irreversível.")) return;
    
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Departamento excluído");
      fetchDeps();
    } catch (e: any) {
      console.error("Erro ao excluir:", e);
      toast.error(e.message || "Erro ao excluir departamento");
    }
  };

  const filteredDeps = deps.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.acronym && d.acronym.toLowerCase().includes(searchTerm.toLowerCase()))
  );

   return (
     <div className="space-y-6">
       <PageHeader 
         title="Departamentos" 
         description="Gerencie os setores da empresa e permissões de OS" 
         actions={
           <Button onClick={openNew} size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
             <Plus className="mr-2 h-4 w-4" /> Novo Departamento
           </Button>
         }
       />
 
       <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
         <div className="p-6 border-b bg-muted/10 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Buscar por nome ou código..." 
               className="pl-10 h-11 border-primary/10 bg-background/50 focus-visible:ring-primary/20"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-sm">
             <thead>
               <tr className="bg-muted/30 border-b text-xs uppercase tracking-wider font-bold text-muted-foreground">
                 <th className="px-6 py-4 text-left">Nome / Descrição</th>
                 <th className="px-6 py-4 text-left">Código</th>
                 <th className="px-6 py-4 text-left">Gestor Responsável</th>
                 <th className="px-6 py-4 text-left">Status</th>
                 <th className="px-6 py-4 text-right">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-muted/30">
               {filteredDeps.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center">
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                       <Building2 className="h-10 w-10 opacity-20" />
                       <p className="font-medium">Nenhum departamento encontrado.</p>
                     </div>
                   </td>
                 </tr>
               ) : (
                 filteredDeps.map((dep) => (
                   <tr key={dep.id} className="hover:bg-primary/5 transition-colors group">
                     <td className="px-6 py-4">
                       <div className="font-bold text-foreground text-base">{dep.name}</div>
                       <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{dep.description || "Sem descrição"}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="font-mono text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                         {dep.acronym || "-"}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       {dep.manager?.nome ? (
                         <div className="flex items-center gap-2 bg-muted/40 w-fit px-3 py-1.5 rounded-full border border-muted">
                           <User className="h-3.5 w-3.5 text-primary" />
                           <span className="font-medium text-xs">{dep.manager.nome}</span>
                         </div>
                       ) : (
                         <span className="text-muted-foreground text-xs italic">Não definido</span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight shadow-sm ${dep.active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                         {dep.active ? 'Ativo' : 'Inativo'}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" onClick={() => openEdit(dep)} className="h-9 w-9 text-primary hover:bg-primary/10" title="Editar">
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(dep.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10" title="Excluir">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
       </Card>
 
       <Dialog open={modalOpen} onOpenChange={setModalOpen}>
         <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
           <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
               <Building2 className="h-32 w-32" />
             </div>
             <div className="relative z-10">
               <DialogTitle className="text-2xl font-bold">{editingDep ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
               <p className="text-primary-foreground/70 text-sm mt-1">Configure as informações fundamentais do setor.</p>
             </div>
           </DialogHeader>
           
           <div className="p-8 space-y-5 bg-background">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</Label>
               <Input 
                 className="col-span-3 h-11 border-primary/10 focus-visible:ring-primary/20"
                 value={formData.name} 
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                 placeholder="Ex: Engenharia de Campo"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código</Label>
               <Input 
                 className="col-span-3 h-11 border-primary/10 focus-visible:ring-primary/20 font-mono font-bold"
                 value={formData.acronym} 
                 onChange={(e) => setFormData({ ...formData, acronym: e.target.value })} 
                 placeholder="Ex: ENG"
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gestor</Label>
               <div className="col-span-3">
                 <Select 
                   value={formData.manager_id} 
                   onValueChange={(v) => setFormData({ ...formData, manager_id: v })}
                 >
                   <SelectTrigger className="h-11 border-primary/10">
                     <SelectValue placeholder="Selecione um gestor" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">Sem gestor</SelectItem>
                     {managers.map((m) => (
                       <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
             <div className="grid grid-cols-4 items-start gap-4">
               <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-3">Descrição</Label>
               <Textarea 
                 className="col-span-3 min-h-[100px] border-primary/10 focus-visible:ring-primary/20 resize-none"
                 value={formData.description} 
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                 placeholder="Descreva as responsabilidades deste setor"
               />
             </div>
             <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
               <div className="flex flex-col">
                 <Label className="text-sm font-bold">Status do Setor</Label>
                 <span className="text-[10px] text-muted-foreground">Define se o setor aparece nas OS</span>
               </div>
               <Switch 
                 checked={formData.active} 
                 onCheckedChange={(v) => setFormData({ ...formData, active: v })} 
               />
             </div>
           </div>
 
           <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
             <Button variant="ghost" className="px-6 font-semibold" onClick={() => setModalOpen(false)}>Cancelar</Button>
             <Button className="px-10 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleSave}>
               {editingDep ? "Atualizar" : "Salvar Setor"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
}