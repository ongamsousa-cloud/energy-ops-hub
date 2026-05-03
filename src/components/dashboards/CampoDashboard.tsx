 import { Card } from "@/components/ui/card";
 import { CheckCircle2, Clock, ClipboardList, Target } from "lucide-react";
 
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
 
       <div className="grid gap-4 md:grid-cols-2">
         <Card className="p-4 shadow-none bg-primary/[0.02] border-dashed border-2">
           <h5 className="text-xs font-bold uppercase mb-3 flex items-center gap-2">
             <ClipboardList className="h-3 w-3" />
             Dicas de produtividade
           </h5>
           <ul className="text-xs space-y-2 text-muted-foreground">
             <li>• Envie fotos nítidas para evitar reprovações.</li>
             <li>• Certifique-se que o GPS está ativo ao iniciar a OS.</li>
             <li>• Revise os itens antes de finalizar o envio.</li>
           </ul>
         </Card>
       </div>
     </div>
   );
 }