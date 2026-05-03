  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  import { CheckCircle2, Clock, ClipboardList, Target, ArrowRight, Activity, MapPin } from "lucide-react";
  import { Link } from "react-router-dom";
  import { Badge } from "@/components/ui/badge";
  import StatusBadge from "@/components/StatusBadge";
 
 interface CampoDashboardProps {
   stats: any;
   profile: any;
 }
 
 export default function CampoDashboard({ stats, profile }: CampoDashboardProps) {
   const metaMensal = 2000;
   const progresso = Math.min(100, (stats.umd / metaMensal) * 100);
 
   return (
     <div className="space-y-6">
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <Card className="p-4 shadow-none border-l-4 border-l-blue-500">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Minhas OS</span>
             <span className="text-2xl font-bold mt-1">{stats.osAbertas + stats.osAprov + stats.osPend}</span>
             <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
               <Clock className="h-3 w-3" />
               <span>{stats.osAbertas} em andamento</span>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none border-l-4 border-l-green-500">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Produtividade (UMD)</span>
             <span className="text-2xl font-bold mt-1">{stats.umd.toLocaleString()}</span>
             <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
               <CheckCircle2 className="h-3 w-3" />
               <span>{stats.osAprov} aprovadas</span>
             </div>
           </div>
         </Card>
         <Card className="p-4 shadow-none border-l-4 border-l-amber-500">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Aguardando Revisão</span>
             <span className="text-2xl font-bold mt-1">{stats.osPend}</span>
             <p className="text-[10px] text-muted-foreground mt-2">Pendente de validação</p>
           </div>
         </Card>
         <Card className="p-4 shadow-none border-l-4 border-l-red-500">
           <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Reprovadas</span>
             <span className="text-2xl font-bold mt-1 text-red-600">{stats.osRejeitadas}</span>
             <p className="text-[10px] text-muted-foreground mt-2">Necessita correção</p>
           </div>
         </Card>
       </div>
 
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
             <div 
               className="h-full bg-primary transition-all duration-500" 
               style={{ width: `${progresso}%` }}
             />
           </div>
         </div>
       </Card>
 
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-none border-none bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Minhas Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {stats.osRecentes?.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma OS encontrada.</div>
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
                <ClipboardList className="h-4 w-4 text-primary" />
                Manual de Campo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground"><strong>Fotos e Vídeos:</strong> Sempre capture o antes, durante e depois da execução.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground"><strong>Localização:</strong> Certifique-se que o GPS está ativo para registrar o local de início e fim.</p>
              </div>
              <div className="pt-2">
                <Link to="/app/os/nova">
                  <Button className="w-full text-xs h-9" size="sm">
                    <Plus className="mr-2 h-3 w-3" /> Abrir Nova OS
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
     </div>
   );
 }