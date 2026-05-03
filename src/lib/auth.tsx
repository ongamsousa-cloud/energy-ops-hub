import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gestor" | "supervisor" | "campo" | "financeiro" | "auditor";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: { id: string; nome: string; email: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (r: AppRole | AppRole[]) => boolean;
  mockSignIn: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthCtx["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const mockUser = localStorage.getItem("lovable_mock_user");
    if (mockUser) {
      const data = JSON.parse(mockUser);
      setUser(data.user);
      setIsMock(true);
      loadUserData(data.user.id);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadUserData(s.user.id), 0);
      } else {
        setRoles([]);
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadUserData(data.session.user.id);
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadUserData(uid: string) {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("id,nome,email").eq("id", uid).maybeSingle(),
    ]);
    setRoles((r ?? []).map((x: any) => x.role as AppRole));
    setProfile(p as any);
    setLoading(false);
  }

  const hasRole = (r: AppRole | AppRole[]) => {
    const arr = Array.isArray(r) ? r : [r];
    return roles.some((x) => arr.includes(x));
  };

  const signOut = async () => {
    if (isMock) {
      localStorage.removeItem("lovable_mock_user");
      setUser(null);
      setSession(null);
      setRoles([]);
      setProfile(null);
      setIsMock(false);
    } else {
      await supabase.auth.signOut();
    }
  };

   const mockSignIn = async (email: string) => {
     setLoading(true);
     try {
       // Tentar login real primeiro com a senha padrão de teste
       const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
         email,
         password: "Energia123!",
       });
 
       if (authError) {
         // Se falhar o login real (ex: usuário não existe no Auth), tenta o mock local
         const { data, error } = await supabase.from("profiles").select("id, nome").eq("email", email).single();
         if (error || !data) throw new Error("Usuário não encontrado no banco de dados.");
 
         const mockData = {
           user: { id: data.id, email, user_metadata: { nome: data.nome } } as any,
         };
         localStorage.setItem("lovable_mock_user", JSON.stringify(mockData));
         setUser(mockData.user);
         setIsMock(true);
         await loadUserData(data.id);
       } else {
         // Login real funcionou
         setUser(authData.user);
         setIsMock(false);
         localStorage.removeItem("lovable_mock_user");
         await loadUserData(authData.user.id);
       }
     } catch (e: any) {
       console.error(e);
       throw e;
     } finally {
       setLoading(false);
     }
   };

  return (
    <Ctx.Provider value={{ user, session, roles, profile, loading, signOut, hasRole, mockSignIn }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  gestor: "Gestor Operacional",
  supervisor: "Supervisor",
  campo: "Profissional de Campo",
  financeiro: "Financeiro / Medição",
  auditor: "Auditor",
};