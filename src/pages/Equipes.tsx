import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Equipes() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [deps, setDeps] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ nome: "", codigo: "", regiao: "", department_id: "" });

  async function load() { 
    const { data } = await supabase.from("equipes").select("*, department:departments(name), equipe_membros(profissional_id)").order("nome"); 
    setRows(data ?? []); 
    const { data: d } = await supabase.from("departments").select("id, name").eq("active", true);
    setDeps(d ?? []);
    const { data: p } = await supabase.from("employees").select("id, full_name").eq("status", "active").order("full_name");
    setProfs(p ?? []);
  }

  useEffect(() => { load(); }, []);
  async function save() {
    if (!form.nome) return toast.error("Nome obrigatório");
    
    let equipeId = selectedEquipeId;
    
    if (equipeId) {
      const { error } = await supabase.from("equipes").update({
        ...form,
        department_id: form.department_id === "" ? null : form.department_id
      }).eq("id", equipeId);
      if (error) return toast.error(error.message);
      
      // Atualizar membros
      await supabase.from("equipe_membros").delete().eq("equipe_id", equipeId);
    } else {
      const { data: equipe, error } = await supabase.from("equipes").insert({
        ...form,
        department_id: form.department_id === "" ? null : form.department_id
      }).select().single();
      if (error) return toast.error(error.message);
      equipeId = equipe.id;
    }

    if (selectedMembers.length > 0 && equipeId) {
      const members = selectedMembers.map(pid => ({
        equipe_id: equipeId,
        profissional_id: pid
      }));
      const { error: mErr } = await supabase.from("equipe_membros").insert(members);
      if (mErr) toast.error("Erro ao adicionar membros: " + mErr.message);
    }

    setOpen(false); 
    setForm({ nome: "", codigo: "", regiao: "", department_id: "" });
    setSelectedMembers([]);
    setSelectedEquipeId(null);
    load();
    toast.success(selectedEquipeId ? "Equipe atualizada!" : "Equipe criada!");
  }

  const openNew = () => {
    setSelectedEquipeId(null);
    setForm({ nome: "", codigo: "", regiao: "", department_id: "" });
    setSelectedMembers([]);
    setOpen(true);
  };

  const openEdit = (equipe: any) => {
    setSelectedEquipeId(equipe.id);
    setForm({ 
      nome: equipe.nome, 
      codigo: equipe.codigo || "", 
      regiao: equipe.regiao || "", 
      department_id: equipe.department_id || "" 
    });
    setSelectedMembers(equipe.equipe_membros?.map((m: any) => m.profissional_id) || []);
    setOpen(true);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <PageHeader title="Equipes" actions={<Button size="sm" onClick={openNew}><Plus className="mr-1 h-3.5 w-3.5"/>Nova equipe</Button>} />

      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{selectedEquipeId ? "Editar equipe" : "Nova equipe"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={(e)=>setForm({...form, nome: e.target.value})}/></div>
              <div><Label>Código</Label><Input value={form.codigo} onChange={(e)=>setForm({...form, codigo: e.target.value})}/></div>
               <div><Label>Região</Label><Input value={form.regiao} onChange={(e)=>setForm({...form, regiao: e.target.value})}/></div>
               <div>
                 <Label>Departamento</Label>
                 <Select value={form.department_id} onValueChange={(v)=>setForm({...form, department_id: v})}>
                   <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                   <SelectContent>
                     {deps.map((d) => (
                       <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

                <div className="space-y-2">
                  <Label>Membros da Equipe</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {profs.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2">Nenhum profissional ativo encontrado.</p>
                      ) : (
                        profs.map((p) => (
                          <div key={p.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded transition-colors">
                            <Checkbox 
                              id={`member-${p.id}`} 
                              checked={selectedMembers.includes(p.id)}
                              onCheckedChange={() => toggleMember(p.id)}
                            />
                            <label 
                              htmlFor={`member-${p.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {p.full_name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
            </div>
            <Button onClick={save}>Salvar</Button>
          </DialogContent>
        </Dialog>
      {rows.length === 0 ? <EmptyState title="Sem equipes cadastradas" /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
             <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Código</th><th className="px-3 py-2">Região</th><th className="px-3 py-2">Departamento</th><th className="px-3 py-2 w-20">Ações</th></tr></thead>
             <tbody>{rows.map((r)=>(<tr key={r.id} className="border-b border-border last:border-0"><td className="px-3 py-2">{r.nome}</td><td className="px-3 py-2 font-mono text-xs">{r.codigo}</td><td className="px-3 py-2 text-muted-foreground">{r.regiao}</td><td className="px-3 py-2 text-muted-foreground">{r.department?.name || "-"}</td><td className="px-3 py-2"><Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Editar</Button></td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}