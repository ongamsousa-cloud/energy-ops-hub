import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const nav = useNavigate();
  const { user, mockSignIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
   const [loading, setLoading] = useState(false);
 
   const testAccounts = [
     { role: "Admin", email: "admin@teste.com", desc: "Acesso total" },
     { role: "Gestor", email: "gestor@teste.com", desc: "Operacional" },
     { role: "Supervisor", email: "supervisor@teste.com", desc: "Campo/Revisão" },
     { role: "Campo", email: "campo@teste.com", desc: "Lançamentos" },
     { role: "Financeiro", email: "financeiro@teste.com", desc: "Medição/UMD" },
     { role: "Auditor", email: "auditor@teste.com", desc: "Qualidade" },
   ];
 
   const quickLogin = async (email: string) => {
     setLoading(true);
     try {
       await mockSignIn(email);
       toast.success("Acesso de teste liberado");
       nav("/app");
     } catch (e: any) {
       toast.error(e.message ?? "Erro ao autenticar");
     } finally { setLoading(false); }
   };

  useEffect(() => { if (user) nav("/app", { replace: true }); }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo");
        nav("/app");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu email para confirmar.");
        setMode("login");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao autenticar");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm bg-primary" />
          <div>
            <div className="text-sm font-medium tracking-tight">Energia · Operações</div>
            <div className="text-[11px] text-muted-foreground">Gestão de serviços elétricos</div>
          </div>
        </div>
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          {mode === "login" ? "Acessar plataforma" : "Criar conta"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "login" ? "Use suas credenciais corporativas." : "Defina suas credenciais de acesso."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e)=>setNome(e.target.value)} required />
            </div>
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
        </form>
         <div className="mt-8 pt-6 border-t border-border">
           <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Contas de Teste</div>
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
 
         <button
           onClick={() => setMode(mode === "login" ? "signup" : "login")}
           className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
         >
           {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
         </button>
      </div>
    </div>
  );
}