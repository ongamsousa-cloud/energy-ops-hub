 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { toast } from "@/components/ui/sonner";
 import { developerService } from "@/services/developerService";
 import { Database, Play, AlertCircle, Table as TableIcon } from "lucide-react";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

 export default function DatabaseManager() {
   const [query, setQuery] = useState("");
   const [results, setResults] = useState<any[] | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleExecute = async () => {
     if (!query.trim()) return;
     setLoading(true);
     setError(null);
     try {
       const data = await developerService.executeSQL(query) as any;
       if (data && !Array.isArray(data) && data.error) {
         setError(data.error);
         setResults(null);
       } else {
         setResults(Array.isArray(data) ? data : []);
         toast.success("Query executada com sucesso!");
       }
     } catch (e: any) {
       setError(e.message);
       setResults(null);
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className="space-y-6">
       <Card className="border-red-200 bg-red-50/10">
         <CardHeader className="pb-3">
           <div className="flex items-center gap-2 text-red-600">
             <AlertCircle className="h-5 w-5" />
             <CardTitle>Editor SQL (Acesso Restrito)</CardTitle>
           </div>
           <CardDescription>Execute comandos SQL diretamente no banco de dados. Use com extrema cautela.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <Textarea 
             placeholder="SELECT * FROM profiles LIMIT 10;" 
             className="font-mono h-40 bg-slate-900 text-slate-100 focus-visible:ring-red-500"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
           <div className="flex justify-between items-center">
             <p className="text-xs text-muted-foreground italic">Consultas SELECT são recomendadas para visualização.</p>
             <Button onClick={handleExecute} disabled={loading} variant="destructive">
               {loading ? "Executando..." : <><Play className="h-4 w-4 mr-2" /> Executar Query</>}
             </Button>
           </div>
         </CardContent>
       </Card>

       {error && (
         <Card className="border-red-500 bg-red-50">
           <CardContent className="py-4 text-red-700 font-mono text-sm whitespace-pre-wrap">
             {error}
           </CardContent>
         </Card>
       )}

       {results && results.length > 0 && (
         <Card>
           <CardHeader className="flex flex-row items-center justify-between">
             <CardTitle className="text-sm flex items-center gap-2"><TableIcon className="h-4 w-4" /> Resultados ({results.length})</CardTitle>
           </CardHeader>
           <CardContent>
             <ScrollArea className="h-[400px] w-full rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     {Object.keys(results[0]).map((key) => (
                       <TableHead key={key} className="bg-muted font-bold">{key}</TableHead>
                     ))}
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {results.map((row, i) => (
                     <TableRow key={i}>
                       {Object.values(row).map((val: any, j) => (
                         <TableCell key={j} className="max-w-[200px] truncate">
                           {val === null ? <span className="text-muted-foreground italic">null</span> : String(val)}
                         </TableCell>
                       ))}
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </ScrollArea>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }