import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { MenuNode } from '../../../core/auth/auth.models';
import { ModuleMasterRecord, RoleAccessOption, RoleMenuAccessSnapshot } from './role-menu-access.models';

@Injectable({ providedIn: 'root' })
export class RoleMenuAccessApiService {
  private readonly http = inject(HttpClient);

  loadInitialData(currentUser: string): Observable<RoleMenuAccessSnapshot> {
    return forkJoin({
      modules: this.loadModules(currentUser),
      roles: this.loadRoles()
    });
  }

  loadModules(currentUser: string): Observable<ModuleMasterRecord[]> {
    const payload = {
      processName: 'SELECT',
      ProcessName: 'SELECT',
      userId: currentUser,
      UserId: currentUser,
      autoId: '',
      AutoId: ''
    };

    return this.http.post<unknown>(`${API_BASE_URL}/api/RoleMaster/ModuleMaster_IUDS`, payload).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toModuleRecord)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load modules.'))))
    );
  }

  loadRoles(): Observable<RoleAccessOption[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/RoleMaster/GetRoles`).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toRoleOption).filter((role) => role.roleId || role.roleCode || role.roleName)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load role options.'))))
    );
  }

  loadMenu(roleId: string, moduleId: string): Observable<MenuNode[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/Menu/getmenu`, {
      roleid: roleId || '',
      Moduleid: moduleId
    }).pipe(
      map((response) => buildMenuTree(dataSetRows<Record<string, unknown>>(response).filter(isVisibleMenuRow).map(toMenuNode))),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load module menu.'))))
    );
  }
}

function toModuleRecord(row: Record<string, unknown>): ModuleMasterRecord {
  return {
    raw: row,
    autoId: pickString(row, ['autoid', 'auto_Id', 'Auto_Id', 'autoId', 'AutoId', 'AUTO_ID', 'AUTOID', 'id', 'Id']),
    moduleId: pickString(row, ['moduleid', 'ModuleId', 'MODULEID', 'module_Id', 'Module_Id', 'MODULE_ID', 'id', 'Id']),
    moduleName: pickString(row, ['modulename', 'ModuleName', 'MODULE_NAME', 'module_Name', 'Module_Name', 'name', 'Name', 'caption', 'Caption']),
    description: pickString(row, ['description', 'Description', 'DESCRIPTION']),
    link: pickString(row, ['link', 'Link', 'LINK', 'url', 'Url', 'URL']),
    active: pickString(row, ['isactive', 'IsActive', 'ISACTIVE', 'active', 'Active', 'ACTIVE'])
  };
}

function toRoleOption(row: Record<string, unknown>): RoleAccessOption {
  return {
    raw: row,
    roleId: pickString(row, ['roleid', 'RoleId', 'ROLEID', 'autoid', 'AutoId', 'AUTOID', 'auto_Id', 'Auto_Id', 'ID', 'id']),
    roleCode: pickString(row, ['rolecode', 'RoleCode', 'ROLE_CODE', 'role_Code', 'Role_Code']),
    roleName: pickString(row, ['rolename', 'RoleName', 'ROLE_NAME', 'role_Name', 'Role_Name', 'name', 'Name'])
  };
}

function toMenuNode(row: Record<string, unknown>, index: number): MenuNode {
  const label = pickString(row, ['caption', 'Caption', 'value', 'Value', 'MENU_NAME', 'MenuName', 'MENUNAME', 'name', 'Name'], 'Menu');
  const upgradedUrl = pickString(row, ['URL_UPGRADE', 'url_upgrade', 'Url_Upgrade', 'urlUpgrade', 'UrlUpgrade']);
  const icon = normalizeIcon(pickString(row, ['icon', 'Icon', 'ICON']));

  return {
    raw: row,
    id: pickString(row, ['menU_ID', 'MENU_ID', 'MenuId', 'menuId', 'ID', 'id', 'Id'], `menu-${index}`),
    parentId: normalizeParentId(pickString(row, ['parenT_ID', 'PARENT_ID', 'ParentId', 'parentId', 'PARENTID'])),
    moduleId: pickString(row, ['moduleid', 'ModuleId', 'MODULEID', 'MODULE_ID']),
    label,
    route: toAngularRoute(upgradedUrl),
    icon: icon.name,
    iconType: icon.type,
    order: Number(pickString(row, ['menU_SEQUENCE', 'MENU_SEQUENCE', 'MenuSequence', 'SEQUENCE', 'SEQNO'], '0')) || 0,
    children: []
  };
}

function isVisibleMenuRow(row: Record<string, unknown>): boolean {
  return pickString(row, ['hide', 'Hide', 'HIDE'], '0') !== '1';
}

function buildMenuTree(nodes: MenuNode[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] });
  }

  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortMenu(roots);
}

function sortMenu(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label))
    .map((node) => ({ ...node, children: sortMenu(node.children) }));
}

function normalizeParentId(parentId: string): string {
  return parentId && parentId !== '0' ? parentId : '';
}

function toAngularRoute(url: string): string {
  const route = normalizeRoute(url);
  if (!route || route === '#') return '';
  return knownRoutes.has(route) ? route : '';
}

const knownRoutes = new Set([
  '/dashboard',
  '/administration/users',
  '/administration/roles',
  '/administration/role-menu-access',
  '/administration/common-approval',
  '/pdf-coordinate-mapper/template-master',
  '/pdf-coordinate-mapper/template-mapping',
  '/pdf-coordinate-mapper/amc-master',
  '/pdf-coordinate-mapper/client-master',
  '/pdf-coordinate-mapper/isin-master',
  '/pdf-coordinate-mapper/common-approval',
  '/pdf-coordinate-mapper/master-import',
  '/pdf-coordinate-mapper/master-import/AMC',
  '/pdf-coordinate-mapper/master-import/CLIENT',
  '/pdf-coordinate-mapper/master-import/ISIN'
]);

function normalizeRoute(url: string): string {
  const route = url.trim();
  if (!route || route === '#') return '';
  return route.startsWith('/') ? route : `/${route}`;
}

function normalizeIcon(icon: string): { name: string; type: 'fontawesome' | 'material' } {
  if (!icon) return { name: 'article', type: 'material' };
  if (/\bfa[-\w]*\b/.test(icon)) return { name: icon, type: 'fontawesome' };
  return { name: icon, type: 'material' };
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
