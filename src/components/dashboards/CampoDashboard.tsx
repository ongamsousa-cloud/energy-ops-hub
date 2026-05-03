 import { useRef, useState, useEffect } from "react";
 import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
 import { CheckCircle2, Clock, ClipboardList, Target, ArrowRight, Activity, MapPin, Plus, Camera, Video, AlertCircle, Map as MapIcon } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Link } from "react-router-dom";
 import StatusBadge from "@/components/StatusBadge";
 import { mediaService, geoLocationService, notificationService } from "@/services";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/lib/auth";
 import { toast } from "sonner";

interface CampoDashboardProps { stats: any; profile: any; }

export default function CampoDashboard({ stats }: CampoDashboardProps) {
  const { user } = useAuth();
  const metaMensal = 2000;
  const progresso = Math.min(100, (stats.umd / metaMensal) * 100);
  const osAtiva = stats.osAtiva;
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

   async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean) {
     const file = e.target.files?.[0];
     if (!file) return;
     if (!osAtiva?.id) { toast.error("Inicie uma OS antes de enviar mídia"); return; }
     if (file.size > 1073741824) { toast.error("Arquivo maior que 1 GB"); return; }
 
     setUploading(true);
     try {
       const result = await mediaService.uploadMedia(
         file,
         osAtiva.id,
         user!.id,
         "execucao_rapida",
         "Enviado via registro rápido do dashboard"
       );
 
       if (result.success) {
         toast.success(isVideo ? "Vídeo enviado com sucesso" : "Foto enviada com sucesso");
         await notificationService.criarNotificacao({
           user_id: user!.id,
           title: "Mídia enviada",
           message: `Você enviou um(a) ${isVideo ? 'vídeo' : 'foto'} para a OS #${osAtiva.numero}.`,
           service_order_id: osAtiva.id,
           type: "success"
         });
       } else {
         throw new Error("Falha no upload");
       }
     } catch (err: any) {
       toast.error(err.message || "Falha no upload");
     } finally {
       setUploading(false);
       e.target.value = "";
     }
   }
 
   async function handleCheckIn() {
     if (!osAtiva?.id) return;
     const success = await geoLocationService.registrarLocalizacaoNaOrdem(osAtiva.id, "check-in dashboard");
     if (success) {
       toast.success("Localização registrada com sucesso");
     } else {
       toast.error("Falha ao registrar localização. Verifique o GPS.");
     }
   }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-none border-l-4 border-l-blue-500">
          <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Minhas OS</span>
          <span className="block text-2xl font-bold mt-1">{stats.osAbertas + stats.osAprov + stats.osPend}</span>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /><span>{stats.osAbertas} em andamento</span>
          </div>
        </Card>
        <Card className="p-4 shadow-none border-l-4 border-l-green-500">
          <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Produtividade (UMD)</span>
          <span className="block text-2xl font-bold mt-1">{stats.umd.toLocaleString()}</span>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /><span>{stats.osAprov} aprovadas</span>
          </div>
        </Card>
        <Card className="p-4 shadow-none border-l-4 border-l-amber-500">
          <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Aguardando Revisão</span>
          <span className="block text-2xl font-bold mt-1">{stats.osPend}</span>
          <p className="text-[10px] text-muted-foreground mt-2">Pendente de validação</p>
        </Card>
        <Card className="p-4 shadow-none border-l-4 border-l-red-500">
          <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Reprovadas</span>
          <span className="block text-2xl font-bold mt-1 text-red-600">{stats.osRejeitadas}</span>
          <p className="text-[10px] text-muted-foreground mt-2">Necessita correção</p>
        </Card>
      </div>

      {/* Ação rápida de campo */}
      <Card className="p-5 shadow-none border-2 border-dashed border-primary/30 bg-primary/5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />Registro rápido de campo</h4>
            {osAtiva ? (
              <p className="text-xs text-muted-foreground mt-1">
                OS ativa: <Link to={`/app/os/${osAtiva.id}`} className="font-bold text-primary hover:underline">#{osAtiva.numero}</Link> · {osAtiva.obra?.nome}
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Nenhuma OS em execução. Inicie uma OS para enviar fotos/vídeos.
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
           <Button size="lg" className="h-14 gap-2 flex flex-col items-center justify-center pt-2" disabled={!osAtiva || uploading} onClick={() => photoRef.current?.click()}>
             <Camera className="h-5 w-5" /><span className="text-[10px]">Tirar Foto</span>
           </Button>
           <Button size="lg" variant="secondary" className="h-14 gap-2 flex flex-col items-center justify-center pt-2" disabled={!osAtiva || uploading} onClick={() => videoRef.current?.click()}>
             <Video className="h-5 w-5" /><span className="text-[10px]">Gravar Vídeo</span>
           </Button>
           <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
             <Button size="lg" variant="outline" className="h-14 gap-2 flex flex-col items-center justify-center pt-2" disabled={!osAtiva} onClick={handleCheckIn}>
               <MapIcon className="h-5 w-5" /><span className="text-[10px]">GPS</span>
             </Button>
             <Link to={osAtiva ? `/app/os/${osAtiva.id}` : "/app/os"}>
               <Button size="lg" variant="outline" className="h-14 w-full gap-2 flex flex-col items-center justify-center pt-2">
                 <ArrowRight className="h-5 w-5" /><span className="text-[10px]">Abrir</span>
               </Button>
             </Link>
           </div>
        </div>
        <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleQuickUpload(e, false)} />
        <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => handleQuickUpload(e, true)} />
        {uploading && <p className="text-xs text-muted-foreground mt-3 animate-pulse">Enviando arquivo… não feche o app.</p>}
      </Card>

      <Card className="p-6 shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-base font-semibold">Minha Meta Mensal</h4>
            <p className="text-xs text-muted-foreground">Acompanhamento de UMD em relação ao objetivo.</p>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progresso: {stats.umd.toLocaleString()} / {metaMensal.toLocaleString()} UMD</span>
            <span className="font-bold">{Math.round(progresso)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-none border-none bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Minhas OS Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {stats.osRecentes?.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma OS atribuída.</div>
              ) : (
                stats.osRecentes?.map((os: any) => (
                  <Link key={os.id} to={`/app/os/${os.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs font-bold">OS #{os.numero}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{os.obra?.nome}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={os.status} />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link to="/app/os" className="block p-3 text-center text-[10px] uppercase font-bold text-primary hover:bg-primary/5 transition-colors border-t border-border">
              Ver todas as minhas ordens
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-none border-none bg-primary/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Manual de Campo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground"><strong>Fotos e Vídeos:</strong> capture antes, durante e depois. Tudo fica salvo (até 1 GB por arquivo) e não pode ser apagado.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-3 w-3 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground"><strong>Localização:</strong> mantenha o GPS ativo para registrar o ponto de cada evidência.</p>
            </div>
            <div className="pt-2">
              <Link to="/app/os">
                <Button className="w-full text-xs h-9" size="sm">
                  <Plus className="mr-2 h-3 w-3" /> Ver minhas OS
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
