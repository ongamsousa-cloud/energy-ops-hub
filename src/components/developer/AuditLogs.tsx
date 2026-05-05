 import { useState, useEffect } from "react";
 import { developerService } from "@/services/developerService";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
  import { Clock, User, RefreshCw, Filter, Search } from "lucide-react";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
 
 export default function AuditLogs() {
   const [logs, setLogs] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");

   const fetchLogs = async () => {
     setLoading(true);
     try {
       const data = await developerService.getAuditLogs(100);
       setLogs(data || []);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
     fetchLogs();
   }, []);

   const filteredLogs = logs.filter(log => 
     log.action?.toLowerCase().includes(search.toLowerCase()) ||
     log.module?.toLowerCase().includes(search.toLowerCase()) ||
     log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
     JSON.stringify(log.new_value).toLowerCase().includes(search.toLowerCase())
   );

   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle>Logs de Auditoria Técnica</CardTitle>
           <CardDescription>Rastreabilidade de todas as ações sistêmicas.</CardDescription>
         </div>
         <div className="flex gap-2">
           <div className="relative w-64">
             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Filtrar logs..." 
               className="pl-8" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
         </div>
       </CardHeader>
       <CardContent>
         <div className="rounded-md border">
           <Table>
             <TableHeader>
               <TableRow className="bg-muted/50">
                 <TableHead className="w-[180px]">Data/Hora</TableHead>
                 <TableHead>Usuário</TableHead>
                 <TableHead>Ação</TableHead>
                 <TableHead>Módulo</TableHead>
                 <TableHead>Dados Alterados</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 Array(5).fill(0).map((_, i) => (
                   <TableRow key={i}><TableCell colSpan={5} className="h-12 animate-pulse bg-muted/10" /></TableRow>
                 ))
               ) : filteredLogs.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum log encontrado.</TableCell></TableRow>
               ) : (
                 filteredLogs.map((log) => (
                   <TableRow key={log.id} className="hover:bg-muted/30">
                     <TableCell className="text-[10px] font-mono whitespace-nowrap">
                       <div className="flex items-center gap-1">
                         <Clock className="h-3 w-3 text-primary" />
                         {new Date(log.created_at).toLocaleString()}
                       </div>
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1 text-[11px] font-medium">
                         <User className="h-3 w-3 text-muted-foreground" />
                         {log.user_email}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className="text-[10px] font-bold uppercase">{log.action}</Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant="secondary" className="text-[10px] uppercase">{log.module}</Badge>
                     </TableCell>
                     <TableCell className="max-w-[400px]">
                       <pre className="text-[10px] font-mono bg-muted p-2 rounded-md overflow-x-auto max-h-24">
                         {JSON.stringify(log.new_value, null, 2)}
                       </pre>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
       </CardContent>
     </Card>
   );
 }