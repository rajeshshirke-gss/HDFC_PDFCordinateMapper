export type ApprovalDecision = 'approve' | 'reject' | '';

export interface ApprovalMasterOption {
  raw: Record<string, unknown>;
  id: string;
  name: string;
  detailsMasterName: string;
}

export interface ApprovalSummaryRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tableAutoId: string;
  masterName: string;
  detailsMasterName: string;
  referenceNo: string;
  makerId: string;
  description: string;
  action: string;
  status: string;
  count: string;
}

export interface ApprovalDetailRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tableAutoId: string;
  roleName: string;
  roleDescription: string;
  action: string;
  status: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  active: string;
  decision: ApprovalDecision;
}

export interface RoleModuleMappingRecord {
  raw: Record<string, unknown>;
  moduleName: string;
  mainMenu: string;
  subMenu: string;
  menuId: string;
  moduleId: string;
  menuChecked: boolean;
  status: string;
}

export interface ApprovalCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}
