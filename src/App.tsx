import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Categorias from "./pages/Categorias";
import Atividades from "./pages/Atividades";
import AtividadesImport from "./pages/AtividadesImport";
import Equipes from "./pages/Equipes";
import Profissionais from "./pages/Profissionais";
import OSList from "./pages/OSList";
import OSNova from "./pages/OSNova";
import OSDetalhe from "./pages/OSDetalhe";
import Aprovacoes from "./pages/Aprovacoes";
import Relatorios from "./pages/Relatorios";
 import Medicao from "./pages/Medicao";
 import FinanceiroOrdens from "./pages/FinanceiroOrdens";
 import FinanceiroMateriais from "./pages/FinanceiroMateriais";
 import MateriaisEstoque from "./pages/MateriaisEstoque";
 import Estoque from "./pages/Estoque";
import Mensagens from "./pages/Mensagens";
import AprovacoesUsuarios from "./pages/AprovacoesUsuarios";
import NotFound from "./pages/NotFound";
import Configuracoes from "./pages/Configuracoes";
import { useAppTheme } from "./hooks/useAppTheme";

const queryClient = new QueryClient();

const ThemeBoot = () => {
  useAppTheme();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeBoot />
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="obras" element={<ProtectedRoute roles={["admin","gestor","supervisor","financeiro","auditor"]}><Obras /></ProtectedRoute>} />
              <Route path="obras/:id" element={<ObraDetalhe />} />
              <Route path="categorias" element={<ProtectedRoute roles={["admin","gestor"]}><Categorias /></ProtectedRoute>} />
              <Route path="atividades" element={<ProtectedRoute roles={["admin","gestor"]}><Atividades /></ProtectedRoute>} />
              <Route path="atividades/importar" element={<ProtectedRoute roles={["admin","gestor"]}><AtividadesImport /></ProtectedRoute>} />
              <Route path="equipes" element={<ProtectedRoute roles={["admin","gestor","supervisor"]}><Equipes /></ProtectedRoute>} />
              <Route path="profissionais" element={<ProtectedRoute roles={["admin","gestor"]}><Profissionais /></ProtectedRoute>} />
              <Route path="usuarios/aprovacoes" element={<ProtectedRoute roles={["admin"]}><AprovacoesUsuarios /></ProtectedRoute>} />
              <Route path="os" element={<OSList />} />
              <Route path="os/nova" element={<OSNova />} />
              <Route path="os/:id" element={<OSDetalhe />} />
              <Route path="aprovacoes" element={<ProtectedRoute roles={["admin","gestor","supervisor"]}><Aprovacoes /></ProtectedRoute>} />
              <Route path="relatorios" element={<ProtectedRoute roles={["admin","gestor","financeiro","auditor"]}><Relatorios /></ProtectedRoute>} />
              <Route path="medicao" element={<ProtectedRoute roles={["admin","gestor","financeiro"]}><Medicao /></ProtectedRoute>} />
              <Route path="financeiro/ordens" element={<ProtectedRoute roles={["admin","gestor","financeiro"]}><FinanceiroOrdens /></ProtectedRoute>} />
 <Route path="financeiro/materiais" element={<ProtectedRoute roles={["admin","gestor","financeiro"]}><FinanceiroMateriais /></ProtectedRoute>} />
 <Route path="materiais" element={<ProtectedRoute roles={["admin","gestor","supervisor","financeiro","auditor"]}><MateriaisEstoque /></ProtectedRoute>} />
 <Route path="estoque" element={<ProtectedRoute roles={["admin","gestor","supervisor","financeiro","auditor","campo"]}><Estoque /></ProtectedRoute>} />
              <Route path="mensagens" element={<Mensagens />} />
              <Route path="configuracoes" element={<ProtectedRoute roles={["admin"]}><Configuracoes /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
