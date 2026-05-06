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

export default function Equipes() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
   const [deps, setDeps] = useState<any[]>([]);
   const [form, setForm] = useState<any>({ nome: "", codigo: "", regiao: "", department_id: "" });
   async function load() { 
     const { data } = await supabase.from("equipes").select("*, department:departments(name)").order("nome"); 
     setRows(data ?? []); 
     const { data: d } = await supabase.from("departments").select("id, name").eq("active", true);
     setDeps(d ?? []);
   }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!form.nome) return toast.error("Nome obrigatório");
     const { error } = await supabase.from("equipes").insert({
       ...form,
       department_id: form.department_id === "" ? null : form.department_id
     });
     if (error) return toast.error(error.message);
     setOpen(false); setForm({ nome: "", codigo: "", regiao: "", department_id: "" }); load();
  }
  return (
    <div>
      <PageHeader title="Equipes" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Nova equipe</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova equipe</DialogTitle></DialogHeader>
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
            </div>
            <Button onClick={save}>Salvar</Button>
          </DialogContent>
        </Dialog>
      } />
      {rows.length === 0 ? <EmptyState title="Sem equipes cadastradas" /> : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
             <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Código</th><th className="px-3 py-2">Região</th><th className="px-3 py-2">Departamento</th></tr></thead>
             <tbody>{rows.map((r)=>(<tr key={r.id} className="border-b border-border last:border-0"><td className="px-3 py-2">{r.nome}</td><td className="px-3 py-2 font-mono text-xs">{r.codigo}</td><td className="px-3 py-2 text-muted-foreground">{r.regiao}</td><td className="px-3 py-2 text-muted-foreground">{r.department?.name || "-"}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}