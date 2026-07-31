export type RoleMasterView = 'all' | 'approved';
export type RoleMasterFormMode = 'create' | 'edit' | 'view';

export interface RoleMasterListSnapshot {
  allRoles: RoleMasterRecord[];
  approvedRoles: RoleMasterRecord[];
}

export interface RoleMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  roleCode: string;
  roleName: string;
  description: string;
  active: string;
  menuAccess: string;
}

export interface RoleMasterFormValue {
  roleCode: string;
  roleName: string;
  description: string;
  active: string;
  menuAccess: string;
}

export interface RoleMasterCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}

export interface RoleMasterMenuRow {
  raw: Record<string, unknown>;
  menuId: string;
  menuAccessId: string;
  parentId: string;
  moduleId: string;
  moduleName: string;
  mainMenu: string;
  subMenu: string;
  selected: boolean;
  order: number;
}

export interface RoleMasterDialogData {
  mode: RoleMasterFormMode;
  record: RoleMasterRecord | null;
  submitting: boolean;
}
