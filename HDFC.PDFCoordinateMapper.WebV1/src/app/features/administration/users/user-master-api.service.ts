import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { UserActiveOption, UserMasterCommandResult, UserMasterDropdownSnapshot, UserMasterFormValue, UserMasterListSnapshot, UserMasterRecord, UserRoleOption } from './user-master.models';

@Injectable({ providedIn: 'root' })
export class UserMasterApiService {
  private readonly http = inject(HttpClient);

  loadUsers(): Observable<UserMasterListSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/UserMaster/GetUserMaster`).pipe(
      map((response) => ({
        allUsers: dataSetRows<Record<string, unknown>>(response, 0).map(toUserRecord),
        approvedUsers: dataSetRows<Record<string, unknown>>(response, 1).map(toUserRecord)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load users.'))))
    );
  }

  loadRoleOptions(): Observable<UserRoleOption[]> {
    return this.loadDropdownOptions().pipe(map((snapshot) => snapshot.roles));
  }

  loadDropdownOptions(): Observable<UserMasterDropdownSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/UserMaster/GetAllRecordForDDL`).pipe(
      map((response) => ({
        roles: dataSetRows<Record<string, unknown>>(response, 0).map(toRoleOption).filter((role) => role.id && role.name),
        activeOptions: dataSetRows<Record<string, unknown>>(response, 1).map(toActiveOption).filter((option) => option.id && option.name)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load user master dropdowns.'))))
    );
  }

  createUser(value: UserMasterFormValue, currentUser: string): Observable<UserMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/UserMaster/SaveUserMaster`, buildSavePayload('INSERT', value, currentUser));
  }

  updateUser(record: UserMasterRecord, value: UserMasterFormValue, currentUser: string): Observable<UserMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/UserMaster/SaveUserMaster`, {
      ...buildSavePayload('UPDATE', value, currentUser),
      auto_Id: record.autoId
    });
  }

  deleteUser(record: UserMasterRecord, currentUser: string): Observable<UserMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/UserMaster/Delete_UserMaster`, {
      flag: 'D',
      auto_Id: record.autoId,
      user_Id: record.userId,
      userId: record.userId,
      currrentUserId: currentUser
    });
  }

  private submit(url: string, payload: Record<string, string>): Observable<UserMasterCommandResult> {
    return this.http.post<unknown>(url, payload).pipe(
      map((response) => {
        const message = extractDbMessage(response) || 'Request completed successfully.';
        return { success: true, message, raw: response };
      }),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'User Master request failed.'))))
    );
  }
}

function buildSavePayload(flag: 'INSERT' | 'UPDATE', value: UserMasterFormValue, currentUser: string): Record<string, string> {
  const trimmed = trimForm(value);
  return {
    flag,
    user_Id: trimmed.userId,
    userId: trimmed.userId,
    user_Name: trimmed.userName,
    email: trimmed.email,
    emailID: trimmed.email,
    groupId: trimmed.roleId,
    group_Id: trimmed.roleId,
    groupidcheck: trimmed.roleId,
    departmentCode: trimmed.departmentCode,
    departmentName: trimmed.departmentName,
    branchCode: trimmed.branchCode,
    branchName: trimmed.branchName,
    active: trimmed.active,
    isactive: trimmed.active,
    currrentUserId: currentUser
  };
}

function trimForm(value: UserMasterFormValue): UserMasterFormValue {
  return {
    userId: value.userId.trim(),
    userName: value.userName.trim(),
    email: value.email.trim(),
    roleId: value.roleId.trim(),
    branchCode: value.branchCode.trim(),
    branchName: value.branchName.trim(),
    departmentCode: value.departmentCode.trim(),
    departmentName: value.departmentName.trim(),
    active: value.active.trim()
  };
}

function toUserRecord(row: Record<string, unknown>): UserMasterRecord {
  const active = pickString(row, ['active', 'Active', 'ACTIVE', 'isactive', 'ISACTIVE']);
  const status = pickString(row, ['status', 'Status', 'STATUS', 'statusid', 'STATUSID']);
  const actionRemark = pickString(row, ['actionRemark', 'ActionRemark', 'ACTIONREMARK', 'ACTION_REMARK']);

  return {
    raw: row,
    autoId: pickString(row, ['auto_Id', 'Auto_Id', 'autoId', 'AutoId', 'AUTO_ID', 'AUTOID']),
    userId: pickString(row, ['user_Id', 'User_Id', 'userId', 'UserId', 'USER_ID', 'USERID']),
    userName: pickString(row, ['user_Name', 'User_Name', 'userName', 'UserName', 'USER_NAME']),
    roleId: pickString(row, ['groupId', 'GroupId', 'group_Id', 'Group_Id', 'GROUP_ID']),
    roleName: pickString(row, ['roleName', 'RoleName', 'ROLE_NAME', 'role_Id', 'Role_Id', 'ROLE_ID', 'USERROLE']),
    email: pickString(row, ['email', 'Email', 'EMAIL', 'emailID', 'EmailID']),
    branchCode: pickString(row, ['branchCode', 'BranchCode', 'BRANCH_CODE']),
    branchName: pickString(row, ['branchName', 'BranchName', 'BRANCH_NAME']),
    departmentCode: pickString(row, ['departmentCode', 'DepartmentCode', 'DEPARTMENT_CODE', 'Dept_Id', 'DEPT_ID']),
    departmentName: pickString(row, ['departmentName', 'DepartmentName', 'DEPARTMENT_NAME']),
    active,
    activeLabel: activeLabel(active),
    dormant: pickString(row, ['dormant', 'Dormant', 'DORMANT', 'isdormant', 'ISDORMANT']),
    loginStatus: pickString(row, ['loginStatus', 'LoginStatus', 'LOGIN_STATUS']),
    status,
    statusLabel: statusLabel(status, actionRemark, active),
    approvalState: approvalState(status, actionRemark, active),
    actionRemark,
    createdBy: pickString(row, ['createdBy', 'CreatedBy', 'CREATEDBY', 'CREATED_BY']),
    createdDate: pickString(row, ['createdDate', 'CreatedDate', 'CREATEDDATE', 'CREATED_DATE']),
    modifiedBy: pickString(row, ['modifiedBy', 'ModifiedBy', 'MODIFIEDBY', 'MODIFIED_BY']),
    modifiedDate: pickString(row, ['modifiedDate', 'ModifiedDate', 'MODIFIEDDATE', 'MODIFIED_DATE']),
    approvedBy: pickString(row, ['approvedBy', 'ApprovedBy', 'APPROVEDBY', 'APPROVED_BY']),
    approvedDate: pickString(row, ['approvedDate', 'ApprovedDate', 'APPROVEDDATE', 'APPROVED_DATE'])
  };
}

function toRoleOption(row: Record<string, unknown>): UserRoleOption {
  return {
    raw: row,
    id: pickString(row, ['AutoId', 'AUTOID', 'autoId', 'AUTO_ID', 'ID']),
    name: pickString(row, ['RoleName', 'ROLENAME', 'roleName', 'ROLE_NAME', 'NAME'])
  };
}

function toActiveOption(row: Record<string, unknown>): UserActiveOption {
  const name = pickString(row, ['DESCRIPTION', 'Description', 'description', 'NAME', 'Name', 'name']);
  return {
    raw: row,
    id: activeCodeForDescription(name),
    name
  };
}

function activeCodeForDescription(description: string): string {
  const normalized = description.trim().toLowerCase();
  if (normalized === 'active') return 'Y';
  if (normalized === 'inactive' || normalized === 'in active') return 'N';
  if (normalized === 'dormant') return 'DR';
  if (normalized === 'locked' || normalized === 'lock') return 'L';
  if (normalized === 'unlock' || normalized === 'unlocked') return 'U';
  if (normalized === 'delete' || normalized === 'deleted' || normalized === 'revoke') return 'D';
  return description;
}

function activeLabel(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'Y') return 'Active';
  if (normalized === 'N') return 'Inactive';
  if (normalized === 'L') return 'Locked';
  if (normalized === 'U') return 'Unlocked';
  if (normalized === 'D') return 'Delete';
  if (normalized === 'DR') return 'Dormant';
  return value || '-';
}

function statusLabel(status: string, actionRemark: string, active: string): string {
  return actionRemark || status || activeLabel(active);
}

function approvalState(status: string, actionRemark: string, active: string): string {
  const text = `${status} ${actionRemark} ${active}`.toLowerCase();
  if (/delete|deleted|\bd\b/.test(text)) return 'Deleted';
  if (/pending|insert|update|new added/.test(text)) return 'Pending';
  if (/approved|^1$|active/.test(text)) return 'Approved';
  return '';
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
