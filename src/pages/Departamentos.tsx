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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Departamentos() {
  const [deps, setDeps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", active: true });

  const fetchDeps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");
    if (error) toast.error(error.message);
    else setDeps(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeps();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return toast.error("Nome é obrigatório");
    
    try {
      if (editingDep) {
        const { error } = await supabase
          .from("departments")
          .update(formData)
          .eq("id", editingDep.id);
        if (error) throw error;
        toast.success("Departamento atualizado");
      } else {
        const { error } = await supabase
          .from("departments")
          .insert(formData);
        if (error) throw error;
        toast.success("Departamento criado");
      }
      setModalOpen(false);
      fetchDeps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (dep: any) => {
    setEditingDep(dep);
    setFormData({ name: dep.name, description: dep.description || "", active: dep.active });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingDep(null);
    setFormData({ name: "", description: "", active: true });
    setModalOpen(true);
  };

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deps.map((dep) => (
          <Card key={dep.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{dep.name}</h3>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${dep.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {dep.active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {dep.description || "Sem descrição informada."}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => openEdit(dep)}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDep ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Departamento</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Engenharia de Campo"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Descreva as responsabilidades deste setor"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.active} 
                onCheckedChange={(v) => setFormData({ ...formData, active: v })} 
              />
              <Label>Departamento Ativo</Label>
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