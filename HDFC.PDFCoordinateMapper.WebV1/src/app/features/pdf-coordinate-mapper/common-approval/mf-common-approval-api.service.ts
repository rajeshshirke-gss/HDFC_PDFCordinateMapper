import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { MfCommonApprovalCommandResult, MfCommonApprovalDetail, MfCommonApprovalRecord } from './mf-common-approval.models';

@Injectable({ providedIn: 'root' })
export class MfCommonApprovalApiService {
  private readonly http = inject(HttpClient);

  loadPending(masterName: string, currentUser: string): Observable<MfCommonApprovalRecord[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/MfCommonApproval/GetPendingSummary`, {
      flag: 'S',
      masterName,
      currentUserId: currentUser
    }).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toApprovalRecord)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load PDF approvals.'))))
    );
  }

  loadMasters(): Observable<string[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/MfCommonApproval/GetMasters`).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toMasterName).filter(Boolean)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load PDF approval masters.'))))
    );
  }

  loadDetails(record: MfCommonApprovalRecord, currentUser: string): Observable<MfCommonApprovalDetail[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/MfCommonApproval/GetPendingDetails`, {
      masterName: record.masterName,
      updatedBy: record.createdBy,
      currentUserId: currentUser,
      autoId: record.autoId
    }).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map((row) => toDetail(row, record.masterName))),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load PDF approval details.'))))
    );
  }

  approve(record: MfCommonApprovalRecord, remark: string, currentUser: string): Observable<MfCommonApprovalCommandResult> {
    return this.submit('Approve', 'A', record, remark, currentUser);
  }

  reject(record: MfCommonApprovalRecord, remark: string, currentUser: string): Observable<MfCommonApprovalCommandResult> {
    return this.submit('Reject', 'R', record, remark, currentUser);
  }

  private submit(action: 'Approve' | 'Reject', flag: string, record: MfCommonApprovalRecord, remark: string, currentUser: string): Observable<MfCommonApprovalCommandResult> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/MfCommonApproval/${action}`, {
      flag,
      auto_Id: record.autoId,
      tbl_Auto_Id: record.tblAutoId,
      masterName: record.masterName,
      currentUserId: currentUser,
      remark
    }).pipe(
      map((response) => ({ success: true, message: extractDbMessage(response) || `${record.masterName} ${action.toLowerCase()}d.`, raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'PDF approval decision failed.'))))
    );
  }
}

function toApprovalRecord(row: Record<string, unknown>): MfCommonApprovalRecord {
  const autoId = pickString(row, ['AUTO_ID', 'AutoId', 'autoId', 'AUTOID']);
  return {
    raw: row,
    autoId,
    tblAutoId: pickString(row, ['TBL_AUTO_ID', 'TblAutoId', 'tblAutoId'], autoId),
    masterName: pickString(row, ['MASTERNAME', 'MasterName', 'masterName']),
    action: pickString(row, ['ACTION', 'Action', 'action']),
    status: pickString(row, ['STATUS', 'Status', 'status']),
    createdBy: pickString(row, ['CREATEDBY', 'CreatedBy', 'createdBy']),
    createdDate: pickString(row, ['CREATEDDATE', 'CreatedDate', 'createdDate']),
    remark: pickString(row, ['REMARK', 'Remark', 'remark']),
    displayFields: displayFields(row)
  };
}

function toDetail(row: Record<string, unknown>, masterName: string): MfCommonApprovalDetail {
  return {
    raw: row,
    masterName,
    fields: detailFields(row, masterName)
  };
}

function toMasterName(row: Record<string, unknown>): string {
  return pickString(row, ['MASTERNAME', 'MasterName', 'masterName', 'NAME', 'Name']);
}

function displayFields(row: Record<string, unknown>): string[] {
  return Array.from({ length: 10 }, (_, index) => pickString(row, [`DISPLAYFIELD${index + 1}`, `DisplayField${index + 1}`, `displayField${index + 1}`]))
    .filter(Boolean);
}

function detailFields(row: Record<string, unknown>, masterName: string): Array<{ label: string; value: string }> {
  const keys = detailKeys(masterName);

  return keys
    .map((key) => ({ label: headerFor(key), value: pickString(row, [key]) }))
    .filter((field) => field.value);
}

function detailKeys(masterName: string): string[] {
  if (masterName === 'AMC Master') {
    return ['AMC_CODE', 'AMC_NAME', 'AMC_DESCRIPTION', 'ISACTIVE', 'ACTION', 'CREATEDBY', 'CREATEDDATE'];
  }

  if (masterName === 'Template Mapping Master') {
    return [
      'MAPPING_CODE',
      'MAPPING_NAME',
      'MAPPING_DESCRIPTION',
      'TEMPLATE_CODE',
      'TEMPLATE_NAME',
      'ORIGINAL_FILE_NAME',
      'MAPPING_PAGE_NUMBERS',
      'PRINT_PAGE_NUMBERS',
      'COORDINATE_ORIGIN',
      'FIELD_CODE',
      'FIELD_NAME',
      'EXCEL_HEADER_NAME',
      'FIELD_TYPE',
      'PAGE_NO',
      'X_COORDINATE',
      'Y_COORDINATE',
      'FIELD_WIDTH',
      'FIELD_HEIGHT',
      'IS_REQUIRED',
      'SAMPLE_VALUE',
      'DISPLAY_SEQUENCE',
      'IS_REPEATABLE',
      'REPEAT_GROUP_CODE',
      'CONFIG_COUNT',
      'CONFIG_SUMMARY',
      'MAPPING_ACTION',
      'CREATEDBY',
      'CREATEDDATE'
    ];
  }

  return ['TEMPLATE_CODE', 'TEMPLATE_NAME', 'TEMPLATE_DESCRIPTION', 'ORIGINAL_FILE_NAME', 'PDF_PAGE_COUNT', 'MAPPING_PAGE_NUMBERS', 'PRINT_PAGE_NUMBERS', 'REPEAT_ROWS_PER_PAGE', 'ISACTIVE', 'ACTION', 'CREATEDBY', 'CREATEDDATE'];
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
