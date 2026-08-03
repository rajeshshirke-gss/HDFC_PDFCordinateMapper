import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { RoleMasterCommandResult, RoleMasterFormValue, RoleMasterListSnapshot, RoleMasterMenuRow, RoleMasterRecord } from './role-master.models';

@Injectable({ providedIn: 'root' })
export class RoleMasterApiService {
  private readonly http = inject(HttpClient);

  loadRoles(): Observable<RoleMasterListSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/RoleMaster/GetRoleMaster`).pipe(
      map((response) => ({
        allRoles: dataSetRows<Record<string, unknown>>(response, 0).map(toRoleRecord),
        approvedRoles: dataSetRows<Record<string, unknown>>(response, 1).map(toRoleRecord)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load roles.'))))
    );
  }

  loadMenuRows(currentUser: string, role: RoleMasterRecord | null, menuAccess: string): Observable<RoleMasterMenuRow[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/RoleModuleMapping/RoleModuleMaster_IUDS`, buildRoleModuleMenuPayload(currentUser, role, menuAccess)).pipe(
      map((response) => {
        const menuRows = applyRoleMenuChecks(
          dataSetRows<Record<string, unknown>>(response),
          dataSetRows<Record<string, unknown>>(response, 2)
        );
        return menuRows.map((row, index) => toRoleMenuRow(row, index));
      }),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load role menus.'))))
    );
  }

  createRole(value: RoleMasterFormValue, currentUser: string): Observable<RoleMasterCommandResult> {
    return this.submit(buildPayload('INSERT', value, currentUser));
  }

  updateRole(record: RoleMasterRecord, value: RoleMasterFormValue, currentUser: string): Observable<RoleMasterCommandResult> {
    return this.submit({
      ...buildPayload('UPDATE', value, currentUser),
      auto_Id: record.autoId,
      Auto_Id: record.autoId
    });
  }

  deleteRole(record: RoleMasterRecord, currentUser: string): Observable<RoleMasterCommandResult> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/RoleMaster/Delete_RoleMaster`, {
      flag: 'DELETE',
      Flag: 'DELETE',
      auto_Id: record.autoId,
      Auto_Id: record.autoId,
      user_Id: currentUser,
      User_Id: currentUser
    }).pipe(
      map((response) => ({ success: true, message: extractDbMessage(response) || 'Role delete request submitted.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Role delete failed.'))))
    );
  }

  private submit(payload: Record<string, string>): Observable<RoleMasterCommandResult> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/RoleMaster/SaveRoleMaster`, payload).pipe(
      map((response) => ({ success: true, message: extractDbMessage(response) || 'Role request submitted.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Role Master request failed.'))))
    );
  }
}

function buildRoleModuleMenuPayload(currentUser: string, role: RoleMasterRecord | null, menuAccess: string): Record<string, string> {
  const roleId = role ? roleIdForMenuMapping(role) : '';
  const autoId = role?.autoId || '';
  if (!role) {
    return {
      processName: 'SELECT',
      ProcessName: 'SELECT',
      userId: currentUser,
      UserId: currentUser
    };
  }

  return {
    processName: 'SELECT',
    ProcessName: 'SELECT',
    roleId,
    RoleId: roleId,
    roleName: role.roleName || '',
    RoleName: role.roleName || '',
    menuAccess,
    MenuAccess: menuAccess,
    groupid: roleId,
    Groupid: roleId,
    userId: currentUser,
    UserId: currentUser,
    approvedBy: currentUser,
    ApprovedBy: currentUser,
    autoId,
    AutoId: autoId
  };
}

function roleIdForMenuMapping(role: RoleMasterRecord): string {
  return pickString(role.raw, [
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
  ], role.autoId || role.roleCode || '0');
}

function buildPayload(flag: 'INSERT' | 'UPDATE', value: RoleMasterFormValue, currentUser: string): Record<string, string> {
  const trimmed = {
    roleCode: value.roleCode.trim(),
    roleName: value.roleName.trim(),
    description: value.description.trim(),
    active: value.active.trim(),
    menuAccess: value.menuAccess.trim()
  };

  return {
    flag,
    Flag: flag,
    role_Code: trimmed.roleCode,
    Role_Code: trimmed.roleCode,
    role_Name: trimmed.roleName,
    Role_Name: trimmed.roleName,
    description: trimmed.description,
    Description: trimmed.description,
    active: trimmed.active,
    Active: trimmed.active,
    menuAccess: trimmed.menuAccess,
    MenuAccess: trimmed.menuAccess,
    user_Id: currentUser,
    User_Id: currentUser,
    groupidcheck: ''
  };
}

function toRoleRecord(row: Record<string, unknown>): RoleMasterRecord {
  return {
    raw: row,
    autoId: pickString(row, ['autoid', 'auto_Id', 'Auto_Id', 'autoId', 'AutoId', 'AUTO_ID', 'AUTOID']),
    roleCode: pickString(row, ['rolecode', 'role_Code', 'Role_Code', 'roleCode', 'RoleCode', 'ROLE_CODE']),
    roleName: pickString(row, ['rolename', 'role_Name', 'Role_Name', 'roleName', 'RoleName', 'ROLE_NAME']),
    description: pickString(row, ['description', 'Description', 'ROLE_DESCRIPTION', 'RoleDescription']),
    active: pickString(row, ['isactive', 'active', 'Active', 'ACTIVE', 'ISACTIVE']),
    menuAccess: pickMenuAccess(row)
  };
}

function toRoleMenuRow(row: Record<string, unknown>, index: number): RoleMasterMenuRow {
  const mainMenu = pickString(row, ['mainmenu', 'MainMenu', 'MAINMENU', 'main_menu', 'Main_Menu'], '');
  const subMenu = pickString(row, ['submenu', 'SubMenu', 'SUBMENU', 'sub_menu', 'Sub_Menu'], '');
  const caption = pickString(row, ['caption', 'Caption', 'CAPTION', 'value', 'Value'], subMenu || mainMenu || 'Menu');
  const menuAccessId = menuAccessIdFor(row);
  const menuId = menuAccessId || `${mainMenu}-${subMenu}-${caption}-${index}`;
  
  return {
    raw: row,
    menuId,
    menuAccessId,
    parentId: pickString(row, ['parenT_ID', 'PARENT_ID', 'ParentId', 'parentId', 'PARENTID']),
    moduleId: pickString(row, ['moduleid', 'ModuleId', 'MODULEID', 'MODULE_ID']),
    moduleName: pickString(row, ['modulename', 'ModuleName', 'MODULE_NAME'], ''),
    mainMenu,
    subMenu: subMenu || caption,
    selected: isMenuChecked(row),
    order: Number(pickString(row, ['menU_SEQUENCE', 'MENU_SEQUENCE', 'menu_sequence', 'MenuSequence'], '0')) || 0
  };
}

function pickMenuAccess(row: Record<string, unknown>): string {
  const directValue = pickString(row, [
    'menuaccess',
    'menuAccess',
    'MenuAccess',
    'MENUACCESS',
    'MENU_ACCESS',
    'Menu Access',
    'MENU ACCESS',
    'menu_access',
    'MENUS',
    'menus'
  ]);

  if (directValue) {
    return directValue;
  }

  const looseEntry = Object.entries(row).find(([key]) => /menu\s*_?\s*access/i.test(key));
  return looseEntry ? String(looseEntry[1] ?? '').trim() : '';
}

function menuAccessIdFor(row: Record<string, unknown>): string {
  const explicitValue = pickString(row, [
    'menuaccessid',
    'MenuAccessId',
    'MENUACCESSID',
    'menuAccessId',
    'menuid',
    'menuId',
    'MenuId',
    'MENU_ID',
    'menU_ID',
    'MENUID',
    'menu_id',
    'Menu_Id',
    'submenunumber',
    'SubMenunumber',
    'SUBMENUNUMBER',
    'subMenuNumber',
    'SubMenuNumber',
    'submenu_number',
    'Sub_Menu_Number',
    'id',
    'Id',
    'ID',
    'autoid',
    'AutoId',
    'AUTOID'
  ]);

  if (isMenuId(explicitValue)) {
    return normalizeMenuId(explicitValue);
  }

  const numericValue = Object.entries(row)
    .filter(([key]) => /menu|auto.?id|^id$/i.test(key))
    .map(([, value]) => normalizeMenuId(String(value ?? '').trim()))
    .find(isMenuId);

  if (numericValue) {
    return numericValue;
  }

  return Object.entries(row)
    .filter(([key]) => !/status|hide|sequence|seq|rights|access|has.?child|parent/i.test(key))
    .map(([, value]) => normalizeMenuId(String(value ?? '').trim()))
    .find((value) => isMenuId(value) && Number(value) > 1) || '';
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
  return pickString(row, ['MenuId', 'menuId', 'MENUID', 'menuid']);
}

function isMenuChecked(row: Record<string, unknown>): boolean {
  return pickString(row, ['MenuChecked', 'menuChecked', 'MENUCHECKED', 'menuchecked']) === '1';
}

function isMenuId(value: string): boolean {
  return /^\d+(?:\.0)?$/.test(value);
}

function normalizeMenuId(value: string): string {
  return value.replace(/\.0$/, '');
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
