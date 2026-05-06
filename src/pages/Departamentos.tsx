import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
     const { data, error } = await supabase
       .from("profiles")
       .select("id, nome")
       .in("role", ["admin", "gestor", "developer"])
       .order("nome");
     if (!error) setManagers(data || []);
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
          <Button onClick={openNew} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Novo Departamento
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou código..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Gestor</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDeps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum departamento encontrado.
                  </td>
                </tr>
              ) : (
                filteredDeps.map((dep) => (
                  <tr key={dep.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{dep.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{dep.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {dep.acronym || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {dep.manager?.nome ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{dep.manager.nome}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${dep.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {dep.active ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(dep)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dep.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDep ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nome</Label>
              <Input 
                className="col-span-3"
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Engenharia de Campo"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Código (Sigla)</Label>
              <Input 
                className="col-span-3"
                value={formData.acronym} 
                onChange={(e) => setFormData({ ...formData, acronym: e.target.value })} 
                placeholder="Ex: ENG"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right">Gestor</Label>
               <div className="col-span-3">
                 <Select 
                   value={formData.manager_id} 
                   onValueChange={(v) => setFormData({ ...formData, manager_id: v })}
                 >
                   <SelectTrigger>
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
               <Label className="text-right pt-2">Descrição</Label>
               <Textarea 
                 className="col-span-3"
                 value={formData.description} 
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                 placeholder="Descreva as responsabilidades deste setor"
               />
             </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3 flex items-center gap-2">
                <Switch 
                  checked={formData.active} 
                  onCheckedChange={(v) => setFormData({ ...formData, active: v })} 
                />
                <Label>Departamento Ativo</Label>
              </div>
            </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}