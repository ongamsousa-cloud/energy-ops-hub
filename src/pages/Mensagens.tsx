import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, ROLE_LABEL } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Send, Paperclip, Camera, Plus, MessageSquare, Search, User, Users as UsersIcon, Building2, Mic, X, Trash2, ArrowLeft } from "lucide-react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

 type Profile = { id: string; nome: string; email: string; role?: AppRole; foto_url?: string };
 type Conv = { 
   id: string; 
   titulo: string | null; 
   created_at: string; 
   outros: Profile[]; 
   ultima_msg?: string;
   unread_count?: number;
 };

export default function Mensagens() {
  const { user, roles } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [contatos, setContatos] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) setMobileView('thread');
  }, [active]);

  const recorderControls = useAudioRecorder();

  const addAudioElement = async (blob: Blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
  };

  async function enviarAudio() {
    if (!audioBlob || !active) return;
    const file = new File([audioBlob], `audio-${crypto.randomUUID()}.webm`, { type: 'audio/webm' });
    const path = `chat/${active}/${file.name}`;
    
    const { error } = await supabase.storage
      .from("os-evidences")
      .upload(path, file);
      
    if (error) {
      toast.error("Erro ao enviar áudio: " + error.message);
      return;
    }
    
    const { data } = supabase.storage.from("os-evidences").getPublicUrl(path);
    await enviar({ url: data.publicUrl, tipo: "audio" });
    setAudioBlob(null);
  }

  const myRole = roles[0];

  // Carrega contatos permitidos pela hierarquia
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nome, email, user_roles(role)")
        .eq("ativo", true)
        .neq("id", user.id);
      const all: Profile[] = (profs ?? []).map((p: any) => ({
        id: p.id, nome: p.nome, email: p.email,
        role: p.user_roles?.[0]?.role as AppRole | undefined,
      }));

      let filtered: Profile[] = [];
      const isAdminGestor = roles.some((r) => r === "admin" || r === "gestor");
      
      if (isAdminGestor) {
        filtered = all;
      } else if (roles.includes("supervisor")) {
        // gestores/admin + técnicos das equipes que ele supervisiona
        const { data: eqs } = await supabase.from("equipes").select("id").eq("supervisor_id", user.id);
        const eqIds = (eqs ?? []).map((e: any) => e.id);
        let tecIds: string[] = [];
        if (eqIds.length) {
          const { data: mems } = await supabase.from("equipe_membros").select("profissional_id").in("equipe_id", eqIds);
          tecIds = (mems ?? []).map((m: any) => m.profissional_id);
        }
        filtered = all.filter((p) =>
          p.role === "admin" || p.role === "gestor" || p.role === "supervisor" || (p.role === "campo" && tecIds.includes(p.id))
        );
      } else if (roles.includes("campo")) {
        // só supervisores das equipes em que o técnico participa + gestores/admin
        const { data: mems } = await supabase.from("equipe_membros").select("equipe_id").eq("profissional_id", user.id);
        const eqIds = (mems ?? []).map((m: any) => m.equipe_id);
        let supIds: string[] = [];
        if (eqIds.length) {
          const { data: eqs } = await supabase.from("equipes").select("supervisor_id").in("id", eqIds);
          supIds = (eqs ?? []).map((e: any) => e.supervisor_id).filter(Boolean);
        }
        filtered = all.filter((p) => supIds.includes(p.id) || p.role === "admin" || p.role === "gestor");
      } else if (roles.includes("financeiro") || roles.includes("auditor")) {
        filtered = all.filter((p) => p.role === "admin" || p.role === "gestor");
      } else {
        filtered = all.filter(p => p.role === "admin" || p.role === "gestor");
      }
      
      setContatos(filtered);
    })();
  }, [user, roles]);

  // Carrega conversas
   async function loadConvs() {
     if (!user) return;
     
     const { data: convData, error } = await supabase
       .from('conversations')
       .select(`
         id, 
         titulo, 
         created_at,
         conversation_participants!inner(user_id)
       `)
       .eq('conversation_participants.user_id', user.id)
       .order('created_at', { ascending: false });

     if (error) {
       console.error("Erro ao carregar conversas:", error);
       return;
     }

     const convIds = convData.map(c => c.id);
     if (!convIds.length) {
       setConvs([]);
       return;
     }

     // Buscar participantes de todas essas conversas
     const { data: allParticipants } = await supabase
       .from('conversation_participants')
       .select(`
         conversation_id,
         user_id,
         profiles:profiles(id, nome, email, role, foto_url)
       `)
       .in('conversation_id', convIds);

     // Buscar última mensagem de cada conversa
     const { data: lastMessages } = await supabase
       .from('messages')
       .select('conversation_id, conteudo, created_at')
       .in('conversation_id', convIds)
       .order('created_at', { ascending: false });

     const result: Conv[] = convData.map(c => {
       const participants = allParticipants?.filter(p => p.conversation_id === c.id) || [];
       const others = participants
         .filter(p => p.user_id !== user.id)
         .map(p => (p.profiles as unknown as Profile))
         .filter(Boolean);
       
       const lastMsg = lastMessages?.find(m => m.conversation_id === c.id);

       return {
         id: c.id,
         titulo: c.titulo,
         created_at: c.created_at,
         outros: others,
         ultima_msg: lastMsg?.conteudo || (lastMsg ? "[Anexo]" : "Sem mensagens")
       };
     });

     setConvs(result);
   }

   useEffect(() => { 
     loadConvs(); 
     // Realtime para a lista de conversas (atualizar última mensagem/ordenar)
     const ch = supabase
       .channel('convs-list')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
         loadConvs();
       })
       .subscribe();
     return () => { supabase.removeChannel(ch); };
   }, [user]);

  // Carrega mensagens da conversa ativa + realtime
  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", active)
        .order("created_at");
      setMsgs(data ?? []);
      // marca como lida
      await supabase.from("conversation_participants")
        .update({ ultima_leitura: new Date().toISOString() })
        .eq("conversation_id", active).eq("user_id", user!.id);
    })();
    const ch = supabase
      .channel(`msg-${active}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` },
        (payload) => setMsgs((prev) => [...prev, payload.new]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

   async function startConversa(other: Profile) {
     try {
       // Procura conversa direta existente localmente
       const existing = convs.find((c) => c.outros.length === 1 && c.outros[0].id === other.id);
       if (existing) { 
         setActive(existing.id); 
         setOpenNew(false); 
         return; 
       }

       // Tenta buscar no banco se já existe uma conversa entre esses dois
       const { data: existingParts, error: searchError } = await (supabase as any)
         .rpc('get_conversation_between_users', { user1: user!.id, user2: other.id });
       
       if (!searchError && Array.isArray(existingParts) && existingParts.length > 0) {
         setActive(existingParts[0].conversation_id);
         setOpenNew(false);
         return;
       }

       // Criar nova
       const { data: c, error } = await supabase
         .from("conversations")
         .insert({ tipo: "direct", titulo: null, created_by: user!.id })
         .select("id").single();
         
       if (error || !c) { 
         toast.error("Erro ao criar conversa: " + (error?.message || "Erro desconhecido")); 
         return; 
       }

       const { error: e2 } = await supabase.from("conversation_participants").insert([
         { conversation_id: c.id, user_id: user!.id },
         { conversation_id: c.id, user_id: other.id },
       ]);

       if (e2) { 
         toast.error("Erro ao adicionar participantes: " + e2.message); 
         return; 
       }

       await loadConvs();
       setActive(c.id);
       setOpenNew(false);
     } catch (err) {
       console.error(err);
       toast.error("Erro inesperado ao iniciar conversa.");
     }
   }

  async function enviar(anexo?: { url: string; tipo: string }, messageText?: string) {
    if (!active) return;
    const finalContent = messageText !== undefined ? messageText : text.trim();
    if (!finalContent && !anexo) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: active,
      sender_id: user!.id,
      conteudo: finalContent || null,
      anexo_url: anexo?.url ?? null,
      anexo_tipo: anexo?.tipo ?? null,
    });
    if (error) return toast.error(error.message);
    if (messageText === undefined) setText("");
  }

  async function uploadAnexo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !active) return;
    const tipo = f.type.startsWith("video/") ? "video" : "image";
    const path = `chat/${active}/${crypto.randomUUID()}-${f.name}`;
    const { error } = await supabase.storage.from("os-evidences").upload(path, f, { contentType: f.type });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("os-evidences").getPublicUrl(path);
    await enviar({ url: data.publicUrl, tipo });
    e.target.value = "";
  }

  const activeConv = useMemo(() => convs.find((c) => c.id === active), [convs, active]);

  const filteredContatos = useMemo(() => {
    if (!searchTerm) return contatos;
    const low = searchTerm.toLowerCase();
    return contatos.filter(c => 
      c.nome.toLowerCase().includes(low) || 
      c.email.toLowerCase().includes(low) ||
      (c.role && ROLE_LABEL[c.role]?.toLowerCase().includes(low))
    );
  }, [contatos, searchTerm]);

  const contatosPorRole = useMemo(() => {
    const groups: Record<string, Profile[]> = {};
    filteredContatos.forEach(c => {
      const r = c.role || 'outros';
      if (!groups[r]) groups[r] = [];
      groups[r].push(c);
    });
    return groups;
  }, [filteredContatos]);

  return (
    <div className="pb-8">
      <PageHeader title="Mensagens" description="Comunicação interna respeitando a hierarquia da equipe." />
      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-3 md:grid-cols-[300px_1fr]">
        {/* Lista */}
        <div className={cn(
          "flex flex-col rounded-md border border-border bg-card overflow-hidden transition-all duration-300",
          mobileView === 'thread' ? "hidden md:flex" : "flex"
        )}>
          <div className="flex items-center justify-between border-b border-border p-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Conversas</span>
            <Dialog open={openNew} onOpenChange={(val) => { setOpenNew(val); if (!val) setSearchTerm(""); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost"><Plus className="h-3.5 w-3.5 mr-1" />Nova</Button>
              </DialogTrigger>
               <DialogContent className="sm:max-w-2xl overflow-hidden p-0 gap-0">
                 <DialogHeader className="p-4 border-b">
                   <DialogTitle className="flex items-center gap-2">
                     <MessageSquare className="h-5 w-5 text-primary" />
                     Nova Mensagem
                   </DialogTitle>
                 </DialogHeader>
                 <div className="flex flex-col md:flex-row h-[500px]">
                   {/* Departamentos */}
                   <div className="w-full md:w-1/3 border-r bg-muted/20 p-2 overflow-y-auto">
                     <p className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-2">Filtrar por Departamento</p>
                     <div className="space-y-1">
                       <Button 
                         variant={!searchTerm ? "secondary" : "ghost"} 
                         size="sm" 
                         className="w-full justify-start text-xs font-medium"
                         onClick={() => setSearchTerm("")}
                       >
                         <UsersIcon className="h-3.5 w-3.5 mr-2" />
                         Todos
                       </Button>
                       {Object.keys(ROLE_LABEL).map((role) => (
                         <Button 
                           key={role}
                           variant={searchTerm === ROLE_LABEL[role as AppRole] ? "secondary" : "ghost"} 
                           size="sm" 
                           className="w-full justify-start text-xs"
                           onClick={() => setSearchTerm(ROLE_LABEL[role as AppRole])}
                         >
                           <Building2 className="h-3.5 w-3.5 mr-2" />
                           {ROLE_LABEL[role as AppRole]}
                         </Button>
                       ))}
                     </div>
                   </div>

                   {/* Contatos */}
                   <div className="flex-1 flex flex-col overflow-hidden bg-card">
                     <div className="p-3 border-b">
                       <div className="relative">
                         <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input 
                           placeholder="Pesquisar profissional..." 
                           className="pl-9 h-9"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                         />
                       </div>
                     </div>
                     
                     <ScrollArea className="flex-1 p-2">
                       <div className="space-y-4">
                         {Object.entries(contatosPorRole).map(([role, list]) => (
                           <div key={role} className="space-y-1">
                             <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                               {ROLE_LABEL[role as AppRole] || role}
                             </h4>
                             <div className="grid gap-0.5">
                               {list.map((p) => (
                                 <button
                                   key={p.id}
                                   onClick={() => startConversa(p)}
                                   className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-accent transition-all group"
                                 >
                                   <div className="relative">
                                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                                       {p.nome.charAt(0)}
                                     </div>
                                     <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.nome}</p>
                                     <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>
                                   </div>
                                   <Send className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
                                 </button>
                               ))}
                             </div>
                           </div>
                         ))}
                         {filteredContatos.length === 0 && (
                           <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                             <User className="h-12 w-12 opacity-10 mb-2" />
                             <p className="text-sm font-medium">Nenhum profissional encontrado</p>
                             <p className="text-xs opacity-60">Tente buscar por outro nome ou cargo</p>
                           </div>
                         )}
                       </div>
                     </ScrollArea>
                   </div>
                 </div>
               </DialogContent>
            </Dialog>
          </div>
           <ScrollArea className="flex-1">
             <div className="p-1">
               {convs.length === 0 ? (
                 <div className="p-6 text-center text-xs text-muted-foreground">
                   <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
                   Nenhuma conversa ativa. Clique em "Nova" para começar.
                 </div>
               ) : convs.map((c) => (
                 <button 
                   key={c.id} 
                   onClick={() => setActive(c.id)}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all mb-1 text-left group relative",
                     active === c.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-accent border-l-4 border-transparent"
                   )}
                 >
                   <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                     {c.outros[0]?.nome?.charAt(0) || "C"}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-0.5">
                       <div className={cn("text-sm font-bold truncate", active === c.id ? "text-primary" : "text-foreground")}>
                         {c.outros.map((o) => o.nome).join(", ") || c.titulo || "Conversa"}
                       </div>
                       <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-1">
                         {new Date(c.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                       </span>
                     </div>
                     <div className="text-[11px] text-muted-foreground truncate leading-relaxed">
                       {c.ultima_msg}
                     </div>
                   </div>
                 </button>
               ))}
             </div>
           </ScrollArea>
        </div>

        {/* Thread */}
        <div className={cn(
          "flex flex-col rounded-md border border-border bg-card overflow-hidden transition-all duration-300",
          mobileView === 'list' ? "hidden md:flex" : "flex"
        )}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground bg-muted/5">
              <div className="p-6 bg-muted/20 rounded-full mb-4">
                <MessageSquare className="h-10 w-10 opacity-40" />
              </div>
              <p className="text-sm font-medium">Selecione uma conversa para começar</p>
              <p className="text-[11px] opacity-60 mt-1">Sua comunicação segura e direta</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-3 flex items-center gap-3 bg-card/50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-8 w-8" 
                  onClick={() => setMobileView('list')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {activeConv?.outros[0]?.nome?.charAt(0) || "C"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="text-sm font-bold truncate">
                      {activeConv?.outros.map((o) => o.nome).join(", ") || "Conversa"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                      {activeConv?.outros[0]?.role ? ROLE_LABEL[activeConv.outros[0].role as AppRole] : "Online"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {msgs.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {m.anexo_url && m.anexo_tipo === "image" && (
                          <img src={m.anexo_url} className="mb-1 max-h-64 rounded" />
                        )}
                        {m.anexo_url && m.anexo_tipo === "video" && (
                          <video src={m.anexo_url} controls className="mb-1 max-h-64 rounded" />
                        )}
                        {m.anexo_url && m.anexo_tipo === "audio" && (
                          <audio src={m.anexo_url} controls className="mb-1 w-full min-w-[200px]" />
                        )}
                        {m.conteudo && <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>}
                        <div className={cn("mt-1 text-[10px] opacity-70", mine ? "text-right" : "")}>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
               <div className="border-t border-border p-3 bg-muted/20">
                 {audioBlob ? (
                  <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-primary/20 animate-in fade-in zoom-in duration-200">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-full" />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setAudioBlob(null)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700" onClick={enviarAudio}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-red-200 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-medium text-red-600">Gravando...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { recorderControls.stopRecording(); setIsRecording(false); }} className="text-muted-foreground h-8">
                        Cancelar
                      </Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 h-8" onClick={() => recorderControls.stopRecording()}>
                        Parar e Enviar
                      </Button>
                    </div>
                    <div className="hidden">
                      <AudioRecorder 
                        onRecordingComplete={addAudioElement}
                        recorderControls={recorderControls}
                      />
                    </div>
                  </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={uploadAnexo} />
                     <input ref={camRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={uploadAnexo} />
                     
                     <div className="flex items-center">
                       <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} title="Anexar" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-full transition-colors">
                         <Paperclip className="h-4 w-4" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => camRef.current?.click()} title="Câmera" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-full transition-colors hidden sm:flex">
                         <Camera className="h-4 w-4" />
                       </Button>
                     </div>

                     <div className="relative flex-1">
                       <Input 
                         value={text} 
                         onChange={(e) => setText(e.target.value)}
                         onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                         placeholder="Escreva sua mensagem..." 
                         className="pr-10 bg-card border-border focus-visible:ring-primary rounded-full h-10 shadow-inner"
                       />
                       <button 
                         className={cn(
                           "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                           isRecording ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-primary"
                         )}
                         onClick={() => { setIsRecording(true); recorderControls.startRecording(); }}
                         title="Gravar Áudio"
                       >
                         <Mic className="h-4 w-4" />
                       </button>
                     </div>

                      <Button 
                        size="icon" 
                        onClick={() => enviar()} 
                        disabled={!text.trim() && !audioBlob}
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-full shadow-md transition-all active:scale-95",
                          (text.trim() || audioBlob) ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                   </div>
                 )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}