export type MfCommonApprovalAction = 'approve' | 'reject';

export interface MfCommonApprovalRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tblAutoId: string;
  masterName: string;
  action: string;
  status: string;
  createdBy: string;
  createdDate: string;
  remark: string;
  displayFields: string[];
}

export interface MfCommonApprovalDetail {
  raw: Record<string, unknown>;
  masterName: string;
  fields: Array<{ label: string; value: string }>;
}

export interface MfCommonApprovalActionData {
  action: MfCommonApprovalAction;
  record: MfCommonApprovalRecord;
}

export interface MfCommonApprovalActionValue {
  remark: string;
}

export interface MfCommonApprovalCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}
