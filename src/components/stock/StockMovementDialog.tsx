import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

type MovType = "entrada" | "saida" | "transferencia" | "devolucao" | "ajuste";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
  materialId?: string;
  defaultType?: MovType;
  osId?: string;
}

export default function StockMovementDialog({ open, onOpenChange, onSuccess, materialId, defaultType = "entrada", osId }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    type: defaultType as MovType,
    material_id: materialId || "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "",
    unit_cost: "",
    os_id: osId || "",
    professional_id: "",
    invoice_number: "",
    supplier: "",
    batch_number: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
      setForm(f => ({ ...f, type: defaultType, material_id: materialId || "", os_id: osId || "" }));
    }
  }, [open, defaultType, materialId, osId]);

  useEffect(() => {
    if (form.material_id && form.from_warehouse_id) {
      supabase.from("stock_levels").select("quantity").eq("material_id", form.material_id).eq("warehouse_id", form.from_warehouse_id).maybeSingle()
        .then(({ data }) => setStockLevels(p => ({ ...p, [`${form.material_id}-${form.from_warehouse_id}`]: Number(data?.quantity || 0) })));
    }
  }, [form.material_id, form.from_warehouse_id]);

  async function loadData() {
    const [mats, whs, oss, pros] = await Promise.all([
      supabase.from("materials").select("id, name, code, unit, cost_price").eq("active", true).order("name"),
      supabase.from("warehouses").select("id, name, is_mobile").eq("active", true).order("name"),
      supabase.from("ordens_servico").select("id, numero").order("created_at",{ascending:false}).limit(50),
      supabase.from("profiles").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    if (mats.data) setMaterials(mats.data);
    if (whs.data) setWarehouses(whs.data);
    if (oss.data) setServiceOrders(oss.data);
    if (pros.data) setProfessionals(pros.data);
  }

  const needsFrom = ["saida","transferencia","ajuste"].includes(form.type);
  const needsTo = ["entrada","transferencia","devolucao"].includes(form.type);
  const showOS = ["saida","devolucao"].includes(form.type);
  const showFiscal = form.type === "entrada";
  const requiresReason = form.type === "ajuste";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.material_id) return toast.error("Selecione o material");
    const qty = parseFloat(form.quantity);
    if (!qty || qty <= 0) return toast.error("Quantidade inválida");
    if (requiresReason && !form.reason.trim()) return toast.error("Motivo é obrigatório para ajuste/perda");

    if (needsFrom && form.from_warehouse_id) {
      const balance = stockLevels[`${form.material_id}-${form.from_warehouse_id}`] || 0;
      if (balance < qty) return toast.error(`Saldo insuficiente. Disponível: ${balance}`);
    }

    setLoading(true);
    try {
      const cost = parseFloat(form.unit_cost) || materials.find(m => m.id === form.material_id)?.cost_price || 0;
      const payload: any = {
        material_id: form.material_id,
        from_warehouse_id: needsFrom ? form.from_warehouse_id || null : null,
        to_warehouse_id: needsTo ? form.to_warehouse_id || null : null,
        quantity: qty,
        type: form.type,
        os_id: form.os_id && form.os_id !== "none" ? form.os_id : null,
        professional_id: form.professional_id && form.professional_id !== "none" ? form.professional_id : null,
        unit_cost: cost,
        total_cost: cost * qty,
        invoice_number: form.invoice_number || null,
        supplier: form.supplier || null,
        batch_number: form.batch_number || null,
        reason: form.reason || null,
        notes: form.notes || null,
        status: "confirmado",
        created_by: user.id,
      };
      const { error } = await supabase.from("stock_movements").insert(payload);
      if (error) throw error;
      toast.success("Movimentação registrada");
      onSuccess();
      onOpenChange(false);
      setForm(f => ({ ...f, quantity: "", notes: "", reason: "", invoice_number: "", supplier: "", batch_number: "" }));
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  const balance = form.from_warehouse_id && form.material_id ? stockLevels[`${form.material_id}-${form.from_warehouse_id}`] : null;

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
         <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
             <Loader2 className="h-32 w-32 text-white animate-spin-slow" />
           </div>
           <div className="relative z-10">
             <DialogTitle className="text-2xl font-bold">Movimentação de Estoque</DialogTitle>
             <p className="text-primary-foreground/70 text-sm mt-1">Registre o fluxo de entrada e saída de materiais.</p>
           </div>
         </DialogHeader>
         <form onSubmit={submit} className="p-8 space-y-5 bg-background overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v: MovType)=>setForm({...form, type: v, from_warehouse_id: "", to_warehouse_id: ""})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (compra/recebimento)</SelectItem>
                  <SelectItem value="saida">Saída para OS</SelectItem>
                  <SelectItem value="devolucao">Devolução de OS</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="ajuste">Ajuste / Perda</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="space-y-1.5"><Label>Material</Label>
              <Select value={form.material_id} onValueChange={v=>setForm({...form, material_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.code} · {m.name}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {needsFrom && <div className="space-y-1.5"><Label>Origem</Label>
              <Select value={form.from_warehouse_id} onValueChange={v=>setForm({...form, from_warehouse_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}{w.is_mobile?" (móvel)":""}</SelectItem>)}</SelectContent>
              </Select>
              {balance !== null && <p className="text-[11px] text-muted-foreground">Saldo disponível: <strong>{balance}</strong></p>}
            </div>}
            {needsTo && <div className="space-y-1.5"><Label>Destino</Label>
              <Select value={form.to_warehouse_id} onValueChange={v=>setForm({...form, to_warehouse_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}{w.is_mobile?" (móvel)":""}</SelectItem>)}</SelectContent>
              </Select></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Quantidade</Label>
              <Input type="number" step="0.01" required value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})}/></div>
            <div className="space-y-1.5"><Label>Custo unitário (R$)</Label>
              <Input type="number" step="0.01" value={form.unit_cost} onChange={e=>setForm({...form, unit_cost: e.target.value})} placeholder="Padrão do material"/></div>
          </div>

          {showOS && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Ordem de Serviço</Label>
                <Select value={form.os_id} onValueChange={v=>setForm({...form, os_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {serviceOrders.map(o => <SelectItem key={o.id} value={o.id}>OS {o.numero}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>Profissional</Label>
                <Select value={form.professional_id} onValueChange={v=>setForm({...form, professional_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Quem retirou..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select></div>
            </div>
          )}

          {showFiscal && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>NF</Label>
                <Input value={form.invoice_number} onChange={e=>setForm({...form, invoice_number: e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Fornecedor</Label>
                <Input value={form.supplier} onChange={e=>setForm({...form, supplier: e.target.value})}/></div>
              <div className="space-y-1.5"><Label>Lote</Label>
                <Input value={form.batch_number} onChange={e=>setForm({...form, batch_number: e.target.value})}/></div>
            </div>
          )}

          {requiresReason && (
            <div className="space-y-1.5"><Label>Motivo {requiresReason && <span className="text-destructive">*</span>}</Label>
              <Select value={form.reason} onValueChange={v=>setForm({...form, reason: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="quebra">Quebra/Danificado</SelectItem>
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                  <SelectItem value="inventario">Ajuste de inventário</SelectItem>
                  <SelectItem value="furto">Furto/Extravio</SelectItem>
                </SelectContent>
              </Select></div>
          )}

          <div className="space-y-1.5"><Label>Observações</Label>
            <Textarea value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} rows={2}/></div>

         </form>
         <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
           <Button type="button" variant="ghost" className="px-6 font-semibold" onClick={()=>onOpenChange(false)}>Cancelar</Button>
           <Button type="submit" form="stock-mov-form" className="px-10 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={loading}>
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Confirmar Movimentação
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
