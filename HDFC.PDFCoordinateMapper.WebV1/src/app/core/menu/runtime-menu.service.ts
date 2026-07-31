import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';
import { dataSetRows, pickString } from '../api/dataset.adapter';
import { MenuNode } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class RuntimeMenuService {
  private readonly http = inject(HttpClient);

  loadMenu(roleId: string, moduleId: string): Observable<MenuNode[]> {
    if (!moduleId) {
      return of([]);
    }

    return this.http.post<unknown>(`${API_BASE_URL}/api/Menu/getmenu`, {
      roleid: roleId || '',
      Moduleid: moduleId
    }).pipe(
      map((response) => buildTree(dataSetRows<Record<string, unknown>>(response).filter(isVisibleMenuRow).map(toMenuNode))),
      catchError(() => of([]))
    );
  }
}

function toMenuNode(row: Record<string, unknown>, index: number): MenuNode {
  const id = pickString(row, ['MENU_ID', 'menU_ID', 'MenuId', 'menuId', 'MENUID', 'ID', 'id', 'Id'], `menu-${index}`);
  const label = pickString(row, [
    'MENU_NAME',
    'caption',
    'Caption',
    'value',
    'Value',
    'MenuName',
    'MENUNAME',
    'MENU_TEXT',
    'MenuText',
    'NAME',
    'Name',
    'TEXT',
    'Title',
    'TITLE'
  ], 'Menu');
  const legacyUrl = pickString(row, ['url', 'URL', 'Url', 'LINK', 'Link', 'ROUTE', 'Route', 'PATH', 'Path']);
  const actionName = pickString(row, ['actionname', 'ACTIONNAME', 'ActionName', 'ACTION_NAME']);
  const controllerName = pickString(row, ['controllername', 'CONTROLLERNAME', 'ControllerName', 'CONTROLLER_NAME']);
  const icon = normalizeIcon(pickString(row, ['icon', 'ICON', 'Icon']));

  return {
    raw: row,
    id,
    parentId: normalizeParentId(pickString(row, ['PARENT_ID', 'parenT_ID', 'ParentId', 'parentId', 'PARENTID', 'PARENT_MENU_ID', 'ParentMenuId'])),
    moduleId: pickString(row, ['moduleid', 'MODULEID', 'ModuleId', 'MODULE_ID']),
    label,
    route: toAngularRoute(label, legacyUrl, actionName, controllerName),
    icon: icon.name,
    iconType: icon.type,
    order: Number(pickString(row, ['MENU_SEQUENCE', 'menU_SEQUENCE', 'MenuSequence', 'SEQUENCE', 'SEQNO', 'SeqNo', 'ORDERNO', 'OrderNo'], '0')) || 0,
    children: []
  };
}

function isVisibleMenuRow(row: Record<string, unknown>): boolean {
  return pickString(row, ['hide', 'Hide', 'HIDE'], '0') !== '1';
}

function buildTree(nodes: MenuNode[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  const roots: MenuNode[] = [];

  for (const node of nodes) {
    if (!byId.has(node.id)) {
      byId.set(node.id, { ...node, children: [] });
    }
  }

  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortNodes(roots);
}

function sortNodes(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label))
    .map((node) => ({ ...node, children: sortNodes(node.children) }));
}

function normalizeParentId(parentId: string): string {
  return parentId && parentId !== '0' ? parentId : '';
}

function toAngularRoute(label: string, legacyUrl: string, actionName: string, controllerName: string): string {
  const directRoute = normalizeDirectRoute(legacyUrl);
  if (directRoute) {
    return directRoute;
  }

  const value = `${label} ${legacyUrl} ${actionName} ${controllerName}`.toLowerCase();
  if (/master\s*authentication|common\s*approval|commonapproval|authori[sz]e|authentication/.test(value) || label.trim().toLowerCase() === 'approval') {
    return '/administration/common-approval';
  }

  if (/role.*menu|menu.*access|module/.test(value)) {
    return '/administration/role-menu-access';
  }

  if (/role/.test(value)) {
    return '/administration/roles';
  }

  if (/user/.test(value)) {
    return '/administration/users';
  }

  if (/dashboard|welcome|home/.test(value)) {
    return '/dashboard';
  }

  return '';
}

function normalizeDirectRoute(legacyUrl: string): string {
  const route = legacyUrl.trim();
  if (!route || route === '#') {
    return '';
  }

  if (['/dashboard', '/administration/users', '/administration/roles', '/administration/role-menu-access', '/administration/common-approval'].includes(route)) {
    return route;
  }

  if (/\/?dashboard$/i.test(route)) {
    return '/dashboard';
  }

  if (/user(master)?/i.test(route)) {
    return '/administration/users';
  }

  if (/master\s*authentication|common\s*approval|commonapproval|authori[sz]e|authentication|(^|\/)approval$/i.test(route)) {
    return '/administration/common-approval';
  }

  if (/module|menuaccess|rolemenu/i.test(route)) {
    return '/administration/role-menu-access';
  }

  if (/role(master)?/i.test(route)) {
    return '/administration/roles';
  }

  return '';
}

function normalizeIcon(icon: string): { name: string; type: 'fontawesome' | 'material' } {
  if (!icon) {
    return { name: 'article', type: 'material' };
  }

  if (/\bfa[-\w]*\b/.test(icon)) {
    return { name: icon, type: 'fontawesome' };
  }

  return { name: icon, type: 'material' };
}
