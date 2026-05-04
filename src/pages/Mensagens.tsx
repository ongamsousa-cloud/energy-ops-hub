import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, ROLE_LABEL } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Send, Paperclip, Camera, Plus, MessageSquare, Search, User, Users as UsersIcon, Building2, Mic, X, Trash2, ArrowLeft } from "lucide-react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

  type Profile = { 
    id: string; 
    nome: string; 
    email: string; 
    role?: AppRole; 
    foto_url?: string;
    department_id?: string;
    department_name?: string;
  };
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
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
   const [openNew, setOpenNew] = useState(false);
   const [selectedContacts, setSelectedContacts] = useState<Profile[]>([]);
   const [recordingMode, setRecordingMode] = useState<'broadcast' | 'direct' | null>(null);
   const [recordingDuration, setRecordingDuration] = useState(0);
   const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
   const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
   const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) setMobileView('thread');
  }, [active]);

   const recorderControls = useAudioRecorder(
     {
       noiseSuppression: true,
       echoCancellation: true,
     },
     (err) => console.error("Erro no gravador:", err)
   );
 
   const isRecording = recorderControls.isRecording;
 
   useEffect(() => {
     if (isRecording) {
       setRecordingDuration(0);
       recordingTimerRef.current = setInterval(() => {
         setRecordingDuration(prev => prev + 1);
       }, 1000);
     } else {
       if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
     }
     return () => {
       if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
     };
   }, [isRecording]);
 
   const formatDuration = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };

    const addAudioElement = async (blob: Blob) => {
      console.log("Gravação concluída:", blob.size, "bytes");
      if (blob.size < 200) {
        console.warn("Áudio muito pequeno");
        toast.error("Áudio muito curto. Tente gravar por mais tempo.");
        setRecordingMode(null);
        return;
      }
      
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(url);
      setRecordingMode(null);
      
      // Se estivermos enviando direto em uma conversa ativa, podemos oferecer o envio imediato
      toast.success("Áudio gravado com sucesso!");
    };
 
   useEffect(() => {
     return () => {
       if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
     };
   }, [audioPreviewUrl]);

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
    setAudioPreviewUrl(null);
  }

  const myRole = roles[0];

  // Carrega contatos e departamentos
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Carrega Departamentos
      const { data: depts } = await supabase.from("departments").select("id, name").eq("active", true);
      setDepartments(depts || []);

      // Carrega Perfis com seus cargos e departamentos (RELAXADO PARA PERMITIR INTER-DEPARTAMENTAL)
      const { data: profs, error: profsError } = await supabase
        .from("profiles")
        .select(`
          id, nome, email, department_id,
          user_roles(role),
          departments(name)
        `)
        .eq("ativo", true)
        .neq("id", user.id);

      if (profsError) {
        console.error("Erro ao carregar perfis:", profsError);
        toast.error("Erro ao carregar lista de contatos.");
      }
      
      const all: Profile[] = (profs ?? []).map((p: any) => ({
        id: p.id, 
        nome: p.nome, 
        email: p.email,
        department_id: p.department_id,
        department_name: p.departments?.name,
        role: p.user_roles?.[0]?.role as AppRole | undefined,
      }));

      // Removendo filtros restritivos para permitir comunicação entre departamentos como solicitado
      setContatos(all);
    })();
  }, [user]);

  // Carrega conversas
   async function loadConvs() {
     if (!user) return;
     
      // Simplificando a query para evitar problemas com junções complexas
      const { data: myParticipations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) {
        console.error("Erro ao buscar participações:", partError);
        return;
      }

      const myConvIds = myParticipations?.map(p => p.conversation_id) || [];
      
      const { data: convData, error } = await supabase
        .from('conversations')
        .select(`
          id, 
          titulo, 
          created_at
        `)
        .in('id', myConvIds)
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

    async function getOrCreateConversa(other: Profile, skipLoad = false) {
     try {
       const existing = convs.find((c) => c.outros.length === 1 && c.outros[0].id === other.id);
       if (existing) return existing.id;

       const { data: existingParts, error: searchError } = await (supabase as any)
         .rpc('get_conversation_between_users', { user1: user!.id, user2: other.id });
       
       if (!searchError && Array.isArray(existingParts) && existingParts.length > 0) {
         return existingParts[0].conversation_id;
       }

       const { data: c, error } = await supabase
         .from("conversations")
         .insert({ tipo: "direct", titulo: null, created_by: user!.id })
         .select("id").single();
         
       if (error || !c) throw error;

       await supabase.from("conversation_participants").insert([
         { conversation_id: c.id, user_id: user!.id },
         { conversation_id: c.id, user_id: other.id },
       ]);

        if (!skipLoad) await loadConvs();
       return c.id;
     } catch (err) {
       console.error(err);
       toast.error("Erro ao preparar conversa.");
       return null;
     }
   }

   async function startConversa(other: Profile) {
     const convId = await getOrCreateConversa(other);
     if (convId) {
       setActive(convId);
       setOpenNew(false);
       setSelectedContacts([]);
     }
   }

    async function sendBroadcast() {
      if (isUploading) return;
     if (selectedContacts.length === 0) {
       toast.error("Selecione ao menos um destinatário.");
       return;
     }
     if (!text.trim() && !audioBlob) {
       toast.error("Digite uma mensagem ou grave um áudio.");
       return;
     }

     // Upload do áudio uma única vez (se houver)
     let audioUrl: string | null = null;
     // Se já temos uma URL pendente (upload já feito), usamos ela.
     // Senão, se temos um blob, fazemos o upload agora.
      setIsUploading(true);
      try {
        audioUrl = pendingAudioUrl;
        if (audioBlob && !audioUrl) {
          const file = new File([audioBlob], `audio-${crypto.randomUUID()}.webm`, { type: 'audio/webm' });
          const path = `chat/broadcast/${file.name}`;
          const { error: upErr } = await supabase.storage.from("os-evidences").upload(path, file);
          if (upErr) { 
            console.error("Erro no upload do broadcast:", upErr);
            toast.error("Erro no upload do áudio: " + upErr.message); 
            setIsUploading(false);
            return; 
          }
          audioUrl = supabase.storage.from("os-evidences").getPublicUrl(path).data.publicUrl;
        }
      } catch (e: any) {
        console.error("Exceção no upload:", e);
        toast.error("Falha ao processar áudio.");
        setIsUploading(false);
        return;
      }

      let okCount = 0;
      try {
        const conteudo = text.trim() || null;
        let lastConvId: string | null = null;
        for (const contact of selectedContacts) {
         const convId = await getOrCreateConversa(contact, true);
        if (!convId) continue;
        lastConvId = convId;

        const { error } = await supabase.from("messages").insert({
          conversation_id: convId,
          sender_id: user!.id,
          conteudo: conteudo || null,
          anexo_url: audioUrl || null,
          anexo_tipo: audioUrl ? "audio" : null,
        });

        if (error) {
          console.error(`Erro ao enviar para ${contact.nome}:`, error);
          toast.error(`Erro ao enviar para ${contact.nome}`);
        } else {
          okCount++;
        }
      }

       setText("");
       setAudioBlob(null);
       setAudioPreviewUrl(null);
       setPendingAudioUrl(null);
       setSelectedContacts([]);
       setOpenNew(false);
       await loadConvs(); // Carrega tudo uma vez no final
       if (selectedContacts.length === 1 && lastConvId) setActive(lastConvId);
      } catch (err: any) {
        console.error("Erro fatal no broadcast:", err);
        toast.error("Falha ao processar o envio em massa.");
      } finally {
        setIsUploading(false);
        if (okCount > 0) {
          toast.success(`Mensagem enviada para ${okCount} destinatário(s).`);
        }
      }
    }

   const isContactSelected = (id: string) => selectedContacts.some(c => c.id === id);
   const toggleContact = (c: Profile) => {
     setSelectedContacts(prev => prev.some(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]);
   };

   async function enviarDirect(convId: string) {
     const { error } = await supabase.from("messages").insert({
       conversation_id: convId,
       sender_id: user!.id,
       conteudo: text.trim(),
     });
     if (error) toast.error(error.message);
     setText("");
   }

  const [isUploading, setIsUploading] = useState(false);

  async function enviar(anexo?: { url: string; tipo: string }, messageText?: string) {
    if (!active) return;
    const finalContent = messageText !== undefined ? messageText : text.trim();
     
     // Se temos um áudio pendente e nenhum anexo foi passado explicitamente
     let finalAnexo = anexo;
     if (!finalAnexo && audioBlob) {
       setIsUploading(true);
       try {
         const file = new File([audioBlob], `audio-${crypto.randomUUID()}.webm`, { type: 'audio/webm' });
         const path = `chat/${active}/${file.name}`;
         const { error: upErr } = await supabase.storage.from("os-evidences").upload(path, file);
         if (upErr) throw upErr;
         const { data } = supabase.storage.from("os-evidences").getPublicUrl(path);
         finalAnexo = { url: data.publicUrl, tipo: "audio" };
       } catch (err: any) {
         toast.error("Erro ao enviar áudio: " + err.message);
         setIsUploading(false);
         return;
       }
       setIsUploading(false);
     }

     if (!finalContent && !finalAnexo) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: active,
      sender_id: user!.id,
      conteudo: finalContent || null,
       anexo_url: finalAnexo?.url ?? null,
       anexo_tipo: finalAnexo?.tipo ?? null,
    });
    if (error) return toast.error(error.message);
     if (messageText === undefined) setText("");
      setAudioBlob(null);
      setAudioPreviewUrl(null);
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

  const ROLE_TO_DEPT: Record<string, string> = {
    admin: 'Administração',
    gestor: 'Operação',
    supervisor: 'Operação',
    campo: 'Operação',
    financeiro: 'Financeiro',
    auditor: 'Auditoria',
    estoque: 'Almoxarifado / Estoque',
  };

  const filteredContatos = useMemo(() => {
    let result = contatos;
    if (selectedDeptId) {
      const dept = departments.find(d => d.id === selectedDeptId);
      const deptName = dept?.name;
      result = result.filter(c => {
        if (c.department_id === selectedDeptId) return true;
        if (!deptName) return false;
        // fallback: role-based mapping when department_id not set
        const fallback = c.role ? ROLE_TO_DEPT[c.role] : undefined;
        return fallback === deptName || c.department_name === deptName;
      });
    }
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.nome.toLowerCase().includes(low) || 
        c.email.toLowerCase().includes(low) ||
        (c.role && ROLE_LABEL[c.role]?.toLowerCase().includes(low)) ||
        (c.department_name && c.department_name.toLowerCase().includes(low))
      );
    }
    return result;
  }, [contatos, searchTerm, selectedDeptId]);

  const contatosPorDept = useMemo(() => {
    const groups: Record<string, Profile[]> = {};
    filteredContatos.forEach(c => {
      const fallback = c.role ? ROLE_TO_DEPT[c.role] : undefined;
      const r = c.department_name || fallback || 'Sem departamento';
      if (!groups[r]) groups[r] = [];
      groups[r].push(c);
    });
    return groups;
  }, [filteredContatos]);

   return (
     <div className="pb-8 relative">
       {/* Headless Audio Recorder logic - always rendered but invisible */}
       <div className="fixed -top-96 -left-96 opacity-0 pointer-events-none">
         <AudioRecorder 
           onRecordingComplete={addAudioElement} 
           recorderControls={recorderControls}
           downloadOnSavePress={false}
           downloadFileExtension="webm"
         />
       </div>
 
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
               <DialogContent className="sm:max-w-3xl h-[90vh] sm:h-[600px] overflow-hidden p-0 gap-0 flex flex-col">
                 <DialogHeader className="p-4 border-b">
                   <DialogTitle className="flex items-center gap-2">
                     <MessageSquare className="h-5 w-5 text-primary" />
                     Nova Mensagem
                   </DialogTitle>
                 </DialogHeader>
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                   {/* Departamentos */}
                    <div className="w-full md:w-1/3 border-r bg-muted/20 p-3 overflow-y-auto shrink-0">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground px-1 mb-3">Filtrar por Departamento</p>
                     <div className="space-y-1">
                        <Button 
                          variant={!selectedDeptId ? "secondary" : "ghost"} 
                          size="sm" 
                          className="w-full justify-start text-xs font-medium"
                          onClick={() => setSelectedDeptId(null)}
                        >
                          <UsersIcon className="h-3.5 w-3.5 mr-2" />
                          Todos
                        </Button>
                        {departments.map((dept) => (
                          <Button 
                            key={dept.id}
                            variant={selectedDeptId === dept.id ? "secondary" : "ghost"} 
                            size="sm" 
                            className="w-full justify-start text-xs"
                            onClick={() => setSelectedDeptId(dept.id)}
                          >
                            <Building2 className="h-3.5 w-3.5 mr-2" />
                            {dept.name}
                          </Button>
                        ))}
                     </div>
                   </div>

                    {/* Contatos */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-card">
                      {/* Destinatários selecionados (Badges) */}
                      {selectedContacts.length > 0 && (
                        <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Para:</span>
                          {selectedContacts.map(c => (
                            <Badge key={c.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                              <span className="max-w-[120px] truncate">{c.nome}</span>
                              <button onClick={() => toggleContact(c)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Button variant="link" onClick={() => setSelectedContacts([])} className="h-auto p-0 text-[10px] text-muted-foreground hover:text-destructive ml-auto">
                            Limpar Tudo
                          </Button>
                        </div>
                      )}

                      {/* Busca e Seleção em Massa */}
                      <div className="p-4 border-b space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Pesquisar por nome ou e-mail..."
                            className="pl-10 h-10 border-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {filteredContatos.length > 0 && (
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {filteredContatos.length} profissional(is) encontrado(s)
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-[10px] font-bold border-primary/20 text-primary hover:bg-primary/5"
                              onClick={() => {
                                const allInFilterSelected = filteredContatos.every(c => isContactSelected(c.id));
                                if (allInFilterSelected) {
                                  setSelectedContacts(prev => prev.filter(p => !filteredContatos.some(f => f.id === p.id)));
                                } else {
                                  const toAdd = filteredContatos.filter(c => !isContactSelected(c.id));
                                  setSelectedContacts(prev => [...prev, ...toAdd]);
                                }
                              }}
                            >
                              {filteredContatos.every(c => isContactSelected(c.id)) ? "Desmarcar Filtro" : "Selecionar Filtro"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Lista de contatos (Scrollable) */}
                      <ScrollArea className="flex-1">
                        <div className="p-4 pt-2 space-y-6">
                          {(Object.entries(contatosPorDept) as [string, Profile[]][]).map(([dept, list]) => (
                            <div key={dept} className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                                <span className="h-[1px] flex-1 bg-muted" />
                                {dept}
                                <span className="h-[1px] flex-1 bg-muted" />
                              </h4>
                              <div className="grid gap-1">
                                {list.map((p) => {
                                  const checked = isContactSelected(p.id);
                                  return (
                                    <button
                                      key={p.id}
                                      onClick={() => toggleContact(p)}
                                      className={cn(
                                        "flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all border",
                                        checked 
                                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                                          : "hover:bg-muted/50 border-transparent"
                                      )}
                                    >
                                      <Checkbox 
                                        checked={checked} 
                                        onCheckedChange={() => toggleContact(p)} 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="h-5 w-5"
                                      />
                                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
                                        {p.nome.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{p.nome}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {filteredContatos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                              <User className="h-16 w-16 opacity-5 mb-4" />
                              <p className="text-sm font-bold">Nenhum profissional</p>
                              <p className="text-[11px] opacity-60 text-center max-w-[200px] mt-2">
                                Tente buscar com outros termos ou selecione um departamento ao lado.
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Rodapé fixo com Composição (Input e Áudio) */}
                  <div className="p-4 border-t bg-muted/10">
                    {audioBlob ? (
                      <div className="flex items-center gap-3 bg-card p-3 rounded-2xl mb-3 border border-primary/20 shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mic className="h-4 w-4" />
                        </div>
                         <audio src={audioPreviewUrl || ""} controls className="h-8 flex-1" />
                         <Button size="icon" variant="ghost" onClick={() => { setAudioBlob(null); setAudioPreviewUrl(null); }} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : isRecording ? (
                      <div className="flex items-center justify-between bg-red-50 p-3 rounded-2xl mb-3 border border-red-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-3">
                           <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                           <div className="flex flex-col">
                             <span className="text-xs font-black text-red-600 uppercase tracking-tighter">
                               Gravando Áudio...
                             </span>
                             <span className="text-[10px] font-mono text-red-400">
                               {formatDuration(recordingDuration)}
                             </span>
                           </div>
                         </div>
                         <Button 
                           size="sm" 
                           variant="destructive"
                           className="h-8 rounded-full px-4 text-[10px] font-bold uppercase" 
                           onClick={() => recorderControls.stopRecording()}
                         >
                           Parar Gravação
                         </Button>
                       </div>
                     ) : null}

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          placeholder={selectedContacts.length === 0 
                            ? "Selecione destinatários para habilitar o envio..." 
                            : `Mensagem para ${selectedContacts.length} profissional(is)...`}
                          className="pr-12 rounded-2xl h-14 bg-card border-muted-foreground/20 focus-visible:ring-primary shadow-sm text-sm"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                           disabled={isRecording}
                          onKeyDown={(e) => { 
                            if (e.key === "Enter" && !e.shiftKey && (text.trim() || audioBlob) && selectedContacts.length > 0) { 
                              e.preventDefault(); 
                              sendBroadcast(); 
                            } 
                          }}
                        />
                        {!isRecording && (
                          <button
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all", 
                              "text-muted-foreground hover:text-primary hover:bg-primary/5",
                              selectedContacts.length === 0 && "opacity-50 cursor-not-allowed"
                            )}
                             onClick={async () => { 
                               if (selectedContacts.length === 0) return;
                               try {
                                 setRecordingMode('broadcast');
                                 await recorderControls.startRecording();
                                 toast.info("Iniciando gravação...");
                               } catch (err: any) {
                                 console.error("Erro ao gerenciar gravação:", err);
                                 toast.error("Erro ao acessar microfone. Verifique as permissões.");
                                 setRecordingMode(null);
                               }
                             }}
                           disabled={false}
                          >
                            <Mic className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <Button
                        className="h-14 w-14 rounded-2xl shrink-0 shadow-xl bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                        onClick={sendBroadcast}
                         disabled={(!text.trim() && !audioBlob) || isRecording || isUploading}
                      >
                        {isUploading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {selectedContacts.length > 0 ? (
                        <p className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
                          Enviando individualmente para <span className="text-primary font-bold">{selectedContacts.length}</span> profissional(is).
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          Selecione os destinatários na lista acima para começar a escrever.
                        </p>
                      )}
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
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter flex gap-2">
                      <span>{activeConv?.outros[0]?.role ? ROLE_LABEL[activeConv.outros[0].role as AppRole] : "Profissional"}</span>
                      {activeConv?.outros[0]?.department_name && (
                        <>
                          <span>•</span>
                          <span>{activeConv.outros[0].department_name}</span>
                        </>
                      )}
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
                       <audio src={audioPreviewUrl || ""} controls className="h-8 w-full" />
                    </div>
                     <Button size="icon" variant="ghost" onClick={() => { setAudioBlob(null); setAudioPreviewUrl(null); }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700" onClick={enviarAudio}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : isRecording ? (
                  <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-red-200 animate-pulse">
                       <div className="flex items-center gap-3">
                         <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                         <div className="flex flex-col">
                           <span className="text-xs font-medium text-red-600">Gravando...</span>
                           <span className="text-[10px] font-mono text-red-400">
                             {formatDuration(recordingDuration)}
                           </span>
                         </div>
                       </div>
                     <div className="flex items-center gap-2">
                       <Button size="sm" variant="ghost" onClick={() => recorderControls.stopRecording()} className="text-muted-foreground h-8">
                         Cancelar
                       </Button>
                       <Button size="sm" className="bg-red-500 hover:bg-red-600 h-8" onClick={() => recorderControls.stopRecording()}>
                         Parar Gravação
                       </Button>
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
                          onKeyDown={(e) => { 
                            if (e.key === "Enter" && !e.shiftKey && (text.trim() || audioBlob)) { 
                              e.preventDefault(); 
                              enviar(); 
                            } 
                          }}
                          placeholder="Escreva sua mensagem..." 
                          className="pr-10 bg-card border-border focus-visible:ring-primary rounded-full h-10 shadow-inner"
                        />
                         {!isRecording && !audioBlob && (
                           <button 
                             className={cn(
                               "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors",
                               "text-muted-foreground hover:text-primary"
                             )}
                              onClick={async () => { 
                                try {
                                  setRecordingMode('direct');
                                  await recorderControls.startRecording();
                                } catch (err: any) {
                                  console.error("Erro ao iniciar gravação direta:", err);
                                  toast.error("Erro ao acessar microfone.");
                                  setRecordingMode(null);
                                }
                              }}
                             title="Gravar Áudio"
                           >
                             <Mic className="h-4 w-4" />
                           </button>
                         )}
                      </div>

                      <Button 
                        size="icon" 
                        onClick={() => enviar()} 
                        disabled={(!text.trim() && !audioBlob) || isUploading}
                        className={cn(
                          "h-10 w-10 shrink-0 rounded-full shadow-md transition-all active:scale-95",
                          (text.trim() || audioBlob) ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground",
                          isUploading && "cursor-wait"
                        )}
                      >
                        {isUploading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
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