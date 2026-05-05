 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { toast } from "sonner";
 import { saveThemePrimary } from "@/hooks/useAppTheme";
 import { useAuth } from "@/lib/auth";
 import { useAuditLogger } from "@/hooks/useAuditLogger";
 import { Save, RotateCcw } from "lucide-react";
 
 export default function DesignSystemManager() {
   const { user } = useAuth();
   const { logAction } = useAuditLogger();
   const [loading, setLoading] = useState(false);
   const [primaryHsl, setPrimaryHsl] = useState({ h: 0, s: 72, l: 51 });
 
   const handleSave = async () => {
     if (!user) return;
     try {
       setLoading(true);
       await saveThemePrimary(primaryHsl.h, primaryHsl.s, primaryHsl.l);
       await logAction("UPDATE_DESIGN_SYSTEM", "DESIGN", null, primaryHsl);
       toast.success("Design System atualizado com sucesso!");
     } catch (e: any) {
       toast.error(e.message);
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle>Cores Globais</CardTitle>
           <CardDescription>Ajuste as cores principais do sistema usando HSL.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
               <div className="space-y-2">
                 <Label>Matiz (Hue): {primaryHsl.h}</Label>
                 <Slider value={[primaryHsl.h]} max={360} step={1} onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, h: v }))} />
               </div>
               <div className="space-y-2">
                 <Label>Saturação: {primaryHsl.s}%</Label>
                 <Slider value={[primaryHsl.s]} max={100} step={1} onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, s: v }))} />
               </div>
               <div className="space-y-2">
                 <Label>Luminosidade: {primaryHsl.l}%</Label>
                 <Slider value={[primaryHsl.l]} max={100} step={1} onValueChange={([v]) => setPrimaryHsl(p => ({ ...p, l: v }))} />
               </div>
             </div>
             <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-muted/20">
               <p className="text-sm font-medium mb-4">Preview em Tempo Real</p>
               <div className="space-y-4 w-full max-w-[200px]">
                 <Button className="w-full">Botão Primário</Button>
                 <Button variant="outline" className="w-full">Botão Outline</Button>
                 <div className="h-12 w-full rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">
                   BRAND COLOR
                 </div>
               </div>
             </div>
           </div>
           <div className="flex justify-end gap-3 pt-6 border-t">
             <Button variant="outline" onClick={() => setPrimaryHsl({ h: 0, s: 72, l: 51 })}>
               <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Padrão
             </Button>
             <Button onClick={handleSave} disabled={loading}>
               <Save className="h-4 w-4 mr-2" /> Salvar Alterações
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }