import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, ROLE_LABEL } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
 import { Send, Paperclip, Camera, Plus, MessageSquare, Search, User, Users as UsersIcon, Building2, Mic, X, Trash2, ArrowLeft, MoreVertical, Edit2, AlertCircle, RefreshCw, Settings, Archive } from "lucide-react";
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    documento?: string;
    cargo?: string;
  };
 type DeptOption = { id: string; name: string };
 type Recipient =
   | { kind: 'user'; profile: Profile }
   | { kind: 'department'; department: DeptOption };
 type Conv = {
   id: string;
   titulo: string | null;
   created_at: string;
   tipo?: string;
   department_id?: string | null;
   department_name?: string | null;
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
  const [editingMsg, setEditingMsg] = useState<{ id: string; conteudo: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<{ id: string } | null>(null);
  const [contatos, setContatos] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState("");
   const [filterCode, setFilterCode] = useState("");
   const [filterCargo, setFilterCargo] = useState("");
   const [filterFuncao, setFilterFuncao] = useState("");
   const [openNew, setOpenNew] = useState(false);
  const [openDeptCrud, setOpenDeptCrud] = useState(false);
  const [openProfileCrud, setOpenProfileCrud] = useState(false);
  const [editingDept, setEditingDept] = useState<DeptOption | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
   const [selectedContacts, setSelectedContacts] = useState<Profile[]>([]);
   const [selectedDepartments, setSelectedDepartments] = useState<DeptOption[]>([]);
   const [recordingMode, setRecordingMode] = useState<'broadcast' | 'direct' | null>(null);
   const [recordingDuration, setRecordingDuration] = useState(0);
   const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
   const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
   const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
   const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
   const myRole = roles[0];
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
    (err) => {
      console.error("Erro no gravador:", err);
      toast.error("Erro no microfone: " + err.message);
    }
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
     await enviar();
   }

  // Efeito para checar mensagens arquivadas (5 anos)
  useEffect(() => {
    if (myRole === 'admin') {
      (async () => {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .lt("created_at", fiveYearsAgo.toISOString())
          .eq("is_archived", false);
        setArchivedCount(count || 0);
      })();
    }
  }, [myRole]);

  async function handleArchiveOldMessages(permanent = false) {
    if (permanent) {
      if (!confirm("Isso excluirá PERMANENTEMENTE todas as mensagens com mais de 5 anos. Esta ação não pode ser desfeita. Continuar?")) return;
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      const { error } = await supabase.from("messages").delete().lt("created_at", fiveYearsAgo.toISOString());
      if (error) toast.error("Erro ao excluir: " + error.message);
      else {
        toast.success("Mensagens antigas excluídas permanentemente.");
        setArchivedCount(0);
      }
    } else {
      const { error } = await (supabase as any).rpc('archive_old_messages');
      if (error) {
        toast.error("Erro ao arquivar mensagens: " + error.message);
      } else {
        toast.success("Mensagens com mais de 5 anos foram arquivadas.");
        setArchivedCount(0);
      }
    }
  }

  async function saveDepartment(name: string) {
    try {
      if (editingDept) {
        await supabase.from("departments").update({ name }).eq("id", editingDept.id);
        toast.success("Departamento atualizado.");
      } else {
        await supabase.from("departments").insert({ name, active: true });
        toast.success("Departamento criado.");
      }
      setOpenDeptCrud(false);
      setEditingDept(null);
      // Recarregar departamentos
      const { data } = await supabase.from("departments").select("id, name").eq("active", true).order("name");
      setDepartments(data || []);
    } catch (err: any) {
      toast.error("Erro ao salvar departamento: " + err.message);
    }
  }

  async function deleteDept(id: string) {
    if (!confirm("Deseja realmente excluir este departamento?")) return;
    const { error } = await supabase.from("departments").update({ active: false }).eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else {
      toast.success("Excluído com sucesso.");
      setDepartments(prev => prev.filter(d => d.id !== id));
    }
  }

  async function saveProfile(data: Partial<Profile>) {
    try {
      if (editingProfile) {
        const { error } = await (supabase as any).from("profiles").update({
          nome: data.nome,
          email: data.email,
          department_id: data.department_id,
          cargo: data.cargo,
          documento: data.documento
        }).eq("id", editingProfile.id);
        if (error) throw error;
        toast.success("Perfil atualizado.");
      } else {
        const { error } = await (supabase as any).from("profiles").insert({
          id: crypto.randomUUID(),
          nome: data.nome,
          email: data.email,
          department_id: data.department_id,
          cargo: data.cargo,
          documento: data.documento,
          ativo: true
        });
        if (error) throw error;
        toast.success("Perfil criado.");
      }
      setOpenProfileCrud(false);
      setEditingProfile(null);
      // Recarregar contatos (reaproveitando lógica existente ou forçando refresh)
      window.location.reload(); // Simplificado para garantir todos os joins
    } catch (err: any) {
      toast.error("Erro ao salvar perfil: " + err.message);
    }
  }

  // Carrega contatos e departamentos (consultas separadas para evitar relacionamento inválido)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: depts }, profsRes, rolesRes] = await Promise.all([
        supabase.from("departments").select("id, name").eq("active", true).order("name"),
        supabase
          .from("profiles")
          .select("id, nome, email, department_id, cargo, documento, foto_url")
          .eq("ativo", true)
          .neq("id", user.id),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      setDepartments(depts || []);

      if (profsRes.error) {
        console.error("Erro ao carregar perfis:", profsRes.error);
      }

      const deptMap = new Map((depts || []).map(d => [d.id, d.name] as const));
      const roleMap = new Map<string, AppRole>();
      (rolesRes.data || []).forEach((r: any) => {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, r.role as AppRole);
      });

      const all: Profile[] = (profsRes.data ?? []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        department_id: p.department_id ?? undefined,
        department_name: p.department_id ? deptMap.get(p.department_id) : undefined,
        cargo: p.cargo ?? undefined,
        documento: p.documento ?? undefined,
        foto_url: p.foto_url ?? undefined,
        role: roleMap.get(p.id),
      }));

      setContatos(all.sort((a, b) => a.nome.localeCompare(b.nome)));
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
      
      const { data: convData, error } = await (supabase as any)
        .from('conversations')
        .select('id, titulo, created_at, tipo, department_id')
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

     const deptIds = Array.from(new Set((convData as any[]).map(c => c.department_id).filter(Boolean)));
     const deptNameMap = new Map<string, string>();
     if (deptIds.length) {
       const { data: deptRows } = await supabase
         .from('departments')
         .select('id, name')
         .in('id', deptIds);
       (deptRows || []).forEach((d: any) => deptNameMap.set(d.id, d.name));
     }

     const result: Conv[] = (convData as any[]).map((c: any) => {
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
         tipo: c.tipo,
         department_id: c.department_id,
         department_name: c.department_id ? deptNameMap.get(c.department_id) ?? null : null,
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
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles(nome)")
        .eq("conversation_id", active)
        .order("created_at");
      
      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return;
      }
      
      setMsgs(data ?? []);
      
      // marca como lida
      await supabase.from("conversation_participants")
        .update({ ultima_leitura: new Date().toISOString() })
        .eq("conversation_id", active).eq("user_id", user!.id);
    };

    loadMessages();

    const ch = supabase
      .channel(`msg-${active}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${active}` },
        () => {
          loadMessages(); // Recarregar para garantir o join do sender
        })
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
     if (selectedContacts.length === 0 && selectedDepartments.length === 0) {
       toast.error("Selecione ao menos um destinatário (profissional ou departamento).");
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
          const { error: upErr } = await supabase.storage.from("audio-messages").upload(path, file);
          if (upErr) { 
            console.error("Erro no upload do broadcast:", upErr);
            toast.error("Erro no upload do áudio: " + upErr.message); 
            setIsUploading(false);
            return; 
          }
          audioUrl = supabase.storage.from("audio-messages").getPublicUrl(path).data.publicUrl;
        }
      } catch (e: any) {
        console.error("Exceção no upload:", e);
        toast.error("Falha ao processar áudio.");
        setIsUploading(false);
        return;
      }

      let okCount = 0;
      const totalDestinos = selectedContacts.length + selectedDepartments.length;
      try {
        const conteudo = text.trim() || null;
        let lastConvId: string | null = null;

        // Departamentos
        for (const dept of selectedDepartments) {
          const { data: convId, error: rpcErr } = await (supabase as any)
            .rpc('get_or_create_department_conversation', { _department_id: dept.id });
          if (rpcErr || !convId) {
            console.error(`Erro ao preparar conversa do depto ${dept.name}:`, rpcErr);
            toast.error(`Erro ao preparar conversa do departamento ${dept.name}`);
            continue;
          }
          lastConvId = convId as string;
          const { error } = await supabase.from("messages").insert({
            conversation_id: convId,
            sender_id: user!.id,
            conteudo: conteudo || null,
            anexo_url: audioUrl || null,
            anexo_tipo: audioUrl ? "audio" : null,
          });
          if (error) {
            console.error(`Erro ao enviar para depto ${dept.name}:`, error);
            toast.error(`Erro ao enviar para ${dept.name}`);
          } else {
            okCount++;
          }
        }

        // Profissionais individuais
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
       setSelectedDepartments([]);
       setOpenNew(false);
       await loadConvs(); // Carrega tudo uma vez no final
       if (totalDestinos === 1 && lastConvId) setActive(lastConvId);
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

   const isDeptSelected = (id: string) => selectedDepartments.some(d => d.id === id);
   const toggleDepartment = (d: DeptOption) => {
     setSelectedDepartments(prev => prev.some(x => x.id === d.id) ? prev.filter(x => x.id !== d.id) : [...prev, d]);
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

   async function enviar(anexo?: { url: string; tipo: string }, messageText?: string, retryId?: string) {
    if (!active) {
      console.warn("Nenhuma conversa ativa selecionada");
      return;
    }
    const finalContent = messageText !== undefined ? messageText : text.trim();
    
    const tempId = retryId || crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      conversation_id: active,
      sender_id: user!.id,
      conteudo: finalContent,
      anexo_url: anexo?.url,
      anexo_tipo: anexo?.tipo,
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    if (!retryId) {
      setMsgs(prev => [...prev, tempMsg]);
    } else {
      setMsgs(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
    }
     
     // Se temos um áudio pendente e nenhum anexo foi passado explicitamente
     let finalAnexo = anexo;
     if (!finalAnexo && audioBlob) {
       setIsUploading(true);
       try {
         const file = new File([audioBlob], `audio-${crypto.randomUUID()}.webm`, { type: 'audio/webm' });
         const path = `chat/${active}/${file.name}`;
          const { error: upErr } = await supabase.storage.from("audio-messages").upload(path, file);
          if (upErr) throw upErr;
          const { data } = supabase.storage.from("audio-messages").getPublicUrl(path);
         finalAnexo = { url: data.publicUrl, tipo: "audio" };
       } catch (err: any) {
         toast.error("Erro ao enviar áudio: " + err.message);
         setIsUploading(false);
         return;
       }
       setIsUploading(false);
     }

     if (!finalContent && !finalAnexo) return;

     let error;
     if (editingMsg) {
       const { error: editError } = await supabase
         .from("messages")
         .update({ conteudo: finalContent })
         .eq("id", editingMsg.id);
       error = editError;
       setEditingMsg(null);
     } else {
       const { error: insertError } = await supabase.from("messages").insert({
         conversation_id: active,
         sender_id: user!.id,
         conteudo: finalContent || null,
         anexo_url: finalAnexo?.url ?? null,
         anexo_tipo: finalAnexo?.tipo ?? null,
       });
       error = insertError;
     }

      if (error) {
        console.error("Erro ao enviar mensagem:", error);
        setMsgs(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        toast.error("Falha ao enviar: " + error.message);
        return;
      }

      // Se for sucesso, o realtime vai cuidar do INSERT oficial, mas podemos atualizar o temp
      setMsgs(prev => prev.filter(m => m.id !== tempId));

      if (messageText === undefined) setText("");
      setAudioBlob(null);
      setAudioPreviewUrl(null);
   }

   async function retryMessage(m: any) {
     await enviar(m.anexo_url ? { url: m.anexo_url, tipo: m.anexo_tipo } : undefined, m.conteudo, m.id);
  }

  async function deleteMessage(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir mensagem.");
    } else {
      setMsgs(prev => prev.filter(m => m.id !== id));
      setDeleteConfirmOpen(null);
    }
  }

  async function uploadAnexo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !active) return;
    const tipo = f.type.startsWith("video/") ? "video" : "image";
    const path = `chat/${active}/${crypto.randomUUID()}-${f.name}`;
    const { error } = await supabase.storage.from("audio-messages").upload(path, f, { contentType: f.type });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("audio-messages").getPublicUrl(path);
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

    if (filterCode) {
      const low = filterCode.toLowerCase();
      result = result.filter(c => 
        (c.documento && c.documento.toLowerCase().includes(low)) || 
        c.id.toLowerCase().includes(low)
      );
    }

    if (selectedDeptId) {
      const dept = departments.find(d => d.id === selectedDeptId);
      const deptName = dept?.name;
      result = result.filter(c => {
        if (c.department_id === selectedDeptId) return true;
        if (!deptName) return false;
        const fallback = c.role ? ROLE_TO_DEPT[c.role] : undefined;
        return fallback === deptName || c.department_name === deptName;
      });
    }

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.nome.toLowerCase().includes(low) || 
        c.email.toLowerCase().includes(low) ||
        (c.documento && c.documento.toLowerCase().includes(low)) ||
        (c.role && ROLE_LABEL[c.role]?.toLowerCase().includes(low)) ||
        (c.department_name && c.department_name.toLowerCase().includes(low))
      );
    }
    
    if (filterCargo) {
      const low = filterCargo.toLowerCase();
      result = result.filter(c => c.cargo?.toLowerCase().includes(low));
    }
    
    if (filterFuncao) {
      const low = filterFuncao.toLowerCase();
      result = result.filter(c => c.role && ROLE_LABEL[c.role]?.toLowerCase().includes(low));
    }

    return result;
  }, [contatos, searchTerm, selectedDeptId, filterCode, filterCargo, filterFuncao]);

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
          {typeof window !== 'undefined' && (
            <AudioRecorder 
              onRecordingComplete={addAudioElement} 
              recorderControls={recorderControls}
              downloadOnSavePress={false}
              downloadFileExtension="webm"
            />
          )}
       </div>
 
       <div className="flex flex-col gap-2">
         <PageHeader title="Mensagens" description="Comunicação interna respeitando a hierarquia da equipe." />
         
         {archivedCount > 0 && myRole === 'admin' && (
           <div className="mx-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                 <Archive className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-sm font-bold text-amber-900">Mensagens Arquivadas</p>
                 <p className="text-xs text-amber-700">Existem {archivedCount} mensagens com mais de 5 anos arquivadas. Deseja excluí-las permanentemente?</p>
               </div>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleArchiveOldMessages(false)}>
                 Arquivar/Limpar
               </Button>
               <Button variant="destructive" size="sm" onClick={() => handleArchiveOldMessages(true)}>
                 Excluir Permanentemente
               </Button>
             </div>
           </div>
         )}
       </div>
      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-3 md:grid-cols-[300px_1fr]">
        {/* Lista */}
        <div className={cn(
          "flex flex-col rounded-md border border-border bg-card overflow-hidden transition-all duration-300",
          mobileView === 'thread' ? "hidden md:flex" : "flex"
        )}>
          <div className="flex items-center justify-between border-b border-border p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Conversas</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => loadConvs()}>
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <Dialog open={openNew} onOpenChange={(val) => { setOpenNew(val); if (!val) { setSearchTerm(""); setSelectedContacts([]); setSelectedDepartments([]); } }}>
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
                        <div className="flex items-center justify-between px-1 mb-3">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Departamentos</p>
                          {myRole === 'admin' && (
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingDept(null); setOpenDeptCrud(true); }}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                     <div className="space-y-1">
                        <Button 
                          variant={!selectedDeptId ? "secondary" : "ghost"} 
                          size="sm" 
                          className="w-full justify-start text-xs font-medium"
                          onClick={() => setSelectedDeptId(null)}
                        >
                          <UsersIcon className="h-3.5 w-3.5 mr-2" />
                          Todos (filtro)
                        </Button>
                        {departments.map((dept) => {
                          const deptSelected = isDeptSelected(dept.id);
                          return (
                            <div key={dept.id} className="group relative">
                              <Button 
                                variant={deptSelected ? "default" : (selectedDeptId === dept.id ? "secondary" : "ghost")} 
                                size="sm" 
                                className="w-full justify-start text-xs pr-8"
                                onClick={() => {
                                  // Clique no departamento: alterna como destinatário
                                  toggleDepartment(dept);
                                  setSelectedDeptId(dept.id);
                                }}
                                title={deptSelected ? "Departamento selecionado como destinatário" : "Enviar para o departamento inteiro"}
                              >
                                <Building2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                                <span className="truncate">{dept.name}</span>
                              </Button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedDeptId(dept.id); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-primary/10 transition-colors text-muted-foreground opacity-0 group-hover:opacity-100"
                                title="Apenas filtrar profissionais deste departamento"
                              >
                                 <Search className="h-2.5 w-2.5" />
                               </button>
                               {myRole === 'admin' && (
                                 <div className="absolute right-7 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setOpenDeptCrud(true); }}
                                     className="p-1 hover:text-primary"
                                   >
                                     <Edit2 className="h-2.5 w-2.5" />
                                   </button>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); deleteDept(dept.id); }}
                                     className="p-1 hover:text-destructive"
                                   >
                                     <Trash2 className="h-2.5 w-2.5" />
                                   </button>
                                 </div>
                               )}
                            </div>
                          );
                        })}
                     </div>
                   </div>

                    {/* Contatos */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-card">
                      {/* Destinatários selecionados (Badges) */}
                      {(selectedContacts.length > 0 || selectedDepartments.length > 0) && (
                        <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Para:</span>
                          {selectedDepartments.map(d => (
                            <Badge key={`d-${d.id}`} variant="default" className="pl-2 pr-1 py-1 gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="max-w-[140px] truncate">{d.name}</span>
                              <button onClick={() => toggleDepartment(d)} className="ml-1 rounded-full hover:bg-muted/40 p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          {selectedContacts.map(c => (
                            <Badge key={c.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                              <span className="max-w-[120px] truncate">{c.nome}</span>
                              <button onClick={() => toggleContact(c)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                          <Button variant="link" onClick={() => { setSelectedContacts([]); setSelectedDepartments([]); }} className="h-auto p-0 text-[10px] text-muted-foreground hover:text-destructive ml-auto">
                            Limpar Tudo
                          </Button>
                        </div>
                      )}

                      {/* Busca e Filtros Avançados */}
                      <div className="p-4 border-b space-y-3 bg-muted/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Nome ou E-mail..."
                              className="pl-10 h-9 border-muted"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Código/ID..."
                              className="h-9 border-muted"
                              value={filterCode}
                              onChange={(e) => setFilterCode(e.target.value)}
                            />
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Cargo..."
                              className="h-9 border-muted"
                              value={filterCargo}
                              onChange={(e) => setFilterCargo(e.target.value)}
                            />
                          </div>
                          <div className="relative">
                            <Input
                              placeholder="Função..."
                              className="h-9 border-muted"
                              value={filterFuncao}
                              onChange={(e) => setFilterFuncao(e.target.value)}
                            />
                          </div>
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
                         {myRole === 'admin' && (
                           <div className="px-4 py-2 border-b bg-muted/5 flex justify-end">
                             <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => { setEditingProfile(null); setOpenProfileCrud(true); }}>
                               <Plus className="h-3 w-3" /> Novo Profissional
                             </Button>
                           </div>
                         )}
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
                                    <div
                                      key={p.id}
                                      className={cn(
                                        "flex items-center gap-3 w-full text-left p-2 rounded-xl transition-all border group",
                                        checked 
                                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                                          : "hover:bg-muted/30 border-transparent"
                                      )}
                                    >
                                      <Checkbox 
                                        checked={checked} 
                                        onCheckedChange={() => toggleContact(p)} 
                                        className="h-5 w-5 ml-1"
                                      />
                                      <div 
                                        className="flex-1 flex items-center gap-3 cursor-pointer"
                                        onClick={() => startConversa(p)}
                                      >
                                        {p.foto_url ? (
                                          <img 
                                            src={p.foto_url} 
                                            alt={p.nome} 
                                            className="h-10 w-10 rounded-full object-cover shrink-0 border border-border"
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            {p.nome.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold truncate">{p.nome}</p>
                                            {p.documento && (
                                              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                {p.documento}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-muted-foreground truncate">
                                            {p.cargo ? `${p.cargo} • ` : ""}{p.department_name || "Sem departamento"}
                                          </p>
                                        </div>
                                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                           {myRole === 'admin' && (
                                             <>
                                               <Button 
                                                 variant="ghost" 
                                                 size="icon" 
                                                 className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                 onClick={(e) => { e.stopPropagation(); setEditingProfile(p); setOpenProfileCrud(true); }}
                                               >
                                                 <Edit2 className="h-3 w-3" />
                                               </Button>
                                               <Button 
                                                 variant="ghost" 
                                                 size="icon" 
                                                 className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                 onClick={async (e) => { 
                                                   e.stopPropagation(); 
                                                   if (confirm("Deseja realmente inativar este perfil?")) {
                                                     await supabase.from("profiles").update({ ativo: false }).eq("id", p.id);
                                                     window.location.reload();
                                                   }
                                                 }}
                                               >
                                                 <Trash2 className="h-3 w-3" />
                                               </Button>
                                             </>
                                           )}
                                           <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-tighter">
                                             Conversar
                                           </Button>
                                         </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {filteredContatos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed mx-4">
                              <Building2 className="h-12 w-12 opacity-10 mb-3 text-primary" />
                              <p className="text-sm font-bold text-foreground">Utilize os Departamentos</p>
                              <p className="text-[11px] opacity-70 text-center max-w-[240px] mt-2 px-4 leading-relaxed">
                                Não foram encontrados profissionais com estes filtros. <br/>
                                <strong>Selecione um departamento</strong> na barra lateral esquerda para enviar uma mensagem setorial.
                              </p>
                              {myRole === 'admin' && (
                                <Button variant="outline" size="sm" className="mt-4 h-8 text-[10px]" onClick={() => setOpenProfileCrud(true)}>
                                  Cadastrar Profissional
                                </Button>
                              )}
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
                          placeholder={(selectedContacts.length === 0 && selectedDepartments.length === 0)
                            ? "Selecione destinatários para habilitar o envio..."
                            : `Mensagem para ${selectedDepartments.length} departamento(s) e ${selectedContacts.length} profissional(is)...`}
                          className="pr-12 rounded-2xl h-14 bg-card border-muted-foreground/20 focus-visible:ring-primary shadow-sm text-sm"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          onKeyDown={(e) => { 
                            if (e.key === "Enter" && !e.shiftKey && (text.trim() || audioBlob) && (selectedContacts.length > 0 || selectedDepartments.length > 0)) {
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
                              (selectedContacts.length === 0 && selectedDepartments.length === 0) && "opacity-50 cursor-not-allowed"
                            )}
                             onClick={async () => { 
                               if (selectedContacts.length === 0 && selectedDepartments.length === 0) return;
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
                      {(selectedContacts.length > 0 || selectedDepartments.length > 0) ? (
                        <p className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
                          Enviando para <span className="text-primary font-bold">{selectedDepartments.length}</span> departamento(s) e <span className="text-primary font-bold">{selectedContacts.length}</span> profissional(is).
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">
                          Clique em um departamento à esquerda ou em um profissional para escolher o destinatário.
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
                ) : convs.map((c) => {
                  const isDept = c.tipo === 'department' || !!c.department_id;
                  const displayName = isDept
                    ? (c.department_name || c.titulo || 'Departamento')
                    : (c.outros.map((o) => o.nome).join(", ") || c.titulo || 'Conversa');
                  const avatarUrl = !isDept ? c.outros[0]?.foto_url : undefined;
                  const initial = isDept ? '#' : (c.outros[0]?.nome?.charAt(0) || 'C');
                  return (
                 <button 
                   key={c.id} 
                   onClick={() => setActive(c.id)}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all mb-1 text-left group relative",
                     active === c.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-accent border-l-4 border-transparent"
                   )}
                 >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                        {isDept ? <Building2 className="h-4 w-4" /> : initial}
                      </div>
                    )}
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-0.5">
                       <div className={cn("text-sm font-bold truncate", active === c.id ? "text-primary" : "text-foreground")}>
                         {displayName}
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
                  );
                })}
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
                {(() => {
                  const isDept = activeConv?.tipo === 'department' || !!activeConv?.department_id;
                  const headerName = isDept
                    ? (activeConv?.department_name || activeConv?.titulo || 'Departamento')
                    : (activeConv?.outros.map((o) => o.nome).join(", ") || 'Conversa');
                  const headerSub = isDept
                    ? `Conversa do departamento • ${activeConv?.outros.length ?? 0} participantes`
                    : (activeConv?.outros[0]?.role
                        ? ROLE_LABEL[activeConv.outros[0].role as AppRole]
                        : 'Profissional');
                  return (
                    <div className="flex items-center gap-3 flex-1">
                      {!isDept && activeConv?.outros[0]?.foto_url ? (
                        <img src={activeConv.outros[0].foto_url} alt={headerName} className="h-8 w-8 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {isDept ? <Building2 className="h-4 w-4" /> : (activeConv?.outros[0]?.nome?.charAt(0) || 'C')}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="text-sm font-bold truncate">{headerName}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter flex gap-2">
                          <span>{headerSub}</span>
                          {!isDept && activeConv?.outros[0]?.department_name && (
                            <>
                              <span>•</span>
                              <span>{activeConv.outros[0].department_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {msgs.map((m) => {
                  const mine = m.sender_id === user?.id;
                  const senderName = m.sender?.nome || "Usuário";
                  const recipientName = activeConv?.tipo === 'department' 
                    ? (activeConv.department_name || 'Departamento')
                    : (activeConv?.outros.map((o: any) => o.nome).join(", ") || 'Destinatário');

                  return (
                   <div key={m.id} className={cn("flex group", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <div className={cn("text-[9px] mb-1 opacity-70 font-bold uppercase tracking-tight flex items-center gap-1", mine ? "justify-end" : "justify-start")}>
                          {mine ? (
                            <><span>Para:</span> <span className="underline decoration-primary-foreground/30">{recipientName}</span></>
                          ) : (
                            <><span>De:</span> <span className="underline decoration-primary/10">{senderName}</span></>
                          )}
                        </div>

                        {m.anexo_url && m.anexo_tipo === "image" && (
                          <img src={m.anexo_url} className="mb-1 max-h-64 rounded" />
                        )}
                        {m.anexo_url && m.anexo_tipo === "video" && (
                          <video src={m.anexo_url} controls className="mb-1 max-h-64 rounded" />
                        )}
                        {m.anexo_url && m.anexo_tipo === "audio" && (
                          <audio src={m.anexo_url} controls className="mb-1 w-full min-w-[200px]" />
                        )}
                        {m.status === 'sending' && (
                          <div className="flex items-center gap-2 text-[10px] opacity-70 italic mb-1">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Enviando...
                          </div>
                        )}
                        {m.status === 'error' && (
                          <div className="flex items-center gap-2 text-[10px] text-destructive-foreground font-bold mb-1 bg-destructive/20 p-1 rounded">
                            <AlertCircle className="h-3 w-3" /> Falha no envio
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-white underline" onClick={() => retryMessage(m)}>
                              Reenviar
                            </Button>
                          </div>
                        )}
                         <div className="flex justify-between items-start gap-2">
                           {m.conteudo && <div className="whitespace-pre-wrap break-words flex-1">{m.conteudo}</div>}
                           {mine && (
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <MoreVertical className="h-3 w-3" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 {m.conteudo && (
                                   <DropdownMenuItem onClick={() => {
                                     setEditingMsg({ id: m.id, conteudo: m.conteudo });
                                     setText(m.conteudo);
                                   }}>
                                     <Edit2 className="h-3 w-3 mr-2" /> Editar
                                   </DropdownMenuItem>
                                 )}
                                 <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmOpen({ id: m.id })}>
                                   <Trash2 className="h-3 w-3 mr-2" /> Excluir
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           )}
                         </div>
                          <div className={cn("mt-1 text-[10px] opacity-70 flex flex-wrap items-center gap-x-2 gap-y-0.5", mine ? "justify-end" : "")}>
                           {m.updated_at !== m.created_at && <span>(editada)</span>}
                            <span>
                              {new Date(m.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              {" - "}
                              {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                         </div>
                       </div>
                     </div>
                  );
                })}
               <div ref={endRef} />
               
               <Dialog open={!!deleteConfirmOpen} onOpenChange={(val) => !val && setDeleteConfirmOpen(null)}>
                 <DialogContent className="sm:max-w-[425px]">
                   <DialogHeader>
                     <DialogTitle>Excluir Mensagem</DialogTitle>
                     <DialogDescription>
                       Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
                     </DialogDescription>
                   </DialogHeader>
                   <DialogFooter className="flex gap-2 sm:gap-0">
                     <Button variant="ghost" onClick={() => setDeleteConfirmOpen(null)}>Cancelar</Button>
                     <Button variant="destructive" onClick={() => deleteConfirmOpen && deleteMessage(deleteConfirmOpen.id)}>Excluir</Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>
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
                        <div className="relative flex flex-col w-full">
                          {editingMsg && (
                            <div className="absolute -top-10 left-0 right-0 bg-primary/10 px-3 py-1 rounded-t-lg flex items-center justify-between border-x border-t border-primary/20">
                              <span className="text-[10px] font-bold text-primary uppercase">Editando mensagem</span>
                              <button onClick={() => { setEditingMsg(null); setText(""); }} className="text-muted-foreground hover:text-primary">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <Input 
                             autoFocus
                             value={text} 
                             onChange={(e) => setText(e.target.value)}
                             onKeyDown={(e) => { 
                               if (e.key === "Enter" && !e.shiftKey && (text.trim() || audioBlob)) { 
                                 e.preventDefault(); 
                                 enviar(); 
                               } 
                             }}
                             placeholder={editingMsg ? "Altere sua mensagem..." : "Escreva sua mensagem..."} 
                             className={cn(
                               "pr-10 bg-card border-border focus-visible:ring-primary h-10 shadow-inner",
                               editingMsg ? "rounded-b-xl rounded-t-none border-t-0" : "rounded-full"
                             )}
                           />
                        </div>
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
                        {isUploading ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-[6px] mt-0.5 text-white uppercase font-bold">Subindo</span>
                          </div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                   </div>
                 )}
              </div>
            </>
          )}
        </div>

        {/* Modals de CRUD */}
        <Dialog open={openDeptCrud} onOpenChange={setOpenDeptCrud}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase">Nome do Departamento</label>
                <Input 
                  defaultValue={editingDept?.name || ""} 
                  placeholder="Ex: Operacional, Financeiro..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveDepartment(e.currentTarget.value);
                  }}
                  id="dept-name-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenDeptCrud(false)}>Cancelar</Button>
              <Button onClick={() => {
                const input = document.getElementById('dept-name-input') as HTMLInputElement;
                saveDepartment(input.value);
              }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openProfileCrud} onOpenChange={setOpenProfileCrud}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProfile ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold uppercase">Nome Completo</label>
                <Input id="prof-nome" defaultValue={editingProfile?.nome || ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">E-mail</label>
                <Input id="prof-email" defaultValue={editingProfile?.email || ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Código/Documento</label>
                <Input id="prof-doc" defaultValue={editingProfile?.documento || ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Cargo</label>
                <Input id="prof-cargo" defaultValue={editingProfile?.cargo || ""} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase">Departamento</label>
                <select id="prof-dept" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" defaultValue={editingProfile?.department_id || ""}>
                  <option value="">Nenhum</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenProfileCrud(false)}>Cancelar</Button>
              <Button onClick={() => {
                const data = {
                  nome: (document.getElementById('prof-nome') as HTMLInputElement).value,
                  email: (document.getElementById('prof-email') as HTMLInputElement).value,
                  documento: (document.getElementById('prof-doc') as HTMLInputElement).value,
                  cargo: (document.getElementById('prof-cargo') as HTMLInputElement).value,
                  department_id: (document.getElementById('prof-dept') as HTMLSelectElement).value || undefined,
                };
                saveProfile(data);
              }}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}