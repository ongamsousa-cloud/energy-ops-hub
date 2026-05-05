 import { useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
  import { supabase } from "@/integrations/supabase/client";
  import { useAuth } from "@/lib/auth";
  import { developerService } from "@/services/developerService";
 import PageHeader from "@/components/PageHeader";
 // Tabs imports removed as we use custom sidebar
 import {
   Activity, Palette, Terminal, ShieldAlert, FileText, Users,
   Lock, Settings, Bug, HardDrive, Bell, History, Database,
   RefreshCcw, LayoutGrid, ChevronRight, Menu, X
 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Skeleton } from "@/components/ui/skeleton";
 import { cn } from "@/lib/utils";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
     const { hasRole, profile } = useAuth();
     const [activeTab, setActiveTab] = useState("overview");
     const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const logAccess = useCallback(async () => {
      if (profile) {
        try {
          const { data: ipData } = await fetch('https://api.ipify.org?format=json').then(res => res.json()).catch(() => ({ ip: 'Desconhecido' }));
          await developerService.logAction(
            "ACCESS_DASHBOARD",
            "SYSTEM",
            { 
              user_agent: navigator.userAgent,
              ip: ipData?.ip
            }
          );
        } catch (e) {
          console.error("Erro ao registrar acesso:", e);
        }
      }
    }, [profile]);

     useEffect(() => {
       logAccess();
     }, [logAccess]);

     const menuItems = useMemo(() => [
       { id: "overview", label: "Visão Geral", icon: Activity },
       { id: "design", label: "Design System", icon: Palette },
       { id: "files", label: "Arquivos", icon: HardDrive },
       { id: "users", label: "Usuários", icon: Users },
       { id: "auth", label: "Segurança", icon: Lock },
       { id: "settings", label: "Global", icon: Settings },
       { id: "audit", label: "Auditoria", icon: History },
       { id: "errors", label: "Erros", icon: Bug },
       { id: "database", label: "Banco de Dados", icon: Database },
       { id: "modules", label: "Módulos", icon: LayoutGrid },
       { id: "terminal", label: "Terminal", icon: Terminal },
       { id: "diagnostics", label: "Diagnóstico", icon: ShieldAlert },
       { id: "maintenance", label: "Manutenção", icon: Bell },
     ], []);

     const renderContent = () => {
       switch (activeTab) {
         case "overview": return <DeveloperOverview />;
         case "design": return <DesignSystemManager />;
         case "files": return <FileManager />;
         case "users": return <UserPermissionManager />;
         case "auth": return <PasswordResetManager />;
         case "settings": return <GlobalSettingsManager />;
         case "audit": return <AuditLogs />;
         case "errors": return <ErrorLogs />;
         case "database": return <DatabaseManager />;
         case "modules": return <ModulesManager />;
         case "terminal": return <TechTerminal />;
         case "diagnostics": return <SystemDiagnostics />;
         case "maintenance": return <MaintenanceMode />;
         default: return <DeveloperOverview />;
       }
     };

     const NavItems = () => (
       <div className="space-y-1 p-2">
         {menuItems.map((item) => (
             <button
               key={item.id}
               onClick={() => {
                 setActiveTab(item.id);
                 setIsMobileNavOpen(false);
               }}
               className={cn(
                 "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors",
                 "hover:bg-accent hover:text-foreground",
                 activeTab === item.id && "bg-accent text-foreground font-medium"
               )}
             >
               <item.icon className="h-4 w-4" strokeWidth={activeTab === item.id ? 2 : 1.5} />
               <span className="flex-1 text-left">{item.label}</span>
               {activeTab === item.id && <ChevronRight className="h-3 w-3 opacity-50" />}
             </button>
         ))}
       </div>
     );

     return (
       <div className="flex flex-col h-full -m-8 md:-m-8">
         {/* Header area for mobile toggle and page title */}
         <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 md:px-8">
           <div className="flex items-center gap-4">
             <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
               <SheetTrigger asChild>
                 <Button variant="outline" size="icon" className="md:hidden">
                   <Menu className="h-5 w-5" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="w-64 p-0">
                 <div className="p-4 border-b font-bold text-lg flex items-center gap-2">
                   <Terminal className="h-5 w-5 text-primary" />
                   Painel Técnico
                 </div>
                 <ScrollArea className="h-[calc(100vh-5rem)]">
                   <NavItems />
                 </ScrollArea>
               </SheetContent>
             </Sheet>
             <div>
               <h1 className="text-xl font-bold tracking-tight">Developer Dashboard</h1>
               <p className="text-xs text-muted-foreground hidden sm:block">Controle global e infraestrutura do sistema</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-8">
               <RefreshCcw className="h-3.5 w-3.5 mr-2" />
               <span className="hidden sm:inline">Reiniciar</span>
             </Button>
           </div>
         </div>

         <div className="flex flex-1 overflow-hidden">
           {/* Desktop Sidebar */}
           <aside className="hidden md:flex w-64 flex-col border-r bg-card/30 backdrop-blur-sm">
             <ScrollArea className="flex-1">
               <div className="py-4">
                 <NavItems />
               </div>
             </ScrollArea>
             <div className="p-4 border-t bg-muted/20">
               <div className="flex items-center gap-3 px-2 py-1 text-xs text-muted-foreground">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 SISTEMA OPERACIONAL
               </div>
             </div>
           </aside>

           {/* Content Area */}
           <main className="flex-1 overflow-y-auto p-4 md:p-8">
             <Suspense fallback={<LoadingState />}>
               {renderContent()}
             </Suspense>
           </main>
         </div>
       </div>
     );
   }