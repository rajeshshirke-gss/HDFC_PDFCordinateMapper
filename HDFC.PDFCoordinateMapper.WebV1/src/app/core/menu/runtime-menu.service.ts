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
  const upgradedUrl = pickString(row, ['URL_UPGRADE', 'url_upgrade', 'Url_Upgrade', 'urlUpgrade', 'UrlUpgrade']);
  const icon = normalizeIcon(pickString(row, ['icon', 'ICON', 'Icon']));

  return {
    raw: row,
    id,
    parentId: normalizeParentId(pickString(row, ['PARENT_ID', 'parenT_ID', 'ParentId', 'parentId', 'PARENTID', 'PARENT_MENU_ID', 'ParentMenuId'])),
    moduleId: pickString(row, ['moduleid', 'MODULEID', 'ModuleId', 'MODULE_ID']),
    label,
    route: toAngularRoute(upgradedUrl),
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

function toAngularRoute(url: string): string {
  const route = normalizeRoute(url);
  if (!route || route === '#') {
    return '';
  }

  return knownRoutes.has(route) ? route : '';
}

const knownRoutes = new Set(['/dashboard', '/administration/users', '/administration/roles', '/administration/role-menu-access', '/administration/common-approval']);

function normalizeRoute(url: string): string {
  const route = url.trim();
  if (!route || route === '#') return '';
  return route.startsWith('/') ? route : `/${route}`;
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
