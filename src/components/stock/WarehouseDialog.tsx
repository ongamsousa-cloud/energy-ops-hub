import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
  warehouse?: any;
}

export default function WarehouseDialog({ open, onOpenChange, onSuccess, warehouse }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", is_mobile: false, active: true });

  useEffect(() => {
    if (warehouse) setForm({ name: warehouse.name || "", location: warehouse.location || "", is_mobile: !!warehouse.is_mobile, active: warehouse.active !== false });
    else setForm({ name: "", location: "", is_mobile: false, active: true });
  }, [warehouse, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (warehouse?.id) {
        const { error } = await supabase.from("warehouses").update(form).eq("id", warehouse.id);
        if (error) throw error;
        toast.success("Almoxarifado atualizado");
      } else {
        const { error } = await supabase.from("warehouses").insert(form);
        if (error) throw error;
        toast.success("Almoxarifado criado");
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{warehouse ? "Editar" : "Novo"} Almoxarifado</DialogTitle>
          <DialogDescription>Cadastre depósitos fixos ou veículos móveis.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Nome</Label>
            <Input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Ex: Almoxarifado Central"/></div>
          <div className="space-y-2"><Label>Localização</Label>
            <Input value={form.location} onChange={e=>setForm({...form, location: e.target.value})} placeholder="Endereço ou placa do veículo"/></div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><Label>Almoxarifado móvel</Label>
              <p className="text-xs text-muted-foreground">Veículos das equipes em campo</p></div>
            <Switch checked={form.is_mobile} onCheckedChange={v=>setForm({...form, is_mobile: v})}/>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><Label>Ativo</Label></div>
            <Switch checked={form.active} onCheckedChange={v=>setForm({...form, active: v})}/>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
