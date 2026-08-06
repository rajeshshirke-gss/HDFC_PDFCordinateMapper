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

export interface MasterImportLogRow {
  recordCount: string;
  status: string;
  importedBy: string;
  importDateTime: string;
  raw: Record<string, unknown>;
}
