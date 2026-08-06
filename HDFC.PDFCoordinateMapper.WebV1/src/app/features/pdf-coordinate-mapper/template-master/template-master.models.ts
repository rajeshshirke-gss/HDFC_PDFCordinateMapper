export type TemplateMasterView = 'all' | 'approved';
export type TemplateMasterFormMode = 'create' | 'edit' | 'view';

export interface TemplateMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  mstColId: string;
  templateCode: string;
  amcCode: string;
  amcName: string;
  templateName: string;
  templateDescription: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileHash: string;
  fileSizeBytes: string;
  mimeType: string;
  pdfPageCount: string;
  mappingPageNumbers: string;
  printPageNumbers: string;
  repeatRowsPerPage: string;
  isDigitallySigned: string;
  digitalSignatureDetails: string;
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

export interface TemplateUploadResult {
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileHash: string;
  fileSizeBytes: number;
  mimeType: string;
  pdfPageCount: number;
}

export interface TemplateMasterFormValue {
  templateCode: string;
  amcCode: string;
  templateName: string;
  templateDescription: string;
  originalFileName: string;
  storedFileName: string;
  filePath: string;
  fileHash: string;
  fileSizeBytes: string;
  mimeType: string;
  pdfPageCount: string;
  mappingPageNumbers: string;
  printPageNumbers: string;
  repeatRowsPerPage: string;
  isDigitallySigned: string;
  digitalSignatureDetails: string;
  active: string;
}

export interface TemplateMasterAmcOption {
  amcCode: string;
  amcName: string;
  raw: Record<string, unknown>;
}

export interface TemplateMasterListSnapshot {
  templates: TemplateMasterRecord[];
  approvedTemplates: TemplateMasterRecord[];
}

export interface TemplateMasterCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}

export interface TemplateMasterDialogData {
  mode: TemplateMasterFormMode;
  record: TemplateMasterRecord | null;
  submitting: boolean;
}
