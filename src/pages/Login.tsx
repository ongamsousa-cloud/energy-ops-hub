 import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
 import { developerService } from "@/services/developerService";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import InstallAppButton from "@/components/InstallAppButton";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const { user, mockSignIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [nome, setNome] = useState("");
   const [selectedRole, setSelectedRole] = useState("campo");
    const [loading, setLoading] = useState(false);
    const [mfaOpen, setMfaOpen] = useState(false);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaLoading, setMfaLoading] = useState(false);
   const [forgotOpen, setForgotOpen] = useState(false);
   const [forgotEmail, setForgotEmail] = useState("");
   const [forgotLoading, setForgotLoading] = useState(false);
   const [logoUrl, setLogoUrl] = useState("https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/ad8ea817-6d17-4c76-b864-22b9b9c2e855/1778513213662_19zkbg_logo__1_.png");
 
   const fetchLogo = useCallback(async () => {
     try {
       const url = await developerService.getLogo();
       setLogoUrl(url);
     } catch (e) {
       console.error("Erro ao carregar logo no Login:", e);
     }
   }, []);
 
   useEffect(() => {
     fetchLogo();
   }, [fetchLogo]);
 
    const testAccounts = [
      { role: "Administrador", email: "admin@teste.com", desc: "Visão 360º" },
      { role: "Gestor", email: "gestor@teste.com", desc: "Operacional" },
      { role: "Supervisor", email: "supervisor@teste.com", desc: "Campo/Revisão" },
      { role: "Técnico", email: "campo@teste.com", desc: "Lançamentos" },
      { role: "Financeiro", email: "financeiro@teste.com", desc: "Medição/UMD" },
      { role: "Auditor", email: "auditor@teste.com", desc: "Qualidade" },
    ];
 
   async function handleMfaVerification(challengeId: string) {
     setMfaLoading(true);
     try {
       const { error } = await supabase.auth.mfa.verify({
         factorId: mfaFactorId!,
         challengeId,
         code: mfaCode,
       });
       if (error) throw error;

       toast.success("Verificação concluída");
       setMfaOpen(false);
       nav(email === "estoque@energyops.demo" ? "/estoque-app" : "/app");
     } catch (e: any) {
       toast.error("Código inválido. Verifique o seu aplicativo autenticador.");
     } finally {
       setMfaLoading(false);
     }
   }

   async function checkMfa() {
     const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
     if (error) throw error;

     if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
       const factors = await supabase.auth.mfa.listFactors();
       if (factors.error) throw factors.error;

       const factor = factors.data.all.find(f => f.status === "verified");
       if (factor) {
         setMfaFactorId(factor.id);
         const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
         if (challenge.error) throw challenge.error;

         setMfaOpen(true);
         return challenge.data.id;
       }
     }
     return null;
   }

   const quickLogin = async (targetEmail: string) => {
     setLoading(true);
     try {
       await mockSignIn(targetEmail);
       toast.success("Acesso de teste liberado");
       nav(targetEmail === "estoque@energyops.demo" ? "/estoque-app" : "/app");
     } catch (e: any) {
       toast.error(e.message ?? "Erro ao autenticar");
     } finally { setLoading(false); }
   };

   const sendReset = async () => {
     if (!forgotEmail) return toast.error("Informe seu email.");
     setForgotLoading(true);
     try {
       const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
         redirectTo: `${window.location.origin}/reset-password`,
       });
       if (error) throw error;
       toast.success("Enviamos um link de recuperação para seu email.");
       setForgotOpen(false);
       setForgotEmail("");
     } catch (e: any) {
       toast.error(e.message ?? "Erro ao enviar email.");
     } finally { setForgotLoading(false); }
   };

   useEffect(() => { 
     if (user) {
       const isEstoque = user.email === "estoque@energyops.demo";
       nav(isEstoque ? "/estoque-app" : "/app", { replace: true });
     }
   }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const mfaChallengeId = await checkMfa();
        if (!mfaChallengeId) {
          toast.success("Bem-vindo");
          nav(email === "estoque@energyops.demo" ? "/estoque-app" : "/app");
        }
      } else {
         const { error } = await supabase.auth.signUp({
           email, password,
           options: {
             emailRedirectTo: window.location.origin,
             data: { 
               nome,
               role: selectedRole
             },
           },
         });
        if (error) throw error;
         toast.success("Cadastro enviado! Aguarde a aprovação do administrador para acessar o sistema.");
         setMode("login");
         setEmail("");
         setPassword("");
         setNome("");
         setSelectedRole("campo");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao autenticar");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-[10px]">
      <div className="w-full max-w-sm">
         <div className="mb-8 flex flex-col items-center gap-5 text-center">
           <div className="p-4 rounded-2xl bg-card shadow-sm border border-border/50">
             <img src={logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
           </div>
           <div className="space-y-1.5">
            <div className="text-lg font-bold tracking-tight">Energia · Operações</div>
            <div className="text-xs text-muted-foreground">Sistema de Gestão de Ordens de Serviço</div>
          </div>
        </div>
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          {mode === "login" ? "Acessar plataforma" : "Criar conta"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "login" ? "Use suas credenciais corporativas." : "Defina suas credenciais de acesso."}
        </p>
         <form onSubmit={submit} className="space-y-4">
            <div className="rounded-md bg-blue-50 p-2.5 text-[10px] text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 space-y-1">
              <div>Dica: Para todas as contas (incluindo Almoxarifado), a senha é <span className="font-bold">Energy@2026!Ops</span></div>
              <div className="opacity-70 font-medium">Conta Estoque: estoque@energyops.demo</div>
            </div>
           {mode === "signup" && (
             <>
               <div className="space-y-1.5">
                 <Label htmlFor="nome">Nome completo</Label>
                 <Input id="nome" value={nome} onChange={(e)=>setNome(e.target.value)} required />
               </div>
               <div className="space-y-1.5">
                 <Label>Função / Perfil</Label>
                 <Select value={selectedRole} onValueChange={setSelectedRole}>
                   <SelectTrigger>
                     <SelectValue placeholder="Selecione uma função" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="admin">Administrador</SelectItem>
                     <SelectItem value="gestor">Gestor</SelectItem>
                     <SelectItem value="supervisor">Supervisor</SelectItem>
                     <SelectItem value="campo">Técnico de Campo</SelectItem>
                     <SelectItem value="financeiro">Financeiro</SelectItem>
                     <SelectItem value="auditor">Auditor</SelectItem>
                   </SelectContent>
                 </Select>
                 <p className="text-[10px] text-muted-foreground">O perfil selecionado definirá seus acessos iniciais.</p>
               </div>
             </>
           )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete={mode==="login"?"current-password":"new-password"} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
          {mode === "login" && (
            <button type="button" onClick={() => setForgotOpen(true)} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">
              Esqueci minha senha
            </button>
          )}
        </form>
          <div className="mt-8 pt-6 border-t border-border space-y-4">
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Portal Especializado</div>
              <button
                onClick={() => quickLogin("estoque@energyops.demo")}
                className="flex w-full items-center justify-between rounded-md bg-orange-600 p-3 text-white shadow-sm transition-all hover:bg-orange-700 active:scale-[0.98]"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-bold">Estoque · Almoxarifado</span>
                  <span className="text-[10px] opacity-90">Acesso direto ao centro de logística</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </button>
            </div>

            <div>
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Painéis Operacionais</div>
              <div className="grid grid-cols-2 gap-2">
                {testAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => quickLogin(acc.email)}
                    className="flex flex-col items-start rounded-md border border-border p-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="text-[11px] font-semibold">{acc.role}</span>
                    <span className="text-[9px] text-muted-foreground">{acc.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
 
         <button
           onClick={() => setMode(mode === "login" ? "signup" : "login")}
           className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
         >
           {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
         </button>

        <div className="mt-6 flex justify-center">
          <InstallAppButton />
        </div>

        <Dialog open={mfaOpen} onOpenChange={setMfaOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verificação em Duas Etapas
              </DialogTitle>
              <DialogDescription>
                Sua conta possui 2FA ativado. Digite o código gerado pelo seu aplicativo autenticador.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                maxLength={6}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                className="w-full h-11" 
                onClick={async () => {
                  const factors = await supabase.auth.mfa.listFactors();
                  const factor = factors.data?.all.find(f => f.id === mfaFactorId);
                  if (factor) {
                    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
                    if (!challenge.error) handleMfaVerification(challenge.data.id);
                  }
                }} 
                disabled={mfaLoading || mfaCode.length !== 6}
              >
                {mfaLoading ? "Verificando..." : "Confirmar Código"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recuperar senha</DialogTitle>
              <DialogDescription>Enviaremos um link para você redefinir sua senha.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setForgotOpen(false)}>Cancelar</Button>
              <Button onClick={sendReset} disabled={forgotLoading}>{forgotLoading ? "Enviando…" : "Enviar link"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}