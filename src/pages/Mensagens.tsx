import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, ROLE_LABEL } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Send, Paperclip, Camera, Plus, MessageSquare, Search, User, Users as UsersIcon, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Profile = { id: string; nome: string; email: string; role?: AppRole };
type Conv = { id: string; titulo: string | null; created_at: string; outros: Profile[]; ultima?: string };

export default function Mensagens() {
  const { user, roles } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [contatos, setContatos] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

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
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ids = (parts ?? []).map((p: any) => p.conversation_id);
    if (!ids.length) { setConvs([]); return; }
    const { data: cs } = await supabase
      .from("conversations")
      .select("id, titulo, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    const { data: allParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profiles:profiles!conversation_participants_user_id_fkey(id,nome,email)")
      .in("conversation_id", ids);
    // fallback: profiles join may not work without FK; fetch separately
    const otherIds = Array.from(new Set((allParts ?? []).map((p: any) => p.user_id).filter((u: string) => u !== user.id)));
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("id, nome, email").in("id", otherIds)
      : { data: [] as any[] };
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const result: Conv[] = (cs ?? []).map((c: any) => {
      const others = (allParts ?? [])
        .filter((p: any) => p.conversation_id === c.id && p.user_id !== user.id)
        .map((p: any) => profMap.get(p.user_id))
        .filter(Boolean) as Profile[];
      return { ...c, outros: others };
    });
    setConvs(result);
  }

  useEffect(() => { loadConvs(); }, [user]);

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
    // procura conversa direta existente
    const existing = convs.find((c) => c.outros.length === 1 && c.outros[0].id === other.id);
    if (existing) { setActive(existing.id); setOpenNew(false); return; }
    const { data: c, error } = await supabase
      .from("conversations")
      .insert({ tipo: "direct", titulo: other.nome, created_by: user!.id })
      .select("id").single();
    if (error || !c) { toast.error(error?.message ?? "Erro"); return; }
    const { error: e2 } = await supabase.from("conversation_participants").insert([
      { conversation_id: c.id, user_id: user!.id },
      { conversation_id: c.id, user_id: other.id },
    ]);
    if (e2) { toast.error(e2.message); return; }
    await loadConvs();
    setActive(c.id);
    setOpenNew(false);
  }

  async function enviar(anexo?: { url: string; tipo: string }) {
    if (!active) return;
    if (!text.trim() && !anexo) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: active,
      sender_id: user!.id,
      conteudo: text.trim() || null,
      anexo_url: anexo?.url ?? null,
      anexo_tipo: anexo?.tipo ?? null,
    });
    if (error) return toast.error(error.message);
    setText("");
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
      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-3 md:grid-cols-[280px_1fr]">
        {/* Lista */}
        <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-2">
            <span className="text-xs font-medium text-muted-foreground">Conversas</span>
            <Dialog open={openNew} onOpenChange={(val) => { setOpenNew(val); if (!val) setSearchTerm(""); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost"><Plus className="h-3.5 w-3.5 mr-1" />Nova</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Iniciar conversa com departamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nome, email ou cargo..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-6">
                      {Object.entries(contatosPorRole).map(([role, list]) => (
                        <div key={role} className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                            <Building2 className="h-3 w-3" />
                            {ROLE_LABEL[role as AppRole] || role}
                          </h4>
                          <div className="grid gap-1">
                            {list.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => startConversa(p)}
                                className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-accent transition-colors group"
                              >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                                  {p.nome.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.nome}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px] h-4 px-1">{ROLE_LABEL[p.role as AppRole]?.split(' ')[0] || p.role}</Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {filteredContatos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                          <User className="h-10 w-10 opacity-20 mb-2" />
                          <p className="text-sm">Nenhum contato encontrado.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)}>Fechar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-auto">
            {convs.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
                Nenhuma conversa.
              </div>
            ) : convs.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={cn("w-full border-b border-border text-left px-3 py-2 hover:bg-accent transition-colors",
                  active === c.id && "bg-accent")}>
                <div className="text-sm font-medium truncate">
                  {c.outros.map((o) => o.nome).join(", ") || c.titulo || "Conversa"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col rounded-md border border-border bg-card overflow-hidden">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          ) : (
            <>
              <div className="border-b border-border p-3">
                <div className="text-sm font-medium">
                  {activeConv?.outros.map((o) => o.nome).join(", ") || "Conversa"}
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
              <div className="flex items-center gap-2 border-t border-border p-2">
                <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={uploadAnexo} />
                <input ref={camRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={uploadAnexo} />
                <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} title="Anexar">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => camRef.current?.click()} title="Câmera">
                  <Camera className="h-4 w-4" />
                </Button>
                <Input value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Mensagem..." />
                <Button size="icon" onClick={() => enviar()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}