 import { useState, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Upload, File, Trash2, Globe, Lock, Search, RefreshCw, Folder } from "lucide-react";
 import { toast } from "@/components/ui/sonner";
 import { supabase } from "@/integrations/supabase/client";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";

 export default function FileManager() {
   const [files, setFiles] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [search, setSearch] = useState("");

   useEffect(() => {
     fetchFiles();
   }, []);

   const fetchFiles = async () => {
     setLoading(true);
     try {
       const { data: buckets } = await supabase.storage.listBuckets();
       let allFiles: any[] = [];

       if (buckets) {
         for (const bucket of buckets) {
           const { data: bucketFiles } = await supabase.storage.from(bucket.id).list();
           if (bucketFiles) {
             allFiles = [...allFiles, ...bucketFiles.map(f => ({ ...f, bucket: bucket.id, is_public: bucket.public }))];
           }
         }
       }
       setFiles(allFiles);
     } catch (e) {
       toast.error("Erro ao carregar arquivos");
     } finally {
       setLoading(false);
     }
   };

   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;

     setUploading(true);
     try {
       const fileName = `${Date.now()}-${file.name}`;
       const { error } = await supabase.storage.from('documents').upload(fileName, file);
       
       if (error) throw error;
       toast.success("Arquivo enviado para o bucket 'documents'");
       fetchFiles();
     } catch (e: any) {
       toast.error(`Erro no upload: ${e.message}`);
     } finally {
       setUploading(false);
     }
   };

   const handleDelete = async (bucket: string, name: string) => {
     if (!confirm("Tem certeza que deseja excluir este arquivo permanentemente?")) return;
     try {
       const { error } = await supabase.storage.from(bucket).remove([name]);
       if (error) throw error;
       toast.success("Arquivo excluído");
       fetchFiles();
     } catch (e) {
       toast.error("Erro ao excluir arquivo");
     }
   };

   const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

   return (
     <div className="space-y-6">
       <Card className="border-primary/20">
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><Folder className="h-5 w-5 text-primary" /> Gerenciador de Storage Técnico</CardTitle>
           <CardDescription>Gerencie assets em todos os buckets do Supabase.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="flex gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar arquivos em todos os buckets..." 
                 className="pl-8" 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <Button variant="outline" size="icon" onClick={fetchFiles} disabled={loading}>
               <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             </Button>
             <div>
               <Input type="file" className="hidden" id="dev-upload" onChange={handleFileUpload} />
               <Button onClick={() => document.getElementById('dev-upload')?.click()} disabled={uploading} className="bg-primary">
                 <Upload className="h-4 w-4 mr-2" /> {uploading ? "Enviando..." : "Upload Novo"}
               </Button>
             </div>
           </div>

           <div className="rounded-xl border shadow-sm overflow-hidden">
             <Table>
               <TableHeader className="bg-muted/50">
                 <TableRow>
                   <TableHead>Arquivo</TableHead>
                   <TableHead>Bucket</TableHead>
                   <TableHead>Visibilidade</TableHead>
                   <TableHead>Tamanho</TableHead>
                   <TableHead className="text-right">Ação</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {loading ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando infraestrutura de storage...</TableCell></TableRow>
                 ) : filteredFiles.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8 opacity-40">Nenhum asset encontrado nos buckets.</TableCell></TableRow>
                 ) : (
                   filteredFiles.map((file, i) => (
                     <TableRow key={i} className="hover:bg-muted/10">
                       <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                           <File className="h-4 w-4 text-primary opacity-60" />
                           <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                         </div>
                       </TableCell>
                       <TableCell><Badge variant="outline" className="bg-primary/5 uppercase text-[10px]">{file.bucket}</Badge></TableCell>
                       <TableCell>
                         {file.is_public ? (
                           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 text-[10px]"><Globe className="h-3 w-3" /> PÚBLICO</Badge>
                         ) : (
                           <Badge variant="secondary" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> PRIVADO</Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                         {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                       </TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(file.bucket, file.name)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }