import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { osService } from "@/services/osService";
import { useAuth } from "@/lib/auth";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
 import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
  import { Plus, Trash2, MapPin, Camera, Video, History, CheckCircle, CheckCircle2, ShieldCheck, Briefcase, XCircle, AlertCircle, Download, Send, MessageSquare, RefreshCw, X, Eye, Info, Search, Package, ShoppingCart, Filter, Archive, User, ListTodo } from "lucide-react";
 import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { cn } from "@/lib/utils";
 import { getEvidenceRules, validateFile, checkEvidenceCompleteness, type EvidenceRules, type EvidenceCheck } from "@/lib/evidenceRules";
 import { OS_STATUS_FLOW, type OSStatus } from "@/shared/status/os-status";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function OSDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
    const { user, hasRole, roles, profile } = useAuth();
  const [os, setOS] = useState<any>(null);
   const [fin, setFin] = useState<any>(null);
   const [items, setItems] = useState<any[]>([]);
  const [osMaterials, setOsMaterials] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [evid, setEvid] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean, type: 'correcao' | 'reprovar', comment: string }>({ open: false, type: 'correcao', comment: '' });
    const [busy, setBusy] = useState(false);
    const [stockLevels, setStockLevels] = useState<any[]>([]);
    const [cats, setCats] = useState<any[]>([]);

    async function loadStockLevels() {
      const { data } = await supabase.from("stock_levels").select("*");
      setStockLevels(data || []);
    }

    useEffect(() => {
      loadStockLevels();
    }, []);

    const [atvs, setAtvs] = useState<any[]>([]);
    const [allAtvs, setAllAtvs] = useState<any[]>([]);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("all");
    const [activityPopoverOpen, setActivityPopoverOpen] = useState(false);
   const [equipes, setEquipes] = useState<any[]>([]);
   const [profs, setProfs] = useState<any[]>([]);
  const [add, setAdd] = useState(false);
   const [codes, setCodes] = useState<any[]>([]);
   const [form, setForm] = useState<any>({ 
     categoria_id: "", 
     atividade_id: "", 
     execution_code_id: "",
     quantidade: "", 
     observacao: "" 
   });
   const [checklist, setChecklist] = useState<Record<string, any>>({});
   const [mediaUpload, setMediaUpload] = useState<{
     file: File | null;
     previewUrl: string | null;
     uploading: boolean;
     error: string | null;
   }>({ file: null, previewUrl: null, uploading: false, error: null });
   const [evRules, setEvRules] = useState<EvidenceRules | null>(null);
   const [evCheck, setEvCheck] = useState<EvidenceCheck>({ ok: false, missing: [] });

  const isOwner = os && user && (os.profissional_id === user.id || os.created_by === user.id);
  const isFromDept = os && profile && os.department_id === profile.department_id;
    const isSystemAdmin = hasRole(["admin", "developer"]);
    const isDeptManager = hasRole(["gestor"]) && os?.department_id === profile?.department_id;
    const canApprove = isSystemAdmin || isDeptManager || hasRole(["supervisor"]);
    const isGestor = isSystemAdmin || isDeptManager;
  const canEdit = (isOwner || isGestor || (hasRole(["supervisor"]) && os?.department_id === profile?.department_id)) && 
                  ["iniciada","os lançada","os lancada","em_andamento","correcao_solicitada","corrigida","rascunho","pendente","atribuida","em_deslocamento","chegou_ao_local","em_execucao","pronta_para_execucao"].includes((os?.operational_status || os?.status || "").toLowerCase());

  const [startValidation, setStartValidation] = useState<{ can_start: boolean, blocked_by: string[], message: string } | null>(null);

  useEffect(() => {
    if (os && user) {
      osService.canStartWorkOrder(os.id, user.id).then(setStartValidation);
    }
  }, [os, user]);

   const load = useCallback(async () => {
       const { data: o, error: osError } = await supabase.from("ordens_servico")
         .select(`
           *, 
           obra:obras(numero, nome, endereco, cidade, estado, bairro, cep, cliente), 
           profissional:profiles!ordens_servico_profissional_id_fkey(nome),
           servico:servicos(nome),
           department:departments(name)
         `)
         .eq("id", id).maybeSingle();

      if (!o) {
        if (osError) {
          console.error("Erro ao carregar OS:", osError);
          toast.error("Erro ao carregar dados da OS");
        } else {
          toast.error("Você não possui permissão para acessar esta ordem de serviço.");
          nav("/app/os");
        }
        return;
      }
     setOS(o);
     const { data: it } = await supabase.from("os_atividades").select("*, atividade:atividades(codigo_item,descricao), categoria:categorias(nome)").eq("os_id", id).order("created_at");
     setItems(it ?? []);
      const { data: ev } = await supabase.from("os_evidences").select("*, profile:profiles(nome)").eq("os_id", id).is("deleted_at", null).order("created_at", { ascending: false });
      setEvid(ev ?? []);
      const { data: logs } = await supabase.from("os_audit_logs").select("*, profile:profiles(nome)").eq("os_id", id).order("created_at", { ascending: false });
      setAuditLogs(logs ?? []);
      const { data: msg } = await supabase.from("os_messages").select("*, sender:profiles(nome)").eq("os_id", id).order("created_at", { ascending: true });
      setMessages(msg ?? []);
      const { data: osm } = await supabase.from("os_materials").select("*, materials(name, code, unit)").eq("os_id", id);
      setOsMaterials(osm ?? []);
   }, [id]);

   useEffect(() => {
     load();
     supabase.from("categorias").select("*").eq("ativo", true).order("ordem").then(({ data }) => setCats(data ?? []));
     supabase.from("execution_codes").select("*").eq("active", true).order("code").then(({ data }) => setCodes(data ?? []));
     
     // Carregar equipes filtradas pelo departamento da OS se o usuário for gestor do departamento
     const fetchEquipes = async () => {
       let query = supabase.from("equipes").select("*").order("nome");
       if (isDeptManager && os?.department_id) {
         query = query.eq("department_id", os.department_id);
       }
       const { data } = await query;
       setEquipes(data ?? []);
     };

     // Carregar profissionais filtrados
     const fetchProfs = async () => {
       let query = supabase.from("profiles").select("id, nome").order("nome");
       if (isDeptManager && os?.department_id) {
         query = query.eq("department_id", os.department_id);
       }
       const { data } = await query;
       setProfs(data ?? []);
     };

     fetchEquipes();
     fetchProfs();
     supabase.from("departments").select("id, name").eq("active", true).order("name").then(({ data }) => setDeps(data ?? []));
     getEvidenceRules().then(setEvRules);
   }, [load, os?.department_id, isDeptManager]);

  useEffect(() => {
    if (!evRules) return;
    setEvCheck(checkEvidenceCompleteness(evid, items, evRules));
  }, [evid, items, evRules]);

    useEffect(() => {
      // Load catalog for all authorized profiles
      if (os?.servico_id || hasRole(['admin', 'gestor', 'supervisor', 'campo'])) {
        supabase.from("atividades")
          .select("*, categoria:categorias(nome, servico_id)")
          .eq("ativo", true)
          .order("codigo_item")
          .then(({ data }) => {
            setAllAtvs(data ?? []);
          });
      }
    }, [os?.servico_id, roles, hasRole]);

    useEffect(() => {
      let filtered = allAtvs;
      if (selectedCategoriaId !== "all") {
        filtered = allAtvs.filter(a => a.categoria_id === selectedCategoriaId);
      } else if (os?.servico_id) {
        filtered = allAtvs.filter(a => a.categoria?.servico_id === os.servico_id);
      }
      setAtvs(filtered);
    }, [allAtvs, selectedCategoriaId, os?.servico_id]);

   useEffect(() => {
     const code = codes.find(c => c.id === form.execution_code_id);
     if (code?.checklist_template) {
       setChecklist({}); // Reset checklist on code change
     }
   }, [form.execution_code_id, codes]);

  const [searchTerm, setSearchTerm] = useState("");

  const ativSel = atvs.find((a) => a.id === form.atividade_id);
  const umdTotal = ativSel && form.quantidade ? Number(form.quantidade) * Number(ativSel.umd_unitaria) : 0;

  function getGeo(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((res) => {
      if (!navigator.geolocation) return res({});
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res({}), { timeout: 5000 }
      );
    });
  }

  async function addItem(activity?: any) {
    const activityId = activity?.id || form.atividade_id;
    const categoryId = activity?.categoria_id || form.categoria_id;

    if (!activityId || !form.quantidade) {
      if (!form.quantidade) toast.error("Informe a quantidade");
      else toast.error("Selecione a atividade");
      return;
    }

    const targetAtv = activity || atvs.find(a => a.id === activityId);
    const q = Number(form.quantidade);
    if (!(q > 0)) return toast.error("Quantidade inválida");

    setBusy(true);
    try {
      const geo = targetAtv?.exige_localizacao ? await getGeo() : {};

      const { error } = await supabase.from("os_atividades").insert({
        os_id: id,
        atividade_id: activityId,
        categoria_id: categoryId,
        quantidade: q,
        umd_unitaria: targetAtv.umd_unitaria,
        umd_total: q * Number(targetAtv.umd_unitaria),
        unidade: targetAtv.unidade,
        observacao: form.observacao || null,
        latitude: geo.lat,
        longitude: geo.lng,
        created_by: user!.id,
      });

      if (error) throw error;

      const currentStatus = (os.operational_status || os.status || "pendente").toLowerCase();
      if (["pendente", "atribuida", "material_liberado", "pronta_para_execucao", "iniciada", "os lançada", "os lancada"].includes(currentStatus)) {
        await supabase.from("ordens_servico").update({
          operational_status: "em_execucao",
        }).eq("id", id);
      }

      setAdd(false);
      setForm({ categoria_id: "", atividade_id: "", quantidade: "", observacao: "", execution_code_id: "" });
      toast.success("Atividade lançada");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao lançar atividade");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!confirm("Remover este lançamento?")) return;
    await supabase.from("os_atividades").delete().eq("id", itemId);
    load();
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("os_messages").insert({ 
        os_id: id, 
        sender_id: user!.id, 
        content: newMessage 
      });
      if (error) throw error;
      setNewMessage("");
      // Update local state immediately for better UX
      const { data: msg } = await supabase.from("os_messages")
        .select("*, sender:profiles(nome)")
        .eq("os_id", id)
        .order("created_at", { ascending: true });
      setMessages(msg ?? []);
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    } finally {
      setBusy(false);
    }
  }

   function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;
     if (evRules) {
       const err = validateFile(file, evRules);
       if (err) {
         toast.error(err);
         e.target.value = "";
         return;
       }
     }
     
     if (mediaUpload.previewUrl) URL.revokeObjectURL(mediaUpload.previewUrl);
     
     setMediaUpload({
       file,
       previewUrl: URL.createObjectURL(file),
       uploading: false,
       error: null
     });
     e.target.value = "";
   }

   async function executeUpload() {
     if (!mediaUpload.file) return;
     
     setMediaUpload(prev => ({ ...prev, uploading: true, error: null }));
     const f = mediaUpload.file;
     const isVideo = f.type.startsWith("video/");
     const path = `${id}/${crypto.randomUUID()}-${f.name}`;
     
     try {
       const { error: storageError } = await supabase.storage.from("os-evidences").upload(path, f, { 
         contentType: f.type,
         cacheControl: '3600',
         upsert: false
       });
       
       if (storageError) throw storageError;
       
       const geo = await getGeo();
       const { error: dbError } = await supabase.from("os_evidences").insert({ 
         os_id: id, 
         url: path, 
         user_id: user!.id, 
         tipo: isVideo ? "video" : "foto",
         localizacao: geo,
         metadata: { size: f.size, name: f.name, type: f.type }
       });
       
       if (dbError) throw dbError;
       
       toast.success("Evidência enviada com sucesso!");
       setMediaUpload({ file: null, previewUrl: null, uploading: false, error: null });
       load();
     } catch (err: any) {
       console.error("Upload error:", err);
       const errorMessage = err.message || "Falha ao enviar arquivo";
       setMediaUpload(prev => ({ ...prev, uploading: false, error: errorMessage }));
       toast.error(errorMessage);
     }
   }

  async function finalizar() {
    if (!items.length) return toast.error("OS sem atividades. Lance pelo menos uma atividade antes de finalizar.");
    setBusy(true);
    try {
      const geo = await getGeo();
       const { error } = await supabase.from("ordens_servico").update({
         operational_status: "aguardando_validacao_supervisor", 
         status: "aguardando_revisao", 
         fim_em: new Date().toISOString(),
         fim_lat: geo.lat, 
         fim_lng: geo.lng,
       }).eq("id", id);
      
      if (error) throw error;
      
      await registrarAuditoria("aguardando_validacao_supervisor", "finalizacao_profissional", { message: "OS finalizada pelo profissional e enviada para revisão do supervisor." });
      toast.success("OS enviada para validação do supervisor!");
      load();
    } catch (err: any) {
      toast.error("Erro ao finalizar OS: " + err.message);
    } finally {
      setBusy(false);
    }
  }

    async function registrarAuditoria(statusNovo: string, action: string = "status_change", details: any = {}) {
      try {
        const { error } = await (supabase.from("os_audit_logs") as any).insert({
          os_id: id,
          user_id: user!.id,
          action: action,
          old_value: os.operational_status || os.status,
          new_value: statusNovo,
          details: { ...details, timestamp: new Date().toISOString() }
        });
        if (error) console.error("Erro ao registrar auditoria:", error);
      } catch (err) {
        console.error("Erro excepcional na auditoria:", err);
      }
    }

   async function aprovar() {
     if (!evCheck.ok) {
       return toast.error("Evidências incompletas: " + evCheck.missing.join("; "));
     }
     
     const obs = prompt("Comentário de aprovação (opcional):") || "";
     setBusy(true);
     try {
       await supabase.from("os_atividades").update({ status: "aprovado" }).eq("os_id", id);
       const { error } = await supabase.from("ordens_servico").update({ 
         operational_status: "aprovada_supervisor",
         status: "aprovada", 
         aprovado_por: user!.id, 
         aprovado_em: new Date().toISOString(),
         validated_at: new Date().toISOString(),
         validated_by: user!.id
       }).eq("id", id);
       
       if (error) throw error;
       
       await registrarAuditoria("aprovada", obs);
       toast.success("OS aprovada com sucesso");
       load();
     } catch (err: any) {
       toast.error(err.message);
     } finally {
       setBusy(false);
     }
   }

  async function handleReview() {
    if (!reviewDialog.comment && reviewDialog.type === "reprovar") return toast.error("Motivo é obrigatório");
    const status = reviewDialog.type === "reprovar" ? "reprovada_auditoria" : "correcao_solicitada";
    const update: any = { operational_status: status };
    if (reviewDialog.type === "reprovar") {
      update.motivo_reprovacao = reviewDialog.comment;
    } else {
      update.observacao_supervisor = reviewDialog.comment;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("ordens_servico").update(update).eq("id", id);
      if (error) throw error;
      await registrarAuditoria(status, reviewDialog.type === "reprovar" ? "reprovacao" : "solicitacao_correcao", { comment: reviewDialog.comment });
      
      // Create non-conformity if requested
      await supabase.from("non_conformities").insert({
        os_id: id,
        title: reviewDialog.type === "reprovar" ? "OS Reprovada" : "Correção Solicitada",
        description: reviewDialog.comment,
        severity: reviewDialog.type === "reprovar" ? "alta" : "media",
        assigned_to: os.profissional_id,
        created_by: user!.id,
        status: 'aberta'
      });

      // Create corrective task for professional
      await supabase.from("department_tasks").insert({
        os_id: id,
        assigned_to: os.profissional_id,
        task_type: "solicitar_correcao",
        title: "Correção Necessária na OS",
        description: reviewDialog.comment,
        priority: reviewDialog.type === "reprovar" ? "alta" : "normal",
        created_by: user!.id
      });

      toast.success(reviewDialog.type === "reprovar" ? "OS reprovada e não conformidade registrada" : "Correção solicitada ao profissional");
      setReviewDialog(prev => ({ ...prev, open: false }));
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

    async function salvarAtribuicao(fields: {
      equipe_id?: string | null,
      profissional_id?: string | null,
      supervisor_id?: string | null,
      gestor_responsavel_id?: string | null,
      auditor_id?: string | null
    }) {
      const updateData: any = { ...fields };
      
      if (os.status === "pendente" || os.operational_status === "pendente") {
        updateData.status = "iniciada";
        updateData.operational_status = "iniciada";
      }

      const { error } = await supabase.from("ordens_servico").update(updateData).eq("id", id);
     if (error) return toast.error(error.message);
     toast.success("Atribuição atualizada");
     load();
   }

  async function deleteEvidence(evId: string) {
    if (!confirm("Tem certeza que deseja excluir esta evidência?")) return;
    try {
      const { error: dbError } = await supabase
        .from("os_evidences")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", evId);
      if (dbError) throw dbError;
      toast.success("Evidência removida com sucesso");
      load();
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    }
  }

  async function removeMaterial(mId: string) {
    if (!confirm("Remover este material da OS?")) return;
    await supabase.from("os_materials").delete().eq("id", mId);
    load();
  }

  const [addMat, setAddMat] = useState(false);
  const [matForm, setMatForm] = useState({ material_id: "", quantity: "1", warehouse_id: "" });
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (addMat) {
      supabase.from("materials").select("*").eq("active", true).order("name").then(({ data }) => setAllMaterials(data ?? []));
      supabase.from("warehouses").select("*").eq("active", true).order("name").then(({ data }) => setWarehouses(data ?? []));
    }
  }, [addMat]);

    async function useMaterial(osMaterial: any, qty: number, warehouseId: string, type: "saida" | "devolucao" = "saida", originalMovementId?: string) {
      if (!user) return;
      if (!qty || qty <= 0) return toast.error("Informe a quantidade");
      if (!warehouseId) return toast.error("Selecione o almoxarifado");

      // Validation: Available stock for "saida"
      if (type === "saida") {
        const level = stockLevels.find(l => l.material_id === osMaterial.material_id && l.warehouse_id === warehouseId);
        const available = level ? Number(level.quantity) : 0;
        if (qty > available) {
          return toast.error(`Saldo insuficiente no almoxarifado. Disponível: ${available}`);
        }
      }

      // Validation: Return limit for "devolucao"
      if (type === "devolucao") {
        const maxReturn = Number(osMaterial.quantity_used || 0);
        if (qty > maxReturn) {
          return toast.error(`Quantidade de devolução excede o saldo utilizado na OS. Máximo: ${maxReturn}`);
        }
      }

      setBusy(true);
      try {
        const movementPayload: any = {
          material_id: osMaterial.material_id,
          quantity: qty,
          type: type,
          os_id: id,
          professional_id: user.id,
          created_by: user.id,
          notes: type === "saida" ? `Retirada OS #${os.numero}` : `Devolução OS #${os.numero}`,
          unit_cost: osMaterial.materials?.cost_price || 0,
          total_cost: qty * (osMaterial.materials?.cost_price || 0)
        };
 
        if (type === "saida") {
          movementPayload.from_warehouse_id = warehouseId;
        } else {
          movementPayload.to_warehouse_id = warehouseId;
          movementPayload.parent_movement_id = originalMovementId;
        }
 
        const { error: moveError } = await supabase.from("stock_movements").insert(movementPayload);
        if (moveError) throw moveError;
 
        const newUsedQty = type === "saida" 
          ? (Number(osMaterial.quantity_used) || 0) + qty 
          : (Number(osMaterial.quantity_used) || 0) - qty;
 
        const { error: updateError } = await supabase.from("os_materials")
          .update({ quantity_used: Math.max(0, newUsedQty) })
          .eq("id", osMaterial.id);
        if (updateError) throw updateError;
 
        toast.success(type === "saida" ? "Material retirado com sucesso" : "Devolução registrada com sucesso");
        load();
        loadStockLevels();
      } catch (err: any) {
        toast.error("Erro ao registrar: " + err.message);
      } finally {
        setBusy(false);
      }
    }

   const [consumeDialog, setConsumeDialog] = useState<{ 
     open: boolean; 
     item: any; 
     qty: string; 
     warehouse_id: string;
     type: "saida" | "devolucao";
     originalMovementId?: string;
   }>({
     open: false, item: null, qty: "1", warehouse_id: "", type: "saida"
   });

  async function addMaterialToOS() {
    if (!matForm.material_id || !matForm.quantity) return toast.error("Preencha os campos");
    const mat = allMaterials.find(m => m.id === matForm.material_id);
    const { error } = await supabase.from("os_materials").insert({
      os_id: id,
      material_id: matForm.material_id,
      quantity_planned: parseFloat(matForm.quantity),
      unit_cost: mat?.cost_price || 0
    });
    if (error) return toast.error(error.message);
    setAddMat(false);
    setMatForm({ material_id: "", quantity: "1", warehouse_id: "" });
    toast.success("Material adicionado");
    load();
  }

    const nextPossibleStatuses = (OS_STATUS_FLOW[(os?.operational_status || os?.status || 'pendente').toLowerCase() as OSStatus]?.next || []) as OSStatus[];

   async function handleStatusTransition(newStatus: OSStatus) {
     setBusy(true);
      // If transitioning to 'iniciada', check the gate
      if (newStatus === 'iniciada') {
        const validation = await osService.canStartWorkOrder(os.id, user!.id);
        if (!validation.can_start) {
          toast.error(validation.message);
          return;
        }
      }

      try {
        await osService.updateStatus(os.id, newStatus, user!.id, { comentario: "Mudança manual de status via fluxo operacional" });
        
        // Handle task automation based on status
        if (newStatus === 'aguardando_aprovacao_departamento') {
          await supabase.from("department_tasks").insert({
            os_id: os.id,
            to_department_id: os.department_id,
            task_type: "aprovar_os",
            title: "Aprovação de OS",
            description: "OS aguardando aprovação departamental.",
            created_by: user!.id
          });
        }

        toast.success(`OS movida para: ${OS_STATUS_FLOW[newStatus].label}`);
        load();
      } catch (err: any) {
       toast.error("Erro na transição: " + err.message);
     } finally {
       setBusy(false);
     }
   }

   if (!os) return <div className="text-sm text-muted-foreground">Carregando…</div>;

    return (
      <div className="space-y-6">
        <PageHeader
         title={
           <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono font-black">{os.titulo || `OS ${os.numero}`}</span>
                <StatusBadge status={os.operational_status || os.status} />
              </div>
             <div className="flex items-center gap-2 text-muted-foreground text-xs font-normal">
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold font-mono">
                 PROJETO: {os.obra?.numero || "S/N"}
               </Badge>
               <span className="opacity-50">|</span>
                <span className="font-medium">{os.titulo ? `${os.numero} - ${os.obra?.nome}` : os.obra?.nome}</span>
             </div>
           </div>
         }
         actions={
           <div className="flex items-center gap-2">
             <StatusBadge status={os.operational_status || os.status} />
              {isGestor && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <User className="h-4 w-4" /> Atribuir
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="bg-primary/5 p-8 rounded-t-lg border-b">
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Atribuição de Responsabilidades - OS {os.numero}
                      </DialogTitle>
                      <DialogDescription>
                        Defina quem será responsável por cada etapa da execução e validação desta ordem de serviço.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Profissional Responsável (Executor)
                          </Label>
                          <Select defaultValue={os.profissional_id} onValueChange={(v) => salvarAtribuicao({ profissional_id: v })}>
                            <SelectTrigger className="h-11 border-2 focus:ring-primary">
                              <SelectValue placeholder="Selecione o técnico de campo"/>
                            </SelectTrigger>
                            <SelectContent>
                              {profs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-bold flex items-center gap-2">
                            <ListTodo className="h-4 w-4 text-primary" /> Equipe Executora
                          </Label>
                          <Select defaultValue={os.equipe_id} onValueChange={(v) => salvarAtribuicao({ equipe_id: v })}>
                            <SelectTrigger className="h-11 border-2 focus:ring-primary">
                              <SelectValue placeholder="Selecione a equipe de trabalho"/>
                            </SelectTrigger>
                            <SelectContent>
                              {equipes.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Supervisor de Campo
                          </Label>
                          <Select defaultValue={os.supervisor_id} onValueChange={(v) => salvarAtribuicao({ supervisor_id: v })}>
                            <SelectTrigger className="h-11 border-2 focus:ring-primary">
                              <SelectValue placeholder="Selecione o supervisor responsável"/>
                            </SelectTrigger>
                            <SelectContent>
                              {profs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-bold flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> Gestor Responsável (Setor)
                          </Label>
                          <Select defaultValue={os.gestor_responsavel_id} onValueChange={(v) => salvarAtribuicao({ gestor_responsavel_id: v })}>
                            <SelectTrigger className="h-11 border-2 focus:ring-primary">
                              <SelectValue placeholder="Selecione o gestor da OS"/>
                            </SelectTrigger>
                            <SelectContent>
                              {profs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-bold flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" /> Auditor Responsável
                          </Label>
                          <Select defaultValue={os.auditor_id} onValueChange={(v) => salvarAtribuicao({ auditor_id: v })}>
                            <SelectTrigger className="h-11 border-2 focus:ring-primary">
                              <SelectValue placeholder="Selecione o auditor da OS"/>
                            </SelectTrigger>
                            <SelectContent>
                              {profs.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-6 border-t flex justify-end gap-3 rounded-b-lg">
                      <DialogTrigger asChild>
                        <Button variant="outline">Fechar</Button>
                      </DialogTrigger>
                      <DialogTrigger asChild>
                        <Button className="font-bold">Confirmar Atribuições</Button>
                      </DialogTrigger>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
          </div>
          }
        />

        {os.descricao && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-2">Descrição da OS</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{os.descricao}</p>
            </CardContent>
          </Card>
        )}

       {/* Operational Flow Action Bar */}
        {nextPossibleStatuses.length > 0 && (isGestor || hasRole(['admin', 'supervisor', 'campo'])) && (
         <Card className="p-4 border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-full"><RefreshCw className={cn("h-4 w-4 text-primary", busy && "animate-spin")} /></div>
             <div>
               <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Fluxo Operacional</p>
               <p className="text-[10px] text-muted-foreground">Mova a OS para a próxima etapa do processo</p>
             </div>
           </div>
           <div className="flex flex-wrap gap-2">
             {nextPossibleStatuses.map((status) => (
               <Button 
                 key={status} 
                 size="sm" 
                 disabled={busy}
                 onClick={() => handleStatusTransition(status as OSStatus)}
                 className={cn(
                   "text-[10px] font-bold uppercase",
                   status === 'cancelada' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                 )}
               >
                 {OS_STATUS_FLOW[status as OSStatus].label}
               </Button>
             ))}
           </div>
         </Card>
       )}

      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50 shadow-inner">
        <span><strong>Setor:</strong> <Badge variant="secondary" className="ml-1 text-[9px] h-4">{os.department?.name || "Geral"}</Badge></span>
        <span><strong>Serviço:</strong> {os.servico?.nome || "Geral"}</span>
        <span><strong>Cliente:</strong> {os.obra?.cliente || "Não informado"}</span>
        <span className="col-span-2 md:col-span-1"><strong>Profissional:</strong> {os.profissional?.nome || "Não atribuído"}</span>
        {os.equipe_id && <span className="col-span-2 md:col-span-1"><strong>Equipe:</strong> {equipes.find(e => e.id === os.equipe_id)?.nome || "Carregando..."}</span>}
         <span className="col-span-2 md:col-span-2 italic"><strong>Endereço:</strong> {os.endereco || os.obra?.endereco}, {os.bairro || os.obra?.bairro}, {os.cidade || os.obra?.cidade}/{os.estado || os.obra?.estado}</span>
         {(os.solicitante_nome || os.solicitante_telefone) && (
           <span className="col-span-2 md:col-span-2"><strong>Solicitante:</strong> {os.solicitante_nome} {os.solicitante_telefone ? `(${os.solicitante_telefone})` : ""}</span>
         )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Atividades</div>
          <div className="mt-1 text-2xl font-semibold">{items.length}</div>
        </Card>
        <Card className="rounded-md border-border p-4 shadow-none">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">UMD total</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{Number(os.total_umd ?? 0).toFixed(2)}</div>
        </Card>
         <Card className="rounded-md border-border p-4 shadow-none">
           <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Local</div>
           <div className="mt-1 text-sm flex items-center gap-1.5 truncate">
             <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
             <span className="truncate">{os.cidade || os.obra?.cidade || 'Local não informado'}</span>
           </div>
         </Card>
      </div>


       <Tabs defaultValue="atividades" className="mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="evidencias">Evidências</TabsTrigger>
            <TabsTrigger value="auditoria">Histórico</TabsTrigger>
            <TabsTrigger value="comunicacao">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="atividades" className="mt-4">
             <div className="flex items-end justify-between mb-3">
               <h2 className="text-sm font-medium uppercase text-muted-foreground tracking-wider">Histórico de Lançamentos</h2>
               {canEdit && (
                 <Dialog open={add} onOpenChange={setAdd}>
                   <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4"/>Lançar Atividade</Button></DialogTrigger>
                   <DialogContent className="max-w-xl">
                  <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                      <Plus className="h-32 w-32 text-white" />
                    </div>
                    <div className="relative z-10">
                      <DialogTitle className="text-2xl font-bold">Novo Lançamento Técnico</DialogTitle>
                      <p className="text-primary-foreground/70 text-sm mt-1">Registre a produtividade realizada no campo.</p>
                    </div>
                  </DialogHeader>
                   <div className="p-8 grid gap-6 bg-background">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catálogo de Atividades</Label>
                      <Popover open={activityPopoverOpen} onOpenChange={setActivityPopoverOpen}>
                           <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal h-14 border-2 hover:border-primary/50 transition-all">
                               {form.atividade_id ? (
                                 <div className="flex flex-col">
                                   <span className="font-bold text-primary text-xs">{allAtvs.find(a => a.id === form.atividade_id)?.codigo_item}</span>
                                   <span className="truncate text-sm">{allAtvs.find(a => a.id === form.atividade_id)?.descricao}</span>
                                 </div>
                               ) : (
                                 <span className="text-muted-foreground flex items-center gap-2"><Search className="h-4 w-4" /> Pesquisar no catálogo completo...</span>
                               )}
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-[500px] p-0" align="start">
                             <Command>
                               <div className="p-2 border-b flex gap-2 bg-muted/30">
                                 <Select value={selectedCategoriaId} onValueChange={setSelectedCategoriaId}>
                                   <SelectTrigger className="h-9 text-xs flex-1">
                                     <SelectValue placeholder="Filtrar por Categoria" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all" className="font-semibold text-primary">Todas as Atividades do Serviço</SelectItem>
                                     <SelectItem value="all_global" className="font-semibold text-amber-600 italic">Catálogo Completo (Geral)</SelectItem>
                                     {cats.filter(c => !os.servico_id || selectedCategoriaId === "all_global" || c.servico_id === os.servico_id).map((c) => (
                                       <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                               <CommandInput placeholder="Digite o código ou descrição..." className="h-10" />
                               <CommandList className="max-h-[300px]">
                                 <CommandEmpty>Nenhuma atividade encontrada.</CommandEmpty>
                                 {cats
                                   .filter(cat => {
                                     if (selectedCategoriaId === "all_global") return true;
                                     if (selectedCategoriaId === "all") return !os.servico_id || cat.servico_id === os.servico_id;
                                     return cat.id === selectedCategoriaId;
                                   })
                                   .sort((a, b) => a.nome.localeCompare(b.nome))
                                   .map(cat => {
                                     const catAtividades = allAtvs.filter(a => a.categoria_id === cat.id);
                                     if (catAtividades.length === 0) return null;
                                     return (
                                       <CommandGroup key={cat.id} heading={cat.nome}>
                                         {catAtividades.map((a) => (
                                           <CommandItem
                                             key={a.id}
                                             value={`${a.codigo_item} ${a.descricao} ${cat.nome}`}
                                             onSelect={() => {
                                               setForm({...form, atividade_id: a.id, categoria_id: a.categoria_id});
                                               setActivityPopoverOpen(false);
                                             }}
                                             className="cursor-pointer"
                                           >
                                             <div className="flex flex-col w-full py-1">
                                               <div className="flex justify-between items-center mb-0.5">
                                                 <span className="font-mono text-xs font-bold text-primary">{a.codigo_item}</span>
                                                 <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-medium">{a.unidade}</span>
                                               </div>
                                               <span className="text-sm line-clamp-2 leading-tight">{a.descricao}</span>
                                             </div>
                                           </CommandItem>
                                         ))}
                                       </CommandGroup>
                                     );
                                   })}
                               </CommandList>
                             </Command>
                           </PopoverContent>
                         </Popover>
                       </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código Técnico</Label>
                            <Select value={form.execution_code_id} onValueChange={(v)=>setForm({...form, execution_code_id: v})}>
                              <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Opcional"/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {codes.map((c)=>(<SelectItem key={c.id} value={c.id}>{c.code} · {c.title}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantidade ({ativSel?.unidade || "—"})</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              value={form.quantidade} 
                              onChange={(e)=>setForm({...form, quantidade: e.target.value})}
                              className="h-12 text-lg font-bold border-2 focus-visible:ring-primary"
                            />
                          </div>
                        </div>

                       <div className="p-3 bg-muted/20 rounded-md border border-dashed flex justify-between items-center">
                         <span className="text-xs text-muted-foreground uppercase font-bold">Produtividade Estimada</span>
                         <span className="text-lg font-mono font-bold text-primary">{umdTotal.toFixed(4)} <span className="text-xs font-normal">UMD</span></span>
                       </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</Label>
                          <Textarea 
                            placeholder="Detalhes adicionais sobre este lançamento..."
                            value={form.observacao} 
                            onChange={(e)=>setForm({...form, observacao: e.target.value})}
                            className="min-h-[100px] border-2 resize-none"
                          />
                        </div>
                        
                        <div className="flex gap-3 border-t pt-4">
                          <Button 
                            variant="outline"
                            className="flex-1 h-12 font-bold uppercase tracking-wider" 
                            onClick={() => setAdd(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            className="flex-[2] h-12 font-bold text-base uppercase tracking-wider shadow-lg shadow-primary/20" 
                            onClick={() => addItem()} 
                            disabled={!form.atividade_id || !form.quantidade || busy}
                          >
                            {busy ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                            {busy ? "Lançando..." : "Confirmar Lançamento"}
                          </Button>
                        </div>
                      </div>
                   </DialogContent>
                 </Dialog>
               )}
             </div>
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Atividade</th><th className="px-3 py-2 text-right">Qtd</th><th className="px-3 py-2">Un</th><th className="px-3 py-2 text-right">UMD</th><th className="px-3 py-2"/></tr>
                  </thead>
                  <tbody>
                    {items.map((i)=>(
                      <tr key={i.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-mono text-xs">{i.atividade?.codigo_item}</td>
                        <td className="px-3 py-2">{i.atividade?.descricao}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(i.quantidade).toFixed(2)}</td>
                        <td className="px-3 py-2">{i.unidade}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(i.umd_total).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          {canEdit && <Button variant="ghost" size="icon" onClick={()=>removeItem(i.id)}><Trash2 className="h-3.5 w-3.5"/></Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

           <TabsContent value="materiais" className="mt-4 space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="text-sm font-semibold">Materiais Utilizados / Previstos</h3>
               {canEdit && (
                 <Dialog open={addMat} onOpenChange={setAddMat}>
                   <DialogTrigger asChild><Button size="sm"><Package className="mr-2 h-4 w-4" /> Adicionar Material</Button></DialogTrigger>
                   <DialogContent>
                     <DialogHeader><DialogTitle>Adicionar Material à OS</DialogTitle></DialogHeader>
                     <div className="space-y-4 py-4">
                       <div className="space-y-2">
                         <Label>Material</Label>
                         <Select value={matForm.material_id} onValueChange={v => setMatForm({...matForm, material_id: v})}>
                           <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                           <SelectContent>
                             {allMaterials.map(m => (
                               <SelectItem key={m.id} value={m.id}>{m.code} - {m.name} ({m.unit})</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label>Quantidade Planejada</Label>
                         <Input type="number" step="0.01" value={matForm.quantity} onChange={e => setMatForm({...matForm, quantity: e.target.value})} />
                       </div>
                       <Button className="w-full" onClick={addMaterialToOS}>Adicionar</Button>
                     </div>
                   </DialogContent>
                 </Dialog>
               )}
             </div>
 
             <Card className="overflow-hidden border-border shadow-none">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b bg-muted/50 text-muted-foreground">
                     <th className="px-4 py-3 text-left">Cód.</th>
                     <th className="px-4 py-3 text-left">Material</th>
                     <th className="px-4 py-3 text-right">Qtd. Prevista</th>
                     <th className="px-4 py-3 text-right">Qtd. Usada</th>
                     <th className="px-4 py-3 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody>
                   {osMaterials.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum material vinculado.</td></tr>
                   ) : (
                     osMaterials.map(m => (
                       <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                         <td className="px-4 py-3 font-mono text-xs">{m.materials?.code}</td>
                         <td className="px-4 py-3">{m.materials?.name}</td>
                         <td className="px-4 py-3 text-right font-medium">{m.quantity_planned} {m.materials?.unit}</td>
                         <td className="px-4 py-3 text-right">
                           {m.quantity_used > 0 ? (
                             <Badge variant="secondary">{m.quantity_used} {m.materials?.unit}</Badge>
                           ) : (
                             <span className="text-muted-foreground">-</span>
                           )}
                         </td>
                       <td className="px-4 py-3 text-right flex justify-end gap-2">
                         <div className="flex flex-col gap-1">
                           <Button size="sm" variant="outline" onClick={() => setConsumeDialog({ open: true, item: m, qty: Math.max(0, m.quantity_planned - m.quantity_used).toString(), warehouse_id: "", type: "saida" })}>
                             Retirar
                           </Button>
                           {m.quantity_used > 0 && (
                             <Button size="sm" variant="ghost" className="h-7 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => setConsumeDialog({ open: true, item: m, qty: m.quantity_used.toString(), warehouse_id: "", type: "devolucao" })}>
                               Devolver
                             </Button>
                           )}
                         </div>
                         {canEdit && <Button size="icon" variant="ghost" className="mt-1" onClick={() => removeMaterial(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                       </td>
         <Dialog open={consumeDialog.open} onOpenChange={open => setConsumeDialog(prev => ({ ...prev, open }))}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{consumeDialog.type === "saida" ? "Retirar Material" : "Devolver Material"}</DialogTitle>
               <DialogDescription>
                 {consumeDialog.type === "saida" 
                   ? "Registre a saída do material para uso nesta OS." 
                   : "Registre a devolução de material não utilizado para o estoque."}
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="p-3 bg-muted rounded-md space-y-1">
                 <p className="text-xs font-bold uppercase text-muted-foreground">Material</p>
                 <p className="text-sm font-medium">{consumeDialog.item?.materials?.name}</p>
               </div>
               <div className="space-y-2">
                 <Label>{consumeDialog.type === "saida" ? "Almoxarifado de Origem" : "Almoxarifado de Destino"}</Label>
                 <Select value={consumeDialog.warehouse_id} onValueChange={v => setConsumeDialog({...consumeDialog, warehouse_id: v, type: consumeDialog.type})}>
                   <SelectTrigger><SelectValue placeholder="Selecione o almoxarifado..." /></SelectTrigger>
                   <SelectContent>
                     {warehouses.map(w => (
                       <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Quantidade {consumeDialog.type === "saida" ? "Retirada" : "Devolvida"}</Label>
                 <Input type="number" step="0.01" value={consumeDialog.qty} onChange={e => setConsumeDialog({...consumeDialog, qty: e.target.value, type: consumeDialog.type})} />
               </div>
               <Button className="w-full" onClick={() => {
                 if (!consumeDialog.warehouse_id) return toast.error("Selecione o almoxarifado");
                 useMaterial(consumeDialog.item, parseFloat(consumeDialog.qty), consumeDialog.warehouse_id, consumeDialog.type);
                 setConsumeDialog(prev => ({ ...prev, open: false }));
               }}>
                 {consumeDialog.type === "saida" ? "Confirmar Retirada" : "Confirmar Devolução"}
               </Button>
             </div>
           </DialogContent>
         </Dialog>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </Card>
           </TabsContent>

           <TabsContent value="comunicacao" className="mt-4">
            <Card className="p-4 border-none shadow-none bg-muted/20 h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground mt-10">Inicie uma conversa operacional sobre esta OS.</div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={cn("max-w-[80%] rounded-lg p-2 text-xs shadow-sm", m.sender_id === user?.id ? "bg-primary text-primary-foreground ml-auto" : "bg-card border border-border mr-auto")}>
                      <div className="font-bold mb-0.5">{m.sender?.nome || "Usuário"}</div>
                      <div>{m.content}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Mensagem para supervisor/gestor..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="text-xs h-9 bg-background" />
                <Button size="sm" onClick={sendMessage}><Send className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="evidencias" className="mt-4">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Evidências do Campo</h2>
                <span className="text-[10px] text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-full">{evid.length} arquivos</span>
              </div>
              
              {canEdit && !mediaUpload.previewUrl && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm active:scale-95">
                    <Camera className="h-5 w-5" strokeWidth={2}/> Tirar Foto
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                  </label>
                  
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-sm active:scale-95">
                    <Video className="h-5 w-5" strokeWidth={2}/> Gravar Vídeo
                    <input type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                  </label>

                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm active:scale-95 sm:flex-none">
                    <Plus className="h-5 w-5" strokeWidth={2}/> Arquivo
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                </div>
              )}

              {mediaUpload.previewUrl && (
                <Card className="p-4 border-primary/20 bg-primary/5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative h-40 w-full sm:w-40 bg-black rounded-md overflow-hidden shrink-0">
                      {mediaUpload.file?.type.startsWith('video/') ? (
                        <video src={mediaUpload.previewUrl} className="h-full w-full object-contain" controls />
                      ) : (
                        <img src={mediaUpload.previewUrl} className="h-full w-full object-contain" alt="Preview" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold truncate max-w-[200px]">{mediaUpload.file?.name}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMediaUpload({ file: null, previewUrl: null, uploading: false, error: null })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase">{mediaUpload.file?.type} · {(mediaUpload.file!.size / 1024 / 1024).toFixed(2)} MB</p>
                        {mediaUpload.error && (
                          <div className="mt-2 p-2 rounded bg-destructive/10 text-[11px] text-destructive flex items-center gap-1.5 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> {mediaUpload.error}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 sm:mt-0">
                        <Button 
                          className="flex-1 sm:flex-none font-bold" 
                          onClick={executeUpload} 
                          disabled={mediaUpload.uploading}
                        >
                          {mediaUpload.uploading ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                          ) : mediaUpload.error ? (
                            <><RefreshCw className="mr-2 h-4 w-4" /> Retentar Upload</>
                          ) : (
                            <><CheckCircle className="mr-2 h-4 w-4" /> Confirmar e Enviar</>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 sm:flex-none" 
                          onClick={() => setMediaUpload({ file: null, previewUrl: null, uploading: false, error: null })}
                          disabled={mediaUpload.uploading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

           <div className="space-y-4">
             <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
               <Eye className="h-3 w-3" /> Galeria de Evidências
             </h3>
             {evid.length === 0 ? (
               <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground bg-muted/10">
                 <div className="flex flex-col items-center gap-2">
                   <Camera className="h-8 w-8 opacity-20" />
                   <p>Nenhuma evidência capturada para esta OS.</p>
                 </div>
               </div>
             ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
                   {evid.map((e)=>(<EvImg key={e.id} ev={e} onDelete={deleteEvidence} />))}
                </div>
             )}
           </div>
          </TabsContent>

         <TabsContent value="auditoria" className="mt-4">
           <div className="space-y-4">
             {auditLogs.length === 0 ? (
               <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem histórico de auditoria.</div>
             ) : (
               <div className="relative pl-6 border-l border-border space-y-6">
                 {auditLogs.map((log) => (
                   <div key={log.id} className="relative">
                     <div className="absolute -left-[31px] bg-card border border-border rounded-full p-1">
                       {log.status_novo === 'aprovada' ? <CheckCircle className="h-4 w-4 text-success" /> : 
                        log.status_novo === 'reprovada' ? <XCircle className="h-4 w-4 text-destructive" /> : 
                        <History className="h-4 w-4 text-muted-foreground" />}
                     </div>
                     <div className="bg-muted/30 rounded-lg p-3">
                       <div className="flex justify-between items-start mb-1">
                         <div className="text-xs font-semibold">
                           {log.profile?.nome} alterou para <StatusBadge status={log.status_novo} />
                         </div>
                         <div className="text-[10px] text-muted-foreground">
                           {new Date(log.created_at).toLocaleString('pt-BR')}
                         </div>
                       </div>
                       {log.comentario && <p className="text-sm text-muted-foreground mt-2 italic">"{log.comentario}"</p>}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </TabsContent>
       </Tabs>

      {/* Ações de fluxo */}
       <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
          {/* Gate check message */}
          {startValidation && !startValidation.can_start && (os.operational_status || os.status)?.toLowerCase() === "pronta_para_execucao" && (
            <div className="w-full p-4 rounded-lg border-2 border-amber-500 bg-amber-50 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-800 text-sm">Trabalho Bloqueado</p>
                <p className="text-amber-700 text-xs">{startValidation.message}</p>
              </div>
            </div>
          )}

          {canEdit && (os.operational_status || os.status)?.toLowerCase() === "em_execucao" && (
            <Button size="lg" className="h-14 sm:h-10 text-base font-bold shadow-lg shadow-primary/20" onClick={finalizar} disabled={busy}>
              {busy ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              {busy ? "Finalizando..." : "Finalizar e enviar para revisão"}
            </Button>
          )}

          {os.operational_status === "em_deslocamento" && isOwner && (
            <Button size="lg" variant="outline" className="h-14 sm:h-10 text-base" onClick={async () => {
              const geo = await getGeo();
              await supabase.from("ordens_servico").update({ 
                operational_status: "chegou_ao_local",
                status: "em_andamento",
                inicio_atendimento: new Date().toISOString()
              }).eq("id", id);
              toast.success("Atendimento iniciado");
              load();
            }}>
              Registrar Chegada ao Local
            </Button>
          )}

          {isGestor && (
            <Button size="lg" variant="outline" className="h-14 sm:h-10 text-base" onClick={async () => {
              const newValue = !os.arquivada;
              await supabase.from("ordens_servico").update({ arquivada: newValue }).eq("id", id);
              toast.success(newValue ? "OS Arquivada" : "OS Reativada");
              load();
            }}>
              {os.arquivada ? <RefreshCw className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
              {os.arquivada ? "Reativar OS" : "Arquivar OS"}
            </Button>
          )}
         {canApprove && ["aguardando_revisao", "corrigida", "em_revisao"].includes(os.status) && (
           <div className="flex flex-wrap gap-2">
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <span>
              <Button size="sm" onClick={aprovar} disabled={!evCheck.ok || busy} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                {busy ? "Processando..." : "Aprovar OS"}
                     </Button>
                   </span>
                 </TooltipTrigger>
                 {!evCheck.ok && (
                   <TooltipContent>
                     <div className="text-xs max-w-xs">
                       <strong>Pendências de evidência:</strong>
                       <ul className="list-disc pl-4 mt-1">
                         {evCheck.missing.map((m, i) => <li key={i}>{m}</li>)}
                       </ul>
                     </div>
                   </TooltipContent>
                 )}
               </Tooltip>
             </TooltipProvider>
              <Button size="sm" variant="outline" onClick={() => setReviewDialog({ open: true, type: 'correcao', comment: '' })} className="gap-1.5" disabled={busy}>
               <History className="h-3.5 w-3.5" /> Solicitar Correção
             </Button>
              <Button size="sm" variant="destructive" onClick={() => setReviewDialog({ open: true, type: 'reprovar', comment: '' })} className="gap-1.5" disabled={busy}>
               <XCircle className="h-3.5 w-3.5" /> Reprovar
             </Button>
             <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => {
               if(confirm("Enviar esta OS para o departamento de Medição?")) {
                 registrarAuditoria(os.status, "OS enviada para medição");
                 toast.success("OS encaminhada para medição");
               }
             }}>
               <Filter className="h-3.5 w-3.5" /> Enviar para Medição
             </Button>
           </div>
         )}
        <Button variant="ghost" onClick={()=>nav(-1)}>Voltar</Button>
      </div>

      {os.motivo_reprovacao && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <strong>Reprovada:</strong> {os.motivo_reprovacao}
        </div>
      )}
      {os.observacao_supervisor && os.status === "correcao_solicitada" && (
        <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
          <strong>Correção solicitada:</strong> {os.observacao_supervisor}
        </div>
      )}

      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{reviewDialog.type === 'reprovar' ? 'Reprovar Ordem de Serviço' : 'Solicitar Correção'}</DialogTitle>
            <DialogDescription>
              {reviewDialog.type === 'reprovar' 
                ? 'A OS será marcada como reprovada. O motivo é obrigatório.' 
                : 'Informe o que precisa ser ajustado pelo profissional.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comentário / Motivo</Label>
              <Textarea 
                placeholder="Escreva aqui..." 
                value={reviewDialog.comment} 
                onChange={(e) => setReviewDialog(prev => ({ ...prev, comment: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReviewDialog(prev => ({ ...prev, open: false }))}>Cancelar</Button>
              <Button 
                variant={reviewDialog.type === 'reprovar' ? 'destructive' : 'default'}
                onClick={handleReview}
                disabled={busy || (reviewDialog.type === 'reprovar' && !reviewDialog.comment.trim())}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    function EvImg({ ev, onDelete }: { ev: any, onDelete: (ev: any) => void }) {
      const [url, setUrl] = useState<string>("");
      const [showDetails, setShowDetails] = useState(false);
      const { user, hasRole } = useAuth();
      
      useEffect(() => {
        supabase.storage.from("os-evidences").createSignedUrl(ev.url, 3600).then(({ data }) => setUrl(data?.signedUrl ?? ""));
      }, [ev.url]);
      
      const isVideo = ev.tipo === "video";
      const metadata = ev.metadata || {};
      const canDelete = user?.id === ev.user_id || hasRole(['admin', 'gestor']);
     
     return (
       <>
         <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
           {url ? (
             isVideo ? (
               <video src={url} className="h-full w-full object-cover" />
             ) : (
               <img src={url} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
             )
           ) : null}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
             <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white rounded-full" onClick={() => setShowDetails(true)} title="Informações">
               <Info className="h-4 w-4" />
             </Button>
             <a href={url} target="_blank" rel="noreferrer" className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white" title="Download">
               <Download className="h-4 w-4" />
             </a>
             {canDelete && (
               <Button variant="ghost" size="icon" className="h-8 w-8 bg-destructive/20 hover:bg-destructive/60 text-white rounded-full" onClick={() => onDelete(ev)} title="Excluir">
                 <Trash2 className="h-4 w-4" />
               </Button>
             )}
           </div>
           <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
             <div className="text-[9px] text-white truncate font-medium">{ev.profile?.nome}</div>
             <div className="text-[8px] text-white/70">{new Date(ev.created_at).toLocaleDateString()}</div>
           </div>
         </div>

         <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b">
              <DialogTitle>Detalhes da Evidência</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               <div className="aspect-video bg-black rounded-lg overflow-hidden">
                 {isVideo ? (
                   <video src={url} controls className="h-full w-full object-contain" />
                 ) : (
                   <img src={url} alt="Evidência" className="h-full w-full object-contain" />
                 )}
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Autor</p>
                   <p className="font-medium">{ev.profile?.nome}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Data de Envio</p>
                   <p className="font-medium">{new Date(ev.created_at).toLocaleString('pt-BR')}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Data de Captura</p>
                   <p className="font-medium">{metadata.captured_at ? new Date(metadata.captured_at).toLocaleString('pt-BR') : 'Não registrada'}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Tipo</p>
                   <p className="font-medium uppercase">{metadata.type || ev.tipo}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Tamanho</p>
                   <p className="font-medium">{metadata.size ? (metadata.size / 1024 / 1024).toFixed(2) + ' MB' : 'Desconhecido'}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground uppercase font-bold">Nome Original</p>
                   <p className="font-medium truncate" title={metadata.name}>{metadata.name || 'Sem nome'}</p>
                 </div>
               </div>
               {ev.localizacao?.lat && (
                 <div className="pt-2">
                   <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                     <a href={`https://maps.google.com/?q=${ev.localizacao.lat},${ev.localizacao.lng}`} target="_blank" rel="noreferrer">
                       <MapPin className="h-4 w-4" /> Ver localização no mapa
                     </a>
                   </Button>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
       </>
     );
   }