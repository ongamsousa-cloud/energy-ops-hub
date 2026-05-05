  import { useState, useEffect, Suspense, lazy } from "react";
  import { supabase } from "@/integrations/supabase/client";
  import { useAuth } from "@/lib/auth";
  import { developerService } from "@/services/developerService";
 import PageHeader from "@/components/PageHeader";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { 
    Activity, Palette, Terminal, ShieldAlert, FileText, Users, 
    Lock, Settings, Bug, HardDrive, Bell, History, Database,
    RefreshCcw
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Skeleton } from "@/components/ui/skeleton";

  // Lazy load components
  const DeveloperOverview = lazy(() => import("@/components/developer/DeveloperOverview"));
  const DesignSystemManager = lazy(() => import("@/components/developer/DesignSystemManager"));
  const FileManager = lazy(() => import("@/components/developer/FileManager"));
  const UserPermissionManager = lazy(() => import("@/components/developer/UserPermissionManager"));
  const PasswordResetManager = lazy(() => import("@/components/developer/PasswordResetManager"));
  const GlobalSettingsManager = lazy(() => import("@/components/developer/GlobalSettingsManager"));
  const AuditLogs = lazy(() => import("@/components/developer/AuditLogs"));
  const ErrorLogs = lazy(() => import("@/components/developer/ErrorLogs"));
   const SystemDiagnostics = lazy(() => import("@/components/developer/SystemDiagnostics"));
   const MaintenanceMode = lazy(() => import("@/components/developer/MaintenanceMode"));
   const DatabaseManager = lazy(() => import("@/components/developer/DatabaseManager"));
   const ModulesManager = lazy(() => import("@/components/developer/ModulesManager"));
   const TechTerminal = lazy(() => import("@/components/developer/TechTerminal"));

  const LoadingState = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  export default function DevDashboard() {
    const { hasRole } = useAuth();

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Developer Dashboard" 
          description="Centro Técnico de Controle Global do Sistema."
          actions={
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Reiniciar Painel
            </Button>
          }
        />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 mb-8 gap-1 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="design" className="gap-2"><Palette className="h-4 w-4" /> Design System</TabsTrigger>
            <TabsTrigger value="files" className="gap-2"><HardDrive className="h-4 w-4" /> Arquivos</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="auth" className="gap-2"><Lock className="h-4 w-4" /> Segurança</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" /> Global</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><History className="h-4 w-4" /> Auditoria</TabsTrigger>
            <TabsTrigger value="errors" className="gap-2"><Bug className="h-4 w-4" /> Erros</TabsTrigger>
             <TabsTrigger value="database" className="gap-2"><Database className="h-4 w-4" /> Banco de Dados</TabsTrigger>
             <TabsTrigger value="modules" className="gap-2"><LayoutGrid className="h-4 w-4" /> Módulos</TabsTrigger>
             <TabsTrigger value="terminal" className="gap-2"><Terminal className="h-4 w-4" /> Terminal</TabsTrigger>
             <TabsTrigger value="diagnostics" className="gap-2"><ShieldAlert className="h-4 w-4" /> Diagnóstico</TabsTrigger>
             <TabsTrigger value="maintenance" className="gap-2"><Bell className="h-4 w-4" /> Manutenção</TabsTrigger>
          </TabsList>

          <Suspense fallback={<LoadingState />}>
            <TabsContent value="overview"><DeveloperOverview /></TabsContent>
            <TabsContent value="design"><DesignSystemManager /></TabsContent>
            <TabsContent value="files"><FileManager /></TabsContent>
            <TabsContent value="users"><UserPermissionManager /></TabsContent>
            <TabsContent value="auth"><PasswordResetManager /></TabsContent>
            <TabsContent value="settings"><GlobalSettingsManager /></TabsContent>
            <TabsContent value="audit"><AuditLogs /></TabsContent>
            <TabsContent value="errors"><ErrorLogs /></TabsContent>
             <TabsContent value="database"><DatabaseManager /></TabsContent>
             <TabsContent value="modules"><ModulesManager /></TabsContent>
             <TabsContent value="terminal"><TechTerminal /></TabsContent>
             <TabsContent value="diagnostics"><SystemDiagnostics /></TabsContent>
             <TabsContent value="maintenance"><MaintenanceMode /></TabsContent>
          </Suspense>
        </Tabs>
      </div>
    );
  }