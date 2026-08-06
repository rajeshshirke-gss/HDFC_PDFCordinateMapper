export interface MasterImportOption {
  key: string;
  name: string;
}

export interface MasterImportResult {
  masterKey: string;
  masterName: string;
  success: boolean;
  recordCount: number;
  message: string;
  startedAt: string;
  completedAt: string;
}
