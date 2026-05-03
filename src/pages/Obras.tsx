import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
 import { Plus, Search } from "lucide-react";
 import { useAuth } from "@/lib/auth";
 import { cepService } from "@/services";

const STATUS = ["aberta","planejamento","execucao","pausada","aguardando_material","aguardando_aprovacao","concluida","cancelada"] as const;

export default function Obras() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(["admin","gestor"]);
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
   const [form, setForm] = useState<any>({ 
     numero: "", 
     nome: "", 
     cidade: "", 
     estado: "", 
     status: "aberta",
     cep: "",
     bairro: "",
     endereco: ""
   });
   const [searchingCep, setSearchingCep] = useState(false);

   async function handleCepSearch() {
     const cep = form.cep?.replace(/\D/g, "");
     if (cep?.length !== 8) return toast.error("CEP inválido");
     setSearchingCep(true);
     try {
       const data = await cepService.buscarCep(cep);
       if (data) {
         setForm({
           ...form,
           endereco: data.logradouro,
           bairro: data.bairro,
           cidade: data.localidade,
           estado: data.uf,
         });
         toast.success("Endereço preenchido");
       } else {
         toast.error("CEP não encontrado");
       }
     } catch (err) {
       toast.error("Erro ao buscar CEP");
     } finally {
       setSearchingCep(false);
     }
   }
 
   async function load() {
    const { data } = await supabase.from("obras").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.numero || !form.nome) return toast.error("Número e nome são obrigatórios");
    const { error } = await supabase.from("obras").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Obra criada");
    setOpen(false);
    setForm({ numero: "", nome: "", cidade: "", estado: "", status: "aberta" });
    load();
  }

  const filtered = rows.filter((r) =>
    !q || r.numero.toLowerCase().includes(q.toLowerCase()) || r.nome.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Obras"
        description="Gestão de obras cadastradas."
        actions={canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Nova obra</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova obra</DialogTitle></DialogHeader>
               <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
                 <div><Label>Número da Obra *</Label><Input value={form.numero} onChange={(e)=>setForm({...form, numero: e.target.value})} /></div>
                 <div><Label>Nome da Obra *</Label><Input value={form.nome} onChange={(e)=>setForm({...form, nome: e.target.value})} /></div>
                 <div className="sm:col-span-2">
                   <Label>CEP</Label>
                   <div className="flex gap-2">
                     <Input placeholder="00000-000" value={form.cep} onChange={(e)=>setForm({...form, cep: e.target.value})} />
                     <Button size="icon" variant="outline" type="button" onClick={handleCepSearch} disabled={searchingCep}>
                       <Search className={`h-4 w-4 ${searchingCep ? 'animate-spin' : ''}`} />
                     </Button>
                   </div>
                 </div>
                 <div className="sm:col-span-2"><Label>Cliente</Label><Input value={form.cliente ?? ""} onChange={(e)=>setForm({...form, cliente: e.target.value})} /></div>
                 <div className="sm:col-span-2"><Label>Endereço</Label><Input value={form.endereco ?? ""} onChange={(e)=>setForm({...form, endereco: e.target.value})} /></div>
                 <div><Label>Bairro</Label><Input value={form.bairro ?? ""} onChange={(e)=>setForm({...form, bairro: e.target.value})} /></div>
                 <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e)=>setForm({...form, cidade: e.target.value})} /></div>
                  <div><Label>Estado</Label><Input value={form.estado} onChange={(e)=>setForm({...form, estado: e.target.value})} /></div>
                 <div>
                   <Label>Status</Label>
                   <Select value={form.status} onValueChange={(v)=>setForm({...form, status: v})}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>{STATUS.map((s)=>(<SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>))}</SelectContent>
                   </Select>
                 </div>
                 <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao ?? ""} onChange={(e)=>setForm({...form, descricao: e.target.value})} /></div>
              </div>
              <Button onClick={save}>Salvar</Button>
            </DialogContent>
          </Dialog>
        )}
      />
      <div className="mb-3 max-w-sm">
        <Input placeholder="Buscar por número ou nome…" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma obra encontrada" description="Cadastre a primeira obra para iniciar." />
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Número</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Cidade</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((o)=>(
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-3 py-2 font-mono text-xs"><Link to={`/app/obras/${o.id}`} className="hover:underline">{o.numero}</Link></td>
                  <td className="px-3 py-2">{o.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.cidade}{o.estado ? ` / ${o.estado}` : ""}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}