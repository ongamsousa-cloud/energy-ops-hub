import { AppRole } from "@/lib/auth";

export const PERMISSIONS = {
  // OS Actions
  OS_CREATE: ["admin", "gestor", "supervisor", "developer"] as AppRole[],
  OS_EDIT: ["admin", "gestor", "supervisor", "developer"] as AppRole[],
  OS_DELETE: ["admin", "developer"] as AppRole[],
  OS_APPROVE_SUPERVISOR: ["admin", "gestor", "supervisor", "developer"] as AppRole[],
  OS_APPROVE_AUDIT: ["admin", "auditor", "developer"] as AppRole[],
  
  // Material / Inventory
  STOCK_MANAGE: ["admin", "gestor", "estoque", "developer"] as AppRole[],
  STOCK_VIEW: ["admin", "gestor", "supervisor", "estoque", "financeiro", "developer"] as AppRole[],
  
  // Finance
  FINANCE_VIEW: ["admin", "gestor", "financeiro", "developer"] as AppRole[],
  FINANCE_MANAGE: ["admin", "financeiro", "developer"] as AppRole[],
  
  // Audit
  AUDIT_VIEW: ["admin", "gestor", "auditor", "developer"] as AppRole[],
  AUDIT_MANAGE: ["admin", "auditor", "developer"] as AppRole[],
  
  // Management
  TEAM_MANAGE: ["admin", "gestor", "developer"] as AppRole[],
  EMPLOYEE_MANAGE: ["admin", "gestor", "developer"] as AppRole[],
  DEPARTMENT_MANAGE: ["admin", "developer"] as AppRole[],
  
  // Developer
  DEVELOPER_ACCESS: ["developer"] as AppRole[],
};