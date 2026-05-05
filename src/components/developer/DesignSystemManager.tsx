 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { Input } from "@/components/ui/input";
 import { toast } from "sonner";
 import { saveThemePrimary } from "@/hooks/useAppTheme";
 import { useAuth } from "@/lib/auth";
 import { useAuditLogger } from "@/hooks/useAuditLogger";
 import { Save, RotateCcw, Type, Square } from "lucide-react";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

 export default function DesignSystemManager() {
   const { user } = useAuth();
   const { logAction } = useAuditLogger();
   const [loading, setLoading] = useState(false);
   const [primaryHsl, setPrimaryHsl] = useState({ h: 0, s: 72, l: 51 });
   const [radius, setRadius] = useState(0.5);
   const [font, setFont] = useState("Inter");

   const handleSave = async () => {
     if (!user) return;
     try {
       setLoading(true);
       await saveThemePrimary(primaryHsl.h, primaryHsl.s, primaryHsl.l);
       // Also update radius globally via CSS variables
       document.documentElement.style.setProperty('--radius', `${radius}rem`);
       
       await logAction("UPDATE_DESIGN_SYSTEM", "DESIGN", null, { primaryHsl, radius, font });
       toast.success("Design System atualizado com sucesso!");
     } catch (e: any) {
       toast.error(e.message);
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className="space-y-6">
       <Tabs defaultValue="colors">
         <TabsList className="mb-4">
           <TabsTrigger value="colors" className="gap-2">Cores</TabsTrigger>
           <TabsTrigger value="shapes" className="gap-2">Formas & Raio</TabsTrigger>
           <TabsTrigger value="typography" className="gap-2">Tipografia</TabsTrigger>
         </TabsList>

         <TabsContent value="colors">
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
                   <p className="text-sm font-medium mb-4">Preview</p>
                   <div className="space-y-4 w-full max-w-[200px]">
                     <Button className="w-full" style={{ borderRadius: `${radius}rem` }}>Botão Primário</Button>
                     <div className="h-12 w-full flex items-center justify-center text-primary-foreground font-bold" style={{ backgroundColor: `hsl(${primaryHsl.h}, ${primaryHsl.s}%, ${primaryHsl.l}%)`, borderRadius: `${radius}rem` }}>
                       BRAND COLOR
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="shapes">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Square className="h-5 w-5" /> Arredondamento (Border Radius)</CardTitle>
               <CardDescription>Controle o quão arredondados são os elementos da interface.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label>Border Radius: {radius}rem</Label>
                 <Slider value={[radius]} max={2} step={0.1} onValueChange={([v]) => setRadius(v)} />
               </div>
               <div className="grid grid-cols-3 gap-4 mt-8">
                 <div className="p-4 border bg-card text-center" style={{ borderRadius: `${radius}rem` }}>Card Example</div>
                 <Input placeholder="Input Example" style={{ borderRadius: `${radius}rem` }} />
                 <Button style={{ borderRadius: `${radius}rem` }}>Button Example</Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="typography">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Fontes do Sistema</CardTitle>
               <CardDescription>Selecione a família de fontes principal.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Fonte Principal</Label>
                 <Input value={font} onChange={(e) => setFont(e.target.value)} placeholder="Ex: Inter, Roboto, Open Sans" />
               </div>
               <div className="p-6 border rounded-lg bg-muted/10 space-y-4" style={{ fontFamily: font }}>
                 <h1 className="text-2xl font-bold">Título de Exemplo</h1>
                 <p>Este é um parágrafo de exemplo para visualizar como a fonte se comporta no sistema. O desenvolvedor tem controle total sobre a experiência visual do usuário.</p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

       <div className="flex justify-end gap-3 pt-6 border-t">
         <Button variant="outline" onClick={() => {
           setPrimaryHsl({ h: 0, s: 72, l: 51 });
           setRadius(0.5);
           setFont("Inter");
         }}>
           <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Padrão
         </Button>
         <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
           <Save className="h-4 w-4 mr-2" /> Aplicar em Todo o Sistema
         </Button>
       </div>
     </div>
   );
 }