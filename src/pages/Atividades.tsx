import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Paperclip, 
  X, 
  Loader2, 
  Upload,
  ExternalLink,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function Atividades() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    codigo_item: "",
    descricao: "",
    unidade: "Unidade",
    umd_unitaria: 0,
    categoria_id: "",
    anexos: [] as string[]
  });

  const cat = params.get("categoria") ?? "";

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from("categorias").select("*").order("nome");
      setCats(catData ?? []);

      let qb = supabase.from("atividades").select("*, categoria:categorias(nome)").eq("ativo", true).order("codigo_item");
      if (cat) qb = qb.eq("categoria_id", cat);
      
      const { data } = await qb;
      setRows(data ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cat]);

  const handleAdd = () => {
    setSelectedActivity(null);
    setFormData({
      codigo_item: "",
      descricao: "",
      unidade: "Unidade",
      umd_unitaria: 0,
      categoria_id: cat || (cats[0]?.id || ""),
      anexos: []
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (activity: any) => {
    setSelectedActivity(activity);
    setFormData({
      codigo_item: activity.codigo_item,
      descricao: activity.descricao,
      unidade: activity.unidade,
      umd_unitaria: Number(activity.umd_unitaria),
      categoria_id: activity.categoria_id,
      anexos: activity.anexos || []
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (activity: any) => {
    setSelectedActivity(activity);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("atividades")
        .update({ ativo: false })
        .eq("id", selectedActivity.id);
      
      if (error) throw error;
      
      toast.success("Atividade removida com sucesso");
      setRows(rows.filter(r => r.id !== selectedActivity.id));
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        umd_unitaria: Number(formData.umd_unitaria)
      };

      if (selectedActivity) {
        const { error } = await supabase
          .from("atividades")
          .update(payload)
          .eq("id", selectedActivity.id);
        if (error) throw error;
        toast.success("Atividade atualizada");
      } else {
        const { error } = await supabase
          .from("atividades")
          .insert([payload]);
        if (error) throw error;
        toast.success("Atividade criada");
      }
      
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAnexos = [...formData.anexos];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `atividades/${fileName}`;

      try {
        const { data, error } = await supabase.storage
          .from('atividades-anexos')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('atividades-anexos')
          .getPublicUrl(filePath);

        newAnexos.push(publicUrl);
      } catch (error: any) {
        toast.error(`Erro ao subir arquivo ${file.name}: ${error.message}`);
      }
    }

    setFormData({ ...formData, anexos: newAnexos });
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAnexo = (url: string) => {
    setFormData({
      ...formData,
      anexos: formData.anexos.filter(a => a !== url)
    });
  };

  const filtered = rows.filter((r) => !q || r.codigo_item.toLowerCase().includes(q.toLowerCase()) || r.descricao.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Atividades" description="Gerencie o catálogo técnico de serviços e UMDs." />
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/app/atividades/importar">
              <Download className="mr-2 h-4 w-4" />
              Importar Excel
            </Link>
          </Button>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border border-border">
        <div className="flex-1 min-w-[200px]">
          <Input 
            placeholder="Buscar por código ou descrição…" 
            value={q} 
            onChange={(e)=>setQ(e.target.value)}
            className="bg-background"
          />
        </div>
        <Select 
          value={cat || "all"} 
          onValueChange={(v)=>{ 
            const p=new URLSearchParams(params); 
            v==="all"?p.delete("categoria"):p.set("categoria",v); 
            setParams(p); 
          }}
        >
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Filtrar por Categoria"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {cats.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhuma atividade encontrada" description="Ajuste os filtros ou crie uma nova atividade." />
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-center">Unidade</th>
                  <th className="px-4 py-3 font-semibold text-right">UMD</th>
                  <th className="px-4 py-3 font-semibold text-center">Anexos</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a)=>(
                  <tr key={a.id} className="hover:bg-accent/50 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{a.codigo_item}</td>
                    <td className="px-4 py-3 font-medium">{a.descricao}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-normal">{a.categoria?.nome}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{a.unidade}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{Number(a.umd_unitaria).toFixed(4)}</td>
                    <td className="px-4 py-3 text-center">
                      {a.anexos && a.anexos.length > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <Paperclip className="h-3 w-3" /> {a.anexos.length}
                        </Badge>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(a)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedActivity ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para salvar a atividade técnica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Item</Label>
                <Input 
                  id="codigo" 
                  value={formData.codigo_item} 
                  onChange={(e) => setFormData({...formData, codigo_item: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria_id} 
                  onValueChange={(v) => setFormData({...formData, categoria_id: v})}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input 
                id="descricao" 
                value={formData.descricao} 
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input 
                  id="unidade" 
                  value={formData.unidade} 
                  onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="umd">UMD Unitária</Label>
                <Input 
                  id="umd" 
                  type="number" 
                  step="0.0001" 
                  value={formData.umd_unitaria} 
                  onChange={(e) => setFormData({...formData, umd_unitaria: Number(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Anexos / Documentação</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.anexos.map((url, i) => (
                  <div key={i} className="relative group">
                    <div className="h-16 w-16 rounded border border-border bg-muted flex items-center justify-center overflow-hidden">
                      {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={url} alt="Anexo" className="h-full w-full object-cover" />
                      ) : (
                        <Paperclip className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeAnexo(url)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileUpload}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Clique no + para anexar imagens ou documentos técnicos à atividade.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Atividade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desativar a atividade <strong>{selectedActivity?.codigo_item}</strong>. Ela não aparecerá mais nos novos lançamentos, mas o histórico será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}