export type UserMasterView = 'all' | 'approved' | 'deleted' | 'pending';
export type UserMasterFormMode = 'create' | 'edit' | 'view';

export interface UserMasterListSnapshot {
  allUsers: UserMasterRecord[];
  approvedUsers: UserMasterRecord[];
}

export interface UserMasterDropdownSnapshot {
  roles: UserRoleOption[];
  activeOptions: UserActiveOption[];
}

export interface UserMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  email: string;
  branchCode: string;
  branchName: string;
  departmentCode: string;
  departmentName: string;
  active: string;
  activeLabel: string;
  dormant: string;
  loginStatus: string;
  status: string;
  statusLabel: string;
  approvalState: string;
  actionRemark: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  approvedBy: string;
  approvedDate: string;
}

export interface UserRoleOption {
  id: string;
  name: string;
  raw: Record<string, unknown>;
}

export interface UserActiveOption {
  id: string;
  name: string;
  raw: Record<string, unknown>;
}

export interface UserMasterFormValue {
  userId: string;
  userName: string;
  email: string;
  roleId: string;
  branchCode: string;
  branchName: string;
  departmentCode: string;
  departmentName: string;
  active: string;
}

export interface UserMasterCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}

export interface UserMasterDialogData {
  mode: UserMasterFormMode;
  record: UserMasterRecord | null;
  roles: UserRoleOption[];
  activeOptions: UserActiveOption[];
  submitting: boolean;
}
