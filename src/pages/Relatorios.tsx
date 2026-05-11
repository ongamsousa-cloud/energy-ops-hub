import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import * as XLSX from "xlsx";
 import { toast } from "@/components/ui/sonner";
 import { reportService } from "@/services";

export default function Relatorios() {
   const [rows, setRows] = useState<any[]>([]);
   const [obras, setObras] = useState<any[]>([]);
   const [equipes, setEquipes] = useState<any[]>([]);
   const [filters, setFilters] = useState({
     inicio: "",
     fim: "",
     obra_id: "all",
     equipe_id: "all"
   });

   useEffect(() => {
     supabase.from("obras").select("id, numero, nome").order("nome").then(({ data }) => setObras(data ?? []));
     supabase.from("equipes").select("id, nome").order("nome").then(({ data }) => setEquipes(data ?? []));
   }, []);

   async function loadRelatorio() {
     let query = supabase.from("os_atividades").select(`
       id, quantidade, unidade, umd_total, status, created_at,
       atividade:atividades(codigo_item,descricao),
       categoria:categorias(nome),
       os:ordens_servico!inner(
         numero, status, obra_id, 
         obra:obras(numero,nome), 
         profissional:profiles!ordens_servico_profissional_id_fkey(nome, equipe_id)
       )
     `);

     if (filters.inicio) query = query.gte("created_at", `${filters.inicio}T00:00:00`);
     if (filters.fim) query = query.lte("created_at", `${filters.fim}T23:59:59`);
     if (filters.obra_id !== "all") query = query.eq("os.obra_id", filters.obra_id);
     
     const { data, error } = await query.order("created_at", { ascending: false }).limit(2000);
     
     if (error) {
       toast.error("Erro ao carregar dados");
       return;
     }

     let result = data ?? [];
     if (filters.equipe_id !== "all") {
       result = result.filter((r: any) => r.os?.profissional?.equipe_id === filters.equipe_id);
     }

     setRows(result);
   }

   useEffect(() => {
     loadRelatorio();
   }, [filters]);
   async function exportXlsx() {
     if (!rows.length) return toast.warning("Sem dados para exportar");
     await reportService.registrarExportacao("relatorio_medicao", filters);
    const flat = rows.map((r: any) => ({
      OS: r.os?.numero, Status_OS: r.os?.status, Obra: r.os?.obra?.nome, Numero_Obra: r.os?.obra?.numero,
      Profissional: r.os?.profissional?.nome, Categoria: r.categoria?.nome,
      Codigo: r.atividade?.codigo_item, Atividade: r.atividade?.descricao,
      Quantidade: r.quantidade, Unidade: r.unidade, UMD_Total: r.umd_total,
      Status_Lancamento: r.status, Data: r.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, `relatorio_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
   return (
     <div className="space-y-6">
       <PageHeader 
         title="Relatórios e Medição" 
         description="Consolidado de atividades e produção." 
         actions={
           <div className="flex gap-2">
             <Button size="sm" variant="outline" onClick={() => window.print()}>Gerar PDF</Button>
             <Button size="sm" onClick={exportXlsx}>Exportar CSV/Excel</Button>
           </div>
         }
       />

       <Card className="p-4 border-none shadow-sm space-y-4">
         <div className="grid gap-4 sm:grid-cols-4">
           <div className="space-y-1.5">
             <Label className="text-[11px] uppercase text-muted-foreground">Início</Label>
             <Input type="date" value={filters.inicio} onChange={(e) => setFilters({...filters, inicio: e.target.value})} />
           </div>
           <div className="space-y-1.5">
             <Label className="text-[11px] uppercase text-muted-foreground">Fim</Label>
             <Input type="date" value={filters.fim} onChange={(e) => setFilters({...filters, fim: e.target.value})} />
           </div>
           <div className="space-y-1.5">
             <Label className="text-[11px] uppercase text-muted-foreground">Obra</Label>
             <Select value={filters.obra_id} onValueChange={(v) => setFilters({...filters, obra_id: v})}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas as obras</SelectItem>
                 {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.numero} - {o.nome}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-1.5">
             <Label className="text-[11px] uppercase text-muted-foreground">Equipe</Label>
             <Select value={filters.equipe_id} onValueChange={(v) => setFilters({...filters, equipe_id: v})}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todas as equipes</SelectItem>
                 {equipes.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
         </div>
       </Card>

       <Card className="rounded-md border-border p-0 shadow-none overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">OS</th><th className="px-3 py-2">Obra</th><th className="px-3 py-2">Profissional</th><th className="px-3 py-2">Categoria</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2 text-right">UMD</th></tr></thead>
            <tbody>{rows.map((r:any)=>(<tr key={r.id} className="border-b border-border last:border-0"><td className="px-3 py-2 font-mono text-xs">{r.os?.numero}</td><td className="px-3 py-2">{r.os?.obra?.numero}</td><td className="px-3 py-2 text-muted-foreground">{r.os?.profissional?.nome}</td><td className="px-3 py-2">{r.categoria?.nome}</td><td className="px-3 py-2">{r.atividade?.descricao}</td><td className="px-3 py-2 text-right tabular-nums">{Number(r.quantidade).toFixed(2)} {r.unidade}</td><td className="px-3 py-2 text-right tabular-nums">{Number(r.umd_total).toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}