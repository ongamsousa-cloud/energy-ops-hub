 import { useState, useRef, useEffect } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Terminal as TerminalIcon, ChevronRight } from "lucide-react";
 import { ScrollArea } from "@/components/ui/scroll-area";

 export default function TechTerminal() {
   const [history, setHistory] = useState<string[]>(["Lovable System OS [Version 1.0.42]", "Copyright (c) 2026 Lovable Corp. All rights reserved.", ""]);
   const [input, setInput] = useState("");
   const scrollRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollIntoView({ behavior: "smooth" });
     }
   }, [history]);

   const handleCommand = (e: React.FormEvent) => {
     e.preventDefault();
     if (!input.trim()) return;

     const cmd = input.toLowerCase().trim();
     let response = "";

     switch (cmd) {
       case "help":
         response = "Comandos disponíveis: help, clear, status, version, reload, whoami";
         break;
       case "clear":
         setHistory([]);
         setInput("");
         return;
       case "status":
         response = "Sistema operacional e estável. Todas as APIs respondendo normalmente.";
         break;
       case "version":
         response = "Build: 2026.05.05.r12 - Production Mode";
         break;
       case "reload":
         window.location.reload();
         return;
       case "whoami":
         response = "Developer Root User - Total System Access";
         break;
       default:
         response = `Comando não reconhecido: '${cmd}'. Digite 'help' para ver os comandos.`;
     }

     setHistory(prev => [...prev, `> ${input}`, response, ""]);
     setInput("");
   };

   return (
     <Card className="bg-slate-950 text-emerald-500 font-mono border-slate-800 shadow-2xl">
       <CardHeader className="py-2 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
         <div className="flex items-center gap-2">
           <TerminalIcon className="h-4 w-4" />
           <CardTitle className="text-xs uppercase tracking-widest">Lovable Tech Terminal</CardTitle>
         </div>
         <div className="flex gap-1.5">
           <div className="h-2 w-2 rounded-full bg-red-500/50" />
           <div className="h-2 w-2 rounded-full bg-amber-500/50" />
           <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
         </div>
       </CardHeader>
       <CardContent className="p-0">
         <ScrollArea className="h-[400px] w-full p-4">
           <div className="space-y-1">
             {history.map((line, i) => (
               <div key={i} className={line.startsWith(">") ? "text-slate-300" : ""}>
                 {line || "\u00A0"}
               </div>
             ))}
             <form onSubmit={handleCommand} className="flex items-center gap-1">
               <ChevronRight className="h-4 w-4 shrink-0" />
               <input 
                 type="text" 
                 autoFocus 
                 className="bg-transparent border-none outline-none flex-1 text-emerald-400 placeholder:text-emerald-900"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 spellCheck={false}
                 autoComplete="off"
               />
             </form>
             <div ref={scrollRef} />
           </div>
         </ScrollArea>
       </CardContent>
     </Card>
   );
 }