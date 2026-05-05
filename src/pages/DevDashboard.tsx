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

  const LoadingState = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

 export default function DevDashboard() {