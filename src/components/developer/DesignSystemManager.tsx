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
  import { Save, RotateCcw, Type, Square, RefreshCcw, History, Upload, Image as ImageIcon } from "lucide-react";
  import { supabase } from "@/integrations/supabase/client";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { developerService } from "@/services/developerService";

 export default function DesignSystemManager() {
   const { user } = useAuth();
   const [loading, setLoading] = useState(false);
   const [primaryHsl, setPrimaryHsl] = useState({ h: 0, s: 72, l: 51 });
   const [radius, setRadius] = useState(0.5);
    const [font, setFont] = useState("Inter");
    const [logoUrl, setLogoUrl] = useState("");
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);

    const loadBackups = async () => {
      const data = await developerService.listBackups('design_system');
      setBackups(data || []);
    };

    useEffect(() => {
      loadBackups();
      loadSettings();
      loadLogo();
    }, []);

    const loadSettings = async () => {
     try {
       const settings = await developerService.getDesignSettings() as any;
       if (settings.primaryHsl) setPrimaryHsl(settings.primaryHsl);
       if (settings.radius) setRadius(settings.radius);
       if (settings.font) setFont(settings.font);
     } catch (e) {
       console.error("Erro ao carregar configurações", e);
     }
   };

    const loadLogo = async () => {
      try {
        const url = await developerService.getLogo();
        setLogoUrl(url);
      } catch (e) {
        console.error("Erro ao carregar logo", e);
      }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      try {
        setUploadingLogo(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('system-assets')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('system-assets')
          .getPublicUrl(fileName);

        setLogoUrl(publicUrl);
        toast.success("Logo carregada com sucesso! Clique em Persistir para aplicar.");
      } catch (e: any) {
        toast.error(`Erro no upload: ${e.message}`);
      } finally {
        setUploadingLogo(false);
      }
    };

   const handleSave = async () => {
     if (!user) return;
     try {
       setLoading(true);
       // 1. Atualizar banco de dados para persistência global
        await saveThemePrimary(primaryHsl.h, primaryHsl.s, primaryHsl.l);
        await developerService.saveDesignSettings({
          primaryHsl,
          radius,
          font
        });

        if (logoUrl) {
          await developerService.updateLogo(logoUrl);
        }

        // 2. Aplicar visualmente no cliente atual (instantâneo)
        document.documentElement.style.setProperty('--radius', `${radius}rem`);
        document.body.style.fontFamily = font;
        
        await developerService.createBackup(`Design ${new Date().toLocaleString()}`, 'design_system', { primaryHsl, radius, font, logoUrl });
        await developerService.logAction("UPDATE_DESIGN_SYSTEM", "DESIGN", { primaryHsl, radius, font, logoUrl });
        
        // Force update of logo in AppShell if needed (event emitter or location reload)
        toast.success("Design System e Logo persistidos com sucesso!");
        loadBackups();
     } catch (e: any) {
       toast.error(e.message);
     } finally {
       setLoading(false);
     }
   };

    const handleRestore = async (backup: any) => {
      setPrimaryHsl(backup.data.primaryHsl);
      setRadius(backup.data.radius);
      setFont(backup.data.font);
      toast.success("Design System restaurado do backup!");
    };

    // Função para preview em tempo real sem salvar
   useEffect(() => {
     const root = document.documentElement;
     root.style.setProperty("--primary", `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
     root.style.setProperty("--radius", `${radius}rem`);
   }, [primaryHsl, radius]);

   return (
     <div className="space-y-6">
       <Tabs defaultValue="colors">
         <TabsList className="mb-4">
           <TabsTrigger value="colors" className="gap-2">Cores</TabsTrigger>
           <TabsTrigger value="shapes" className="gap-2">Formas & Raio</TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">Tipografia</TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">Branding</TabsTrigger>
         </TabsList>

         <TabsContent value="colors">
           <Card>
             <CardHeader>
               <CardTitle>Cores Globais</CardTitle>
               <CardDescription>O sistema atualizará automaticamente todos os componentes que usam a cor primária.</CardDescription>
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
                   <p className="text-sm font-medium mb-4">Preview do Componente</p>
                   <div className="space-y-4 w-full max-w-[200px]">
                     <Button className="w-full">Botão Primário</Button>
                     <div className="h-12 w-full flex items-center justify-center text-primary-foreground font-bold bg-primary" style={{ borderRadius: `${radius}rem` }}>
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
               <CardDescription>Veja a mudança em tempo real nos botões e inputs ao redor.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label>Border Radius: {radius}rem</Label>
                 <Slider value={[radius]} max={2} step={0.1} onValueChange={([v]) => setRadius(v)} />
               </div>
               <div className="grid grid-cols-3 gap-4 mt-8">
                 <div className="p-4 border bg-card text-center" style={{ borderRadius: `${radius}rem` }}>Card Example</div>
                 <Input placeholder="Input Example" />
                 <Button>Button Example</Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Identidade Visual</CardTitle>
                <CardDescription>Gerencie a logomarca principal do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Logomarca Principal</Label>
                      <div className="flex flex-col gap-4">
                        <div className="p-4 border rounded-lg bg-muted/20 flex items-center justify-center min-h-[120px]">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo Preview" className="max-h-20 object-contain" />
                          ) : (
                            <div className="text-muted-foreground text-sm">Nenhuma logo carregada</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            id="logo-upload" 
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={uploadingLogo}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingLogo ? "Enviando..." : "Substituir Logo"}
                          </Button>
                          {logoUrl && (
                            <Button 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => setLogoUrl("")}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 p-6 border rounded-xl bg-card">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Contexto de Aplicação</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-2 border-b">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-xs font-bold">Preview na Barra Superior</span>
                      </div>
                      <div className="p-8 bg-muted/30 rounded-lg flex flex-col items-center justify-center gap-4">
                        <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                        <span className="text-sm font-medium">Tela de Login</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Fontes do Sistema</CardTitle>
               <CardDescription>As fontes serão aplicadas ao salvar.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label>Fonte Principal</Label>
                 <Input value={font} onChange={(e) => setFont(e.target.value)} placeholder="Ex: Inter, Roboto, Open Sans" />
               </div>
               <div className="p-6 border rounded-lg bg-muted/10 space-y-4" style={{ fontFamily: font }}>
                 <h1 className="text-2xl font-bold">Título de Exemplo</h1>
                 <p>Preview da tipografia escolhida para o sistema.</p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

       <div className="flex justify-between items-center pt-6 border-t">
         <Button variant="ghost" size="sm" onClick={loadSettings} className="text-muted-foreground">
           <RefreshCcw className="h-4 w-4 mr-2" /> Recarregar Configurações
         </Button>
         <div className="flex gap-3">
           <Button variant="outline" onClick={() => {
             setPrimaryHsl({ h: 0, s: 72, l: 51 });
             setRadius(0.5);
             setFont("Inter");
           }}>
             <RotateCcw className="h-4 w-4 mr-2" /> Restaurar Padrão
           </Button>
           <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
             <Save className="h-4 w-4 mr-2" /> PERSISTIR ALTERAÇÕES
           </Button>
         </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Histórico de Backups (Design)
            </CardTitle>
            <CardDescription>Reverta o visual do sistema para estados anteriores.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum backup de design encontrado.</p>
              ) : (
                backups.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold">{b.name}</p>
                      <div className="flex gap-2 mt-1">
                        <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: `hsl(${b.data.primaryHsl.h}, ${b.data.primaryHsl.s}%, ${b.data.primaryHsl.l}%)` }} />
                        <span className="text-[10px] text-muted-foreground">{b.data.font} · Radius {b.data.radius}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-2" onClick={() => handleRestore(b)}>
                      <RotateCcw className="h-3 w-3" /> Restaurar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }