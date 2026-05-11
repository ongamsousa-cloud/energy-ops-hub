import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { toast } from "@/components/ui/sonner";
     import { Plus, Search, Upload, Trash2, Edit, Trash, Briefcase, User, MapPin } from "lucide-react";
 import { useAuth } from "@/lib/auth";
 import { cepService } from "@/services";
 import * as XLSX from 'xlsx';
 import Papa from 'papaparse';

const STATUS = ["aberta","planejamento","execucao","pausada","aguardando_material","aguardando_aprovacao","concluida","cancelada"] as const;

export default function Obras() {
  const { hasRole } = useAuth();
  const canEdit = hasRole(["admin","gestor"]);
  const [rows, setRows] = useState<any[]>([]);
   const [open, setOpen] = useState(false);
   const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    numero: "",
    nome: "",
    cliente: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    numero_endereco: "",
    status: "aberta",
    descricao: "",
    data_inicio: "",
    previsao_conclusao: "",
    responsavel_tecnico: "",
    supervisor_id: "none"
  });
   const [searchingCep, setSearchingCep] = useState(false);

   async function clearAll() {
     if (!confirm("AVISO CRÍTICO: Isso irá excluir TODAS as obras cadastradas. Deseja continuar?")) return;
     const { error } = await supabase.from("obras").delete().neq("id", "00000000-0000-0000-0000-000000000000" as any);
     if (error) return toast.error(error.message);
     toast.success("Todas as obras foram removidas");
     load();
   }

    async function handleCepSearch(forcedCep?: string) {
      const cep = (forcedCep || form.cep)?.replace(/\D/g, "");
      if (cep?.length !== 8) {
        if (!forcedCep) toast.error("CEP inválido");
        return;
      }
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
    const [{ data: obrasData }, { data: supervisorsData }] = await Promise.all([
      supabase.from("obras").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, nome").eq("role", "supervisor").order("nome")
    ]);
    setRows(obrasData ?? []);
    setSupervisors(supervisorsData ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.numero?.trim() || !form.nome?.trim()) return toast.error("Número e nome são obrigatórios");

    const dataToSave = {
      ...form,
      numero: form.numero.trim(),
      nome: form.nome.trim(),
      supervisor_id: form.supervisor_id === "none" || !form.supervisor_id ? null : form.supervisor_id,
      data_inicio: form.data_inicio || null,
      previsao_conclusao: form.previsao_conclusao || null
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("obras").update(dataToSave).eq("id", editingId);
        if (error) throw error;
        toast.success("Obra atualizada com sucesso");
      } else {
        const { error } = await supabase.from("obras").insert(dataToSave);
        if (error) throw error;
        toast.success("Obra criada com sucesso");
      }

      setOpen(false);
      setEditingId(null);
      setForm({
        numero: "",
        nome: "",
        cliente: "",
        cep: "",
        endereco: "",
        bairro: "",
        cidade: "",
        estado: "",
        status: "aberta",
        descricao: "",
        data_inicio: "",
        previsao_conclusao: "",
        responsavel_tecnico: "",
        supervisor_id: "none"
      });
      load();
    } catch (error: any) {
      console.error("Erro ao salvar obra:", error);
      toast.error(error.message || "Erro ao salvar obra");
    }
  }

   async function remove(id: string) {
     if (!confirm("Tem certeza que deseja excluir esta obra?")) return;
     const { error } = await supabase.from("obras").delete().eq("id", id);
     if (error) return toast.error(error.message);
     toast.success("Obra excluída");
     load();
   }

  function edit(obra: any) {
    setForm({
      numero: obra.numero,
      nome: obra.nome,
      cliente: obra.cliente || "",
      cep: obra.cep || "",
      endereco: obra.endereco || "",
      bairro: obra.bairro || "",
      cidade: obra.cidade || "",
      estado: obra.estado || "",
      numero_endereco: obra.numero_endereco || "",
      status: obra.status,
      descricao: obra.descricao || "",
      data_inicio: obra.data_inicio || "",
      previsao_conclusao: obra.previsao_conclusao || "",
      responsavel_tecnico: obra.responsavel_tecnico || "",
      supervisor_id: obra.supervisor_id || "none"
    });
    setEditingId(obra.id);
    setOpen(true);
  }

   async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = async (evt) => {
       const bstr = evt.target?.result;
       let data: any[] = [];

       if (file.name.endsWith('.csv')) {
         const results = Papa.parse(bstr as string, { header: true });
         data = results.data;
       } else {
         const wb = XLSX.read(bstr, { type: 'binary' });
         const wsname = wb.SheetNames[0];
         const ws = wb.Sheets[wsname];
         data = XLSX.utils.sheet_to_json(ws);
       }

       if (data.length === 0) return toast.error("Planilha vazia ou inválida");

        const toInsert = data.map((item: any) => {
          // Normalize keys to lowercase for easier mapping
          const normalizedItem: any = {};
          Object.keys(item).forEach(key => {
            normalizedItem[key.toLowerCase().trim()] = item[key];
          });

          return {
            numero: String(normalizedItem.numero || normalizedItem.codigo || normalizedItem.code || normalizedItem['nº obra'] || ""),
            nome: String(normalizedItem.nome || normalizedItem.obra || normalizedItem.descrição || normalizedItem.description || ""),
            cliente: String(normalizedItem.cliente || normalizedItem.customer || ""),
            endereco: String(normalizedItem.endereco || normalizedItem.endereço || normalizedItem.address || normalizedItem.logradouro || ""),
            bairro: String(normalizedItem.bairro || normalizedItem.neighborhood || ""),
            cidade: String(normalizedItem.cidade || normalizedItem.city || ""),
            estado: String(normalizedItem.estado || normalizedItem.uf || normalizedItem.state || ""),
            cep: String(normalizedItem.cep || normalizedItem.zipcode || ""),
            status: "aberta" as any,
            ativo: true
          };
        }).filter(i => i.numero && i.nome && i.numero !== "undefined" && i.nome !== "undefined");

       if (toInsert.length === 0) return toast.error("Nenhum dado válido encontrado na planilha. Verifique se as colunas 'numero' e 'nome' existem.");

        const { error } = await supabase.from("obras").upsert(toInsert, { onConflict: 'numero' });
       if (error) return toast.error(error.message);

       toast.success(`${toInsert.length} obras importadas com sucesso!`);
       load();
     };

     if (file.name.endsWith('.csv')) {
       reader.readAsText(file);
     } else {
       reader.readAsBinaryString(file);
     }
     e.target.value = '';
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
           <div className="flex gap-2">
             <Input
               type="file"
               accept=".csv, .xlsx, .xls"
               className="hidden"
               id="import-obras"
               onChange={handleImport}
             />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-obras')?.click()} title="Importar de CSV ou Excel">
                <Upload className="mr-1 h-3.5 w-3.5" /> Importar
              </Button>
               <Button variant="destructive" size="sm" onClick={clearAll} title="Limpar todas as obras" className="gap-2">
                 <Trash className="h-3.5 w-3.5" /> Limpar Tabela
               </Button>
             <Dialog open={open} onOpenChange={(val) => {
               setOpen(val);
               if (!val) {
                 setEditingId(null);
                 setForm({ numero: "", nome: "", cidade: "", estado: "", status: "aberta", cep: "", bairro: "", endereco: "", cliente: "", descricao: "" });
               }
             }}>
               <DialogTrigger asChild>
                 <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5"/>Nova obra</Button>
               </DialogTrigger>
                <DialogContent className="max-w-2xl w-[95vw] h-[90vh] max-h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                 <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                     <Briefcase className="h-32 w-32 text-white" />
                   </div>
                   <div className="relative z-10">
                     <DialogTitle className="text-2xl font-bold">{editingId ? "Editar Obra" : "Nova Obra Operacional"}</DialogTitle>
                     <p className="text-primary-foreground/70 text-sm mt-1">Registre ou atualize as informações técnicas da obra.</p>
                   </div>
                 </DialogHeader>
                 
                  <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-background">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código / Número *</Label>
                       <Input 
                         className="h-11 border-primary/10 focus-visible:ring-primary/20 font-mono font-bold uppercase"
                         placeholder="Ex: OB-2024-001" 
                         value={form.numero} 
                         onChange={(e)=>setForm({...form, numero: e.target.value})} 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da Obra *</Label>
                       <Input 
                         className="h-11 border-primary/10 focus-visible:ring-primary/20"
                         placeholder="Ex: Reforma Centro" 
                         value={form.nome} 
                         onChange={(e)=>setForm({...form, nome: e.target.value})} 
                       />
                     </div>
                   </div>
 
                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CEP</Label>
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input 
                              placeholder="00000-000" 
                              className="pl-7 h-10 border-primary/10 text-sm"
                              value={form.cep} 
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm({...form, cep: val});
                                if (val.replace(/\D/g, "").length === 8) {
                                  setTimeout(() => {
                                    const currentCep = val.replace(/\D/g, "");
                                    if (currentCep.length === 8) handleCepSearch(currentCep);
                                  }, 500);
                                }
                              }} 
                            />
                          </div>
                        </div>
                        <div className="md:col-span-6 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço</Label>
                          <div className="relative">
                            <MapPin className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input className="pl-7 h-10 border-primary/10 text-sm" value={form.endereco ?? ""} onChange={(e)=>setForm({...form, endereco: e.target.value})} placeholder="Rua, Av, etc..." />
                          </div>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Número</Label>
                          <Input className="h-10 border-primary/10 text-sm" value={form.numero_endereco ?? ""} onChange={(e)=>setForm({...form, numero_endereco: e.target.value})} placeholder="Ex: 123" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                          <Input className="h-10 border-primary/10 text-sm" value={form.bairro ?? ""} onChange={(e)=>setForm({...form, bairro: e.target.value})} />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                          <Input className="h-10 border-primary/10 text-sm" value={form.cidade} onChange={(e)=>setForm({...form, cidade: e.target.value})} />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estado</Label>
                          <Input className="h-10 border-primary/10 text-sm" value={form.estado} onChange={(e)=>setForm({...form, estado: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-dashed">
                        <div className="md:col-span-12 space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cliente</Label>
                          <div className="relative">
                            <User className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input className="pl-7 h-10 border-primary/10 text-sm" value={form.cliente ?? ""} onChange={(e)=>setForm({...form, cliente: e.target.value})} placeholder="Nome do Cliente/Empresa" />
                          </div>
                        </div>
                      </div>
                    </div>
 
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                     <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status da Obra</Label>
                       <Select value={form.status} onValueChange={(v)=>setForm({...form, status: v})}>
                         <SelectTrigger className="h-11 border-primary/10"><SelectValue/></SelectTrigger>
                         <SelectContent>
                           {STATUS.map((s)=>(
                             <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supervisor</Label>
                       <Select value={form.supervisor_id} onValueChange={(v)=>setForm({...form, supervisor_id: v})}>
                         <SelectTrigger className="h-11 border-primary/10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="none">Sem supervisor</SelectItem>
                           {supervisors.map((s) => (
                             <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
 
                   <div className="space-y-2 pt-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição / Observações</Label>
                     <Textarea className="min-h-[80px] border-primary/10 resize-none" value={form.descricao ?? ""} onChange={(e)=>setForm({...form, descricao: e.target.value})} />
                   </div>
                 </div>
 
                 <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
                   <Button variant="ghost" className="px-6 font-semibold" onClick={() => setOpen(false)}>Cancelar</Button>
                   <Button onClick={save} className="px-10 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                     {editingId ? "Atualizar Obra" : "Criar Obra"}
                   </Button>
                 </DialogFooter>
               </DialogContent>
           </Dialog>
         </div>
       )}
     />
      <div className="mb-3 max-w-sm">
        <Input placeholder="Buscar por número ou nome…" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nenhuma obra encontrada" description="Cadastre a primeira obra para iniciar." />
      ) : (
         <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
           <table className="w-full text-sm">
             <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Nome da Obra</th>
                  <th className="px-4 py-3 text-left">Cidade/UF</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y">
               {filtered.map((o)=>(
                 <tr key={o.id} className="hover:bg-accent/30 transition-colors group">
                    <td className="px-4 py-4">
                      <Link to={`/app/obras/${o.id}`} className="hover:underline font-mono font-bold text-primary text-xs">
                        {o.numero}
                      </Link>
                    </td>
                   <td className="px-4 py-4 font-medium">{o.nome}</td>
                   <td className="px-4 py-4 text-muted-foreground text-xs">{o.cidade}{o.estado ? ` / ${o.estado}` : "---"}</td>
                    <td className="px-4 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 border-primary/10 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => edit(o)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/10 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive transition-all" onClick={() => remove(o.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      )}
    </div>
  );
}