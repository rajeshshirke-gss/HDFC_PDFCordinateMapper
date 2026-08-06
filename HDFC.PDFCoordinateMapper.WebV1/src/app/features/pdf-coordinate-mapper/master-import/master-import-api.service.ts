import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { extractDbMessage } from '../../../core/api/dataset.adapter';
import { MasterImportLogRow, MasterImportOption, MasterImportResult } from './master-import.models';

@Injectable({ providedIn: 'root' })
export class MasterImportApiService {
  private readonly http = inject(HttpClient);

  loadMasters(): Observable<MasterImportOption[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/MasterImport/GetMasters`).pipe(
      map((response) => toMasterOptions(response)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load import masters.'))))
    );
  }

  loadData(masterKey: string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${API_BASE_URL}/api/MasterImport/GetData`, {
      params: { masterKey }
    }).pipe(
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load master data.'))))
    );
  }

  loadImportLogs(masterKey: string): Observable<MasterImportLogRow[]> {
    return this.http.get<Record<string, unknown>[]>(`${API_BASE_URL}/api/MasterImport/GetImportLog`, {
      params: { masterKey }
    }).pipe(
      map((rows) => rows.map(toImportLogRow)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load import log.'))))
    );
  }

  importMaster(masterKey: string, importedBy: string): Observable<MasterImportResult> {
    return this.http.post<MasterImportResult>(`${API_BASE_URL}/api/MasterImport/Import`, {
      masterKey,
      importedBy
    }).pipe(
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Master import failed.'))))
    );
  }

  importAll(importedBy: string): Observable<MasterImportResult[]> {
    return this.http.post<MasterImportResult[]>(`${API_BASE_URL}/api/MasterImport/ImportAll`, {
      importedBy
    }).pipe(
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Master import failed.'))))
    );
  }
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}

function toMasterOptions(response: unknown): MasterImportOption[] {
  if (!Array.isArray(response)) {
    return [];
  }

  return response
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        key: stringValue(row['key'] ?? row['Key'] ?? row['MASTER_KEY'] ?? row['AUTOID']),
        name: stringValue(row['name'] ?? row['Name'] ?? row['MASTERNAME'] ?? row['MASTER_NAME'])
      };
    })
    .filter((item) => item.key && item.name);
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function toImportLogRow(row: Record<string, unknown>): MasterImportLogRow {
  return {
    recordCount: stringValue(valueFor(row, 'RECORDCOUNT')),
    status: stringValue(valueFor(row, 'STATUS')),
    importedBy: stringValue(valueFor(row, 'IMPORTEDBY')),
    importDateTime: stringValue(valueFor(row, 'IMPORTDATETIME')),
    raw: row
  };
}

function valueFor(row: Record<string, unknown>, key: string): unknown {
  if (row[key] !== undefined) {
    return row[key];
  }

  const normalizedKey = key.toLowerCase();
  const match = Object.keys(row).find((rowKey) => rowKey.toLowerCase() === normalizedKey);
  return match ? row[match] : undefined;
}
