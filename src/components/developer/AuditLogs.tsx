 import { useState, useEffect } from "react";
 import { developerService } from "@/services/developerService";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Clock, User } from "lucide-react";
 
 export default function AuditLogs() {
   const [logs, setLogs] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     developerService.getAuditLogs().then(setLogs).finally(() => setLoading(false));
   }, []);
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>Logs de Auditoria Técnica</CardTitle>
         <CardDescription>Rastreabilidade total de ações feitas no painel dev.</CardDescription>
       </CardHeader>
       <CardContent>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Data/Hora</TableHead>
               <TableHead>Usuário</TableHead>
               <TableHead>Ação</TableHead>
               <TableHead>Módulo</TableHead>
               <TableHead>Detalhes</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {logs.map((log) => (
               <TableRow key={log.id}>
                 <TableCell className="text-xs font-mono">
                   <div className="flex items-center gap-1">
                     <Clock className="h-3 w-3" />
                     {new Date(log.created_at).toLocaleString()}
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-1 text-xs">
                     <User className="h-3 w-3" />
                     {log.user_email}
                   </div>
                 </TableCell>
                 <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                 <TableCell><Badge>{log.module}</Badge></TableCell>
                 <TableCell className="max-w-[300px] truncate text-xs font-mono">
                   {JSON.stringify(log.new_value)}
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </CardContent>
     </Card>
   );
 }