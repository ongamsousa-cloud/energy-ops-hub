 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { toast } from "sonner";
 import { Loader2 } from "lucide-react";
 import { useAuth } from "@/lib/auth";
 
 interface StockMovementDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
   materialId?: string;
 }
 
 export default function StockMovementDialog({ open, onOpenChange, onSuccess, materialId }: StockMovementDialogProps) {
   const { user } = useAuth();
   const [loading, setLoading] = useState(false);
   const [materials, setMaterials] = useState<any[]>([]);
   const [warehouses, setWarehouses] = useState<any[]>([]);
   const [serviceOrders, setServiceOrders] = useState<any[]>([]);
   
   const [formData, setFormData] = useState({
     material_id: materialId || "",
     from_warehouse_id: "",
     to_warehouse_id: "",
     quantity: "",
     type: "entrada",
     os_id: "",
     notes: ""
   });
 
   useEffect(() => {
     if (open) {
       loadData();
       if (materialId) setFormData(prev => ({ ...prev, material_id: materialId }));
     }
   }, [open, materialId]);
 
   async function loadData() {
     const [mats, whs, oss] = await Promise.all([
       supabase.from("materials").select("id, name, code").eq("active", true).order("name"),
       supabase.from("warehouses").select("id, name").eq("active", true).order("name"),
       supabase.from("ordens_servico").select("id, numero").order("created_at", { ascending: false }).limit(20)
     ]);
     
     if (mats.data) setMaterials(mats.data);
     if (whs.data) setWarehouses(whs.data);
     if (oss.data) setServiceOrders(oss.data);
   }
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (!user) return;
     setLoading(true);
     
     try {
       const { error } = await supabase.from("stock_movements").insert({
         material_id: formData.material_id,
         from_warehouse_id: formData.from_warehouse_id || null,
         to_warehouse_id: formData.to_warehouse_id || null,
         quantity: parseFloat(formData.quantity),
         type: formData.type as any,
         os_id: formData.os_id || null,
         notes: formData.notes,
         created_by: user.id
       });
 
       if (error) throw error;
 
       toast.success("Movimentação registrada com sucesso!");
       onSuccess();
       onOpenChange(false);
     } catch (err: any) {
       toast.error("Erro ao registrar movimentação: " + err.message);
     } finally {
       setLoading(false);
     }
   }
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[500px]">
         <DialogHeader>
           <DialogTitle>Movimentação de Estoque</DialogTitle>
           <DialogDescription>Registre entradas, saídas ou transferências de materiais.</DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 pt-4">
           <div className="space-y-2">
             <Label>Tipo de Movimentação</Label>
             <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val, from_warehouse_id: "", to_warehouse_id: ""})}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="entrada">Entrada (Compra/Reposição)</SelectItem>
                 <SelectItem value="saida">Saída (Consumo/Perda)</SelectItem>
                 <SelectItem value="transferencia">Transferência entre Locais</SelectItem>
                 <SelectItem value="devolucao">Devolução (da OS para Estoque)</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Material</Label>
             <Select value={formData.material_id} onValueChange={val => setFormData({...formData, material_id: val})}>
               <SelectTrigger>
                 <SelectValue placeholder="Selecione o material..." />
               </SelectTrigger>
               <SelectContent>
                 {materials.map(m => (
                   <SelectItem key={m.id} value={m.id}>{m.code} - {m.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             {formData.type !== 'entrada' && (
               <div className="space-y-2">
                 <Label>Origem</Label>
                 <Select value={formData.from_warehouse_id} onValueChange={val => setFormData({...formData, from_warehouse_id: val})}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione..." />
                   </SelectTrigger>
                   <SelectContent>
                     {warehouses.map(w => (
                       <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
             {formData.type !== 'saida' && (
               <div className="space-y-2">
                 <Label>Destino</Label>
                 <Select value={formData.to_warehouse_id} onValueChange={val => setFormData({...formData, to_warehouse_id: val})}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione..." />
                   </SelectTrigger>
                   <SelectContent>
                     {warehouses.map(w => (
                       <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="qty">Quantidade</Label>
               <Input id="qty" type="number" step="0.01" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Vincular OS (Opcional)</Label>
               <Select value={formData.os_id} onValueChange={val => setFormData({...formData, os_id: val})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Nenhuma" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Nenhuma</SelectItem>
                   {serviceOrders.map(os => (
                     <SelectItem key={os.id} value={os.id}>OS #{os.numero}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="notes">Observações / Motivo</Label>
             <Input id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Ex: NF 1234, Devolução de obra, etc." />
           </div>
 
           <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <Button type="submit" disabled={loading}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Confirmar
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }