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
 
 interface NewMaterialDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSuccess: () => void;
   material?: any;
 }
 
 export default function NewMaterialDialog({ open, onOpenChange, onSuccess, material }: NewMaterialDialogProps) {
   const [loading, setLoading] = useState(false);
   const [categories, setCategories] = useState<any[]>([]);
   const [formData, setFormData] = useState({
     code: "",
     name: "",
     description: "",
     category_id: "",
     unit: "un",
     cost_price: "0",
     sale_price: "0",
     minimum_stock: "0",
     critical_stock: "0"
   });
 
   useEffect(() => {
     if (open) {
       loadCategories();
       if (material) {
         setFormData({
           code: material.code || "",
           name: material.name || "",
           description: material.description || "",
           category_id: material.category_id || "",
           unit: material.unit || "un",
           cost_price: String(material.cost_price || 0),
           sale_price: String(material.sale_price || 0),
           minimum_stock: String(material.minimum_stock || 0),
           critical_stock: String(material.critical_stock || 0)
         });
       } else {
         setFormData({
           code: "",
           name: "",
           description: "",
           category_id: "",
           unit: "un",
           cost_price: "0",
           sale_price: "0",
           minimum_stock: "0",
           critical_stock: "0"
         });
       }
     }
   }, [open, material]);
 
   async function loadCategories() {
     const { data } = await supabase.from("material_categories").select("*").order("name");
     if (data) setCategories(data);
   }
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     setLoading(true);
     try {
       const payload = {
         code: formData.code,
         name: formData.name,
         description: formData.description,
         category_id: formData.category_id || null,
         unit: formData.unit,
         cost_price: parseFloat(formData.cost_price),
         sale_price: parseFloat(formData.sale_price),
         minimum_stock: parseFloat(formData.minimum_stock),
         critical_stock: parseFloat(formData.critical_stock)
       };
 
       const { error } = material?.id 
         ? await supabase.from("materials").update(payload).eq("id", material.id)
         : await supabase.from("materials").insert(payload);
 
       if (error) throw error;
 
       toast.success(material?.id ? "Material atualizado!" : "Material cadastrado!");
       onSuccess();
       onOpenChange(false);
       setFormData({
         code: "",
         name: "",
         description: "",
         category_id: "",
         unit: "un",
         cost_price: "0",
         sale_price: "0",
         minimum_stock: "0",
         critical_stock: "0"
       });
     } catch (err: any) {
       toast.error("Erro ao cadastrar material: " + err.message);
     } finally {
       setLoading(false);
     }
   }
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{material ? "Editar Material" : "Novo Material"}</DialogTitle>
           <DialogDescription>{material ? "Atualize as informações do item no catálogo." : "Cadastre um novo item no catálogo de materiais."}</DialogDescription>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 pt-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="code">Código do Produto</Label>
               <Input id="code" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ex: CAB-001" />
             </div>
             <div className="space-y-2">
               <Label htmlFor="name">Nome do Material</Label>
               <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Cabo Multiplexado 16mm" />
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Categoria</Label>
               <Select value={formData.category_id} onValueChange={val => setFormData({...formData, category_id: val})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione..." />
                 </SelectTrigger>
                 <SelectContent>
                   {categories.map(cat => (
                     <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="unit">Unidade de Medida</Label>
               <Input id="unit" required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Ex: m, un, kg" />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="description">Descrição Técnica</Label>
             <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalhes adicionais..." />
           </div>
 
           <div className="grid grid-cols-2 gap-4 border-t pt-4">
             <div className="space-y-2">
               <Label htmlFor="cost_price">Custo Unitário (R$)</Label>
               <Input id="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="sale_price">Preço de Saída (R$)</Label>
               <Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} />
             </div>
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="minimum_stock">Estoque Mínimo</Label>
               <Input id="minimum_stock" type="number" value={formData.minimum_stock} onChange={e => setFormData({...formData, minimum_stock: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label htmlFor="critical_stock">Estoque Crítico</Label>
               <Input id="critical_stock" type="number" value={formData.critical_stock} onChange={e => setFormData({...formData, critical_stock: e.target.value})} />
             </div>
           </div>
 
           <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
             <Button type="submit" disabled={loading}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Salvar Material
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 }