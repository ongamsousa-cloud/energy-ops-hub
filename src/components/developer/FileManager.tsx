 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Upload, File, Trash2, Link as LinkIcon } from "lucide-react";
 import { toast } from "sonner";
 
 export default function FileManager() {
   return (
     <div className="space-y-6">
       <Card>
         <CardHeader>
           <CardTitle>Gerenciador de Mídia e Assets</CardTitle>
           <CardDescription>Gerencie logotipos, ícones e arquivos públicos do sistema.</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4">
             <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
               <Upload className="h-8 w-8 text-primary" />
             </div>
             <div>
               <p className="font-semibold">Clique para fazer upload ou arraste arquivos</p>
               <p className="text-sm text-muted-foreground">PNG, JPG, SVG ou PDF (Máx. 5MB)</p>
             </div>
             <Input type="file" className="hidden" id="file-upload" />
             <Button onClick={() => document.getElementById('file-upload')?.click()}>
               Selecionar Arquivo
             </Button>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }