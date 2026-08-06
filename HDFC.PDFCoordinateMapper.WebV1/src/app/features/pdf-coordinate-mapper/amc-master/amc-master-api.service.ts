import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { AmcMasterListSnapshot, AmcMasterRecord } from './amc-master.models';

@Injectable({ providedIn: 'root' })
export class AmcMasterApiService {
  private readonly http = inject(HttpClient);

  loadAmcs(): Observable<AmcMasterListSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/AmcMaster/GetAmcMaster`).pipe(
      map((response) => ({
        amcs: dataSetRows<Record<string, unknown>>(response, 0).map(toAmcRecord),
        approvedAmcs: dataSetRows<Record<string, unknown>>(response, 1).map(toAmcRecord)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load AMC Master.'))))
    );
  }
}

function toAmcRecord(row: Record<string, unknown>): AmcMasterRecord {
  return {
    raw: row,
    autoId: pickString(row, ['AUTOID', 'AutoId', 'autoId', 'auto_Id']),
    mstColId: pickString(row, ['MST_COL_ID', 'MstColId', 'mstColId']),
    amcCode: pickString(row, ['AMC_CODE', 'AmcCode', 'amcCode']),
    amcName: pickString(row, ['AMC_NAME', 'AmcName', 'amcName']),
    amcDescription: pickString(row, ['AMC_DESCRIPTION', 'AmcDescription', 'amcDescription']),
    active: pickString(row, ['ISACTIVE', 'IsActive', 'isActive', 'active']),
    status: pickString(row, ['STATUS', 'Status', 'status']),
    action: pickString(row, ['ACTION', 'Action', 'action']),
    actionRemark: pickString(row, ['ACTIONREMARK', 'ActionRemark', 'actionRemark']),
    createdBy: pickString(row, ['CREATEDBY', 'CreatedBy', 'createdBy']),
    createdDate: pickString(row, ['CREATEDDATE', 'CreatedDate', 'createdDate']),
    modifiedBy: pickString(row, ['MODIFIEDBY', 'ModifiedBy', 'modifiedBy']),
    modifiedDate: pickString(row, ['MODIFIEDDATE', 'ModifiedDate', 'modifiedDate']),
    approvedBy: pickString(row, ['APPROVEDBY', 'ApprovedBy', 'approvedBy']),
    approvedDate: pickString(row, ['APPROVEDDATE', 'ApprovedDate', 'approvedDate'])
  };
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
