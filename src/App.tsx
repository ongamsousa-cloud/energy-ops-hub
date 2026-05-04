import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import EstoqueShell from "@/components/EstoqueShell";
import EstoqueRedirect from "@/components/EstoqueRedirect";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import Atividades from "./pages/Atividades";
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
 import Departamentos from "./pages/Departamentos";
 import DevDashboard from "./pages/DevDashboard";
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

            {/* Departamento de Estoque - shell isolado */}
            <Route path="/estoque-app" element={<ProtectedRoute><EstoqueShell /></ProtectedRoute>}>
              <Route index element={<Estoque defaultTab="overview" />} />
              <Route path="materiais" element={<Estoque defaultTab="materials" />} />
              <Route path="almoxarifados" element={<Estoque defaultTab="warehouses" />} />
              <Route path="movimentacoes" element={<Estoque defaultTab="movements" />} />
              <Route path="alertas" element={<Estoque defaultTab="alerts" />} />
            </Route>

            {/* Demais departamentos */}
            <Route path="/app" element={<ProtectedRoute><EstoqueRedirect><AppShell /></EstoqueRedirect></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="obras" element={<ProtectedRoute roles={["admin","gestor","supervisor","financeiro","auditor"]}><Obras /></ProtectedRoute>} />
              <Route path="obras/:id" element={<ObraDetalhe />} />
              <Route path="atividades" element={<ProtectedRoute roles={["admin","gestor"]}><Atividades /></ProtectedRoute>} />
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
              <Route path="estoque" element={<ProtectedRoute roles={["admin","gestor","supervisor","financeiro","auditor","campo","estoque"]}><Estoque /></ProtectedRoute>} />
              <Route path="mensagens" element={<Mensagens />} />
              <Route path="configuracoes" element={<ProtectedRoute roles={["admin"]}><Configuracoes /></ProtectedRoute>} />
               <Route path="departamentos" element={<ProtectedRoute roles={["admin"]}><Departamentos /></ProtectedRoute>} />
               <Route path="dev" element={<ProtectedRoute roles={["admin"]}><DevDashboard /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
