export type AmcMasterView = 'all' | 'approved';

export interface AmcMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  mstColId: string;
  amcCode: string;
  amcName: string;
  amcDescription: string;
  active: string;
  status: string;
  action: string;
  actionRemark: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  approvedBy: string;
  approvedDate: string;
}

export interface AmcMasterFormValue {
  amcCode: string;
  amcName: string;
  amcDescription: string;
  active: string;
  remark: string;
}

export interface AmcMasterListSnapshot {
  amcs: AmcMasterRecord[];
  approvedAmcs: AmcMasterRecord[];
}

export interface AmcMasterDialogData {
  record: AmcMasterRecord | null;
}
