import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { ApprovalCommandResult, ApprovalDetailRecord, ApprovalMasterOption, ApprovalSummaryRecord, RoleModuleMappingRecord } from './common-approval.models';

@Injectable({ providedIn: 'root' })
export class CommonApprovalApiService {
  private readonly http = inject(HttpClient);

  loadMasters(): Observable<ApprovalMasterOption[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/CommonApproval/GetAllMasterForDDL`, {}).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toMasterOption).filter((option) => option.name || option.id)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load approval masters.'))))
    );
  }

  loadPending(currentUser: string, selectedMaster: ApprovalMasterOption | null): Observable<ApprovalSummaryRecord[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/CommonApproval/GetAllUser`, {
      flag: 'S',
      Flag: 'S',
      masterName: selectedMaster?.name || '',
      MasterName: selectedMaster?.name || '',
      user_Id: currentUser,
      User_Id: currentUser,
      userId: currentUser,
      UserId: currentUser,
      currrentUserId: currentUser
    }).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map((row) => toSummaryRecord(row, selectedMaster))),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load pending approvals.'))))
    );
  }

  loadDetails(record: ApprovalSummaryRecord, currentUser: string): Observable<ApprovalDetailRecord[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/CommonApproval/GetData_CommonApproval`, {
      Auth_MasterName: record.detailsMasterName,
      Auth_UpdatedBy: record.makerId,
      Auth_CurrUser: currentUser,
      Auth_AutoId: record.tableAutoId || record.autoId
    }).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map((row) => toDetailRecord(row, record))),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load approval details.'))))
    );
  }

  submitDecisions(records: ApprovalDetailRecord[], summary: ApprovalSummaryRecord, currentUser: string): Observable<ApprovalCommandResult[]> {
    const selected = records.filter((record) => record.decision);
    if (!selected.length) {
      return of([]);
    }

    return forkJoin(selected.map((record) => this.submitDecision(record, summary, currentUser)));
  }

  loadRoleModuleMapping(record: ApprovalSummaryRecord | ApprovalDetailRecord, currentUser: string): Observable<RoleModuleMappingRecord[]> {
    const roleId = pickString(record.raw, [
      'roleid',
      'RoleId',
      'ROLEID',
      'role_id',
      'Role_Id',
      'ROLE_ID',
      'groupid',
      'GroupId',
      'GROUPID',
      'group_id',
      'Group_Id',
      'GROUP_ID',
      'autoid',
      'auto_Id',
      'Auto_Id',
      'autoId',
      'AutoId',
      'AUTO_ID',
      'AUTOID'
    ]) || record.autoId;
    const roleName = pickString(record.raw, ['rolename', 'RoleName', 'ROLE_NAME', 'role_Name', 'Role_Name']);
    const autoId = pickString(record.raw, ['autoid', 'auto_Id', 'Auto_Id', 'autoId', 'AutoId', 'AUTO_ID', 'AUTOID'], record.autoId);
    return this.http.post<unknown>(`${API_BASE_URL}/api/RoleModuleMapping/RoleModuleMaster_IUDS`, {
      ProcessName: 'SELECT',
      processName: 'SELECT',
      RoleId: roleId,
      roleId,
      RoleName: roleName,
      roleName,
      MenuAccess: '',
      menuAccess: '',
      Groupid: '',
      groupid: '',
      UserId: currentUser,
      userId: currentUser,
      ApprovedBy: currentUser,
      approvedBy: currentUser,
      AutoId: autoId,
      autoId
    }).pipe(
      map((response) => applyRoleMenuChecks(
        dataSetRows<Record<string, unknown>>(response),
        dataSetRows<Record<string, unknown>>(response, 2)
      ).map(toRoleModuleMappingRecord)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load role module mapping.'))))
    );
  }

  private submitDecision(record: ApprovalDetailRecord, summary: ApprovalSummaryRecord, currentUser: string): Observable<ApprovalCommandResult> {
    const qflag = record.decision === 'approve' ? 'A' : 'R';
    return this.http.post<unknown>(`${API_BASE_URL}/api/CommonApproval/CommonApproval_AR`, {
      qflag,
      Qflag: qflag,
      auto_Id: record.autoId,
      Auto_Id: record.autoId,
      tbl_Auto_Id: record.tableAutoId || record.autoId || summary.tableAutoId || summary.autoId,
      masterName: summary.masterName,
      MasterName: summary.masterName,
      action: qflag,
      Action: qflag,
      userID: currentUser,
      UserID: currentUser,
      roleDescription: record.roleDescription,
      RoleDescription: record.roleDescription,
      roleName: record.roleName,
      RoleName: record.roleName,
      modifiedDate: record.modifiedDate,
      ModifiedDate: record.modifiedDate,
      status: pickString(record.raw, ['statusid', 'StatusId', 'STATUSID', 'status', 'Status'])
    }).pipe(
      map((response) => ({ success: true, message: extractDbMessage(response) || 'Decision submitted successfully.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Approval decision failed.'))))
    );
  }
}

function toMasterOption(row: Record<string, unknown>): ApprovalMasterOption {
  const name = pickString(row, ['mastername', 'MasterName', 'MASTER_NAME', 'name', 'Name', 'VALUE', 'Value']);
  return {
    raw: row,
    id: pickString(row, ['id', 'Id', 'ID', 'autoid', 'AutoId', 'AUTOID'], name),
    name,
    detailsMasterName: toDetailsMasterName(name)
  };
}

function toSummaryRecord(row: Record<string, unknown>, selectedMaster: ApprovalMasterOption | null): ApprovalSummaryRecord {
  const masterName = pickString(row, ['mastername', 'MasterName', 'MASTER_NAME', 'Auth_MasterName'], selectedMaster?.name || '');
  const autoId = pickString(row, ['autoid', 'AutoId', 'AUTOID', 'auto_Id', 'Auto_Id', 'AUTO_ID', 'Auth_AutoId']);
  return {
    raw: row,
    autoId,
    tableAutoId: pickString(row, ['tbl_Auto_Id', 'TBL_AUTO_ID', 'tableAutoId', 'TableAutoId'], autoId),
    masterName,
    detailsMasterName: pickString(row, ['detailsMasterName', 'DetailsMasterName', 'DETAIL_MASTER_NAME'], selectedMaster?.detailsMasterName || toDetailsMasterName(masterName)),
    referenceNo: pickString(row, ['referenceNo', 'ReferenceNo', 'REF_NO', 'DISPLAYFIELD1', 'rolecode', 'RoleCode']),
    makerId: pickString(row, ['makerid', 'MakerId', 'MAKER_ID', 'updatedby', 'UpdatedBy', 'UPDATED_BY', 'createdby', 'CreatedBy', 'CREATED_BY', 'Auth_UpdatedBy']),
    description: pickString(row, ['description', 'Description', 'DISPLAYFIELD2', 'rolename', 'RoleName', 'userName', 'UserName', 'VALUE']),
    action: pickString(row, ['action', 'Action', 'ACTION', 'actionremark', 'ActionRemark', 'ACTIONREMARK']),
    status: pickString(row, ['status', 'Status', 'STATUS', 'displaystatus', 'DisplayStatus']),
    count: pickString(row, ['count', 'Count', 'COUNT', 'cnt', 'Cnt'])
  };
}

function toDetailRecord(row: Record<string, unknown>, summary: ApprovalSummaryRecord): ApprovalDetailRecord {
  const autoId = pickString(row, ['autoid', 'AutoId', 'AUTOID', 'auto_Id', 'Auto_Id', 'AUTO_ID'], summary.autoId);
  return {
    raw: row,
    autoId,
    tableAutoId: pickString(row, ['tbl_Auto_Id', 'TBL_AUTO_ID', 'tableAutoId', 'TableAutoId'], autoId || summary.tableAutoId),
    roleName: pickString(row, ['rolename', 'RoleName', 'ROLE_NAME', 'role_Name', 'Role_Name']),
    roleDescription: pickString(row, ['description', 'Description', 'ROLE_DESCRIPTION', 'RoleDescription']),
    action: pickString(row, ['action', 'Action', 'ACTION']),
    status: pickString(row, ['status', 'Status', 'STATUS', 'actionremark', 'ActionRemark']),
    createdBy: pickString(row, ['createdby', 'CreatedBy', 'CREATED_BY']),
    createdDate: pickString(row, ['createddate', 'CreatedDate', 'CREATED_DATE']),
    modifiedBy: pickString(row, ['modifiedby', 'ModifiedBy', 'MODIFIED_BY']),
    modifiedDate: pickString(row, ['modifieddate', 'ModifiedDate', 'MODIFIED_DATE']),
    active: pickString(row, ['isactive', 'IsActive', 'ISACTIVE', 'active', 'Active']),
    decision: ''
  };
}

function toRoleModuleMappingRecord(row: Record<string, unknown>): RoleModuleMappingRecord {
  const checked = pickString(row, ['MenuChecked', 'menuChecked', 'MENUCHECKED'], '0');
  return {
    raw: row,
    moduleName: pickString(row, ['MODULENAME', 'ModuleName', 'modulename']),
    mainMenu: pickString(row, ['MainMenu', 'mainmenu', 'MAINMENU']),
    subMenu: pickString(row, ['SubMenu', 'submenu', 'SUBMENU', 'Caption', 'caption']),
    menuId: pickString(row, ['Menu_Id', 'MENU_ID', 'menu_id', 'MenuId', 'menuId']),
    moduleId: pickString(row, ['MODULEID', 'ModuleId', 'moduleid']),
    menuChecked: checked === '1',
    status: pickString(row, ['status', 'Status', 'STATUS'])
  };
}

function applyRoleMenuChecks(roleMenus: Record<string, unknown>[], userMenus: Record<string, unknown>[]): Record<string, unknown>[] {
  const userMenuIds = new Set(
    userMenus
      .map((row) => Number(menuIdForCheck(row)))
      .filter((menuId) => Number.isFinite(menuId))
  );

  return roleMenus.map((menu) => ({
    ...menu,
    MenuChecked: userMenuIds.has(Number(menuIdForCheck(menu))) ? '1' : '0'
  }));
}

function menuIdForCheck(row: Record<string, unknown>): string {
  return pickString(row, ['MenuId', 'menuId', 'MENUID', 'menuid', 'Menu_Id', 'MENU_ID', 'menU_ID']);
}

function toDetailsMasterName(masterName: string): string {
  const value = masterName.toLowerCase();
  if (/role/.test(value)) return 'ROLE_MASTER_DETAILS';
  if (/user/.test(value)) return 'USER_MASTER_DETAILS';
  if (/configuration/.test(value)) return 'CONFIGURATION_MASTER_DETAILS';
  return masterName;
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
