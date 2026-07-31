import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../api/api.config';
import { allDataSetRows, dataSetRows, extractDbMessage, pickString, unwrapApiResponse } from '../api/dataset.adapter';
import { AuthSession, LoginRequest, MenuNode, ModuleAccessItem } from './auth.models';
import { AuthStore } from './auth.store';
import { RuntimeMenuService } from '../menu/runtime-menu.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly runtimeMenu = inject(RuntimeMenuService);

  login(request: LoginRequest): Observable<AuthSession> {
    const userId = request.userId.trim();

    return this.http.post<unknown>(`${API_BASE_URL}/api/auth/login`, {
      userName: userId,
      userId,
      user_Id: userId,
      password: request.password,
      flag: 'LOGIN'
    }).pipe(
      map((response) => this.toSession(response, userId)),
      tap((session) => {
        this.store.setSession(session);
        this.store.setSelectedModuleId('');
        this.store.clearMenu();
      }),
      switchMap((session) => this.loadAuthorizedModules(session).pipe(map(() => session))),
      catchError((error) => throwError(() => new Error(this.errorMessage(error, 'Login failed.'))))
    );
  }

  logout(): Observable<void> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/auth/logout`, {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.store.clear())
    );
  }

  loadModules(userId: string): Observable<ModuleAccessItem[]> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/welcome/GetData`, { UserId: userId }).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response).map(toModuleAccessItem))
    );
  }

  loadAuthorizedModules(session = this.store.session()): Observable<ModuleAccessItem[]> {
    if (!session) {
      this.store.setModules([]);
      return of([]);
    }

    return this.loadModules(session.user.userName || session.user.userId).pipe(
      tap((modules) => this.store.setModules(modules)),
      tap((modules) => this.clearStaleModuleSelection(modules)),
      catchError(() => {
        this.store.setModules([]);
        return of([]);
      })
    );
  }

  selectModule(module: ModuleAccessItem): Observable<MenuNode[]> {
    const session = this.store.session();
    if (!session || !module.moduleId) {
      this.store.setSelectedModuleId('');
      this.store.clearMenu();
      return of([]);
    }

    const roleId = session.user.roleId || module.roleId || findFirst(this.store.modules(), 'roleId');
    this.store.setSelectedModuleId('');
    this.store.clearMenu();

    return this.runtimeMenu.loadMenu(roleId, module.moduleId).pipe(
      tap((menu) => {
        this.store.setSelectedModuleId(module.moduleId);
        this.store.setMenu(menu);
      }),
      catchError(() => {
        this.store.setSelectedModuleId('');
        this.store.clearMenu();
        return of([]);
      })
    );
  }

  private toSession(response: unknown, requestedUserId: string): AuthSession {
    const payload = unwrapApiResponse<Record<string, unknown>>(response);
    const rows = allDataSetRows<Record<string, unknown>>(payload);
    const firstRow = rows[0] ?? {};
    const roles = readRoles(payload, rows);
    const userName = pickString(firstRow, ['UserName', 'USER_NAME', 'userName', 'NAME'], requestedUserId);
    const userId = pickString(firstRow, ['UserId', 'USER_ID', 'user_Id', 'User_Id'], requestedUserId);
    const roleId = findFirstValue(rows, roleIdKeys());

    return {
      token: pickString(payload, ['AccessToken', 'accessToken', 'Token', 'token']) || null,
      tokenType: pickString(payload, ['TokenType', 'tokenType'], 'Bearer'),
      expiresInSeconds: Number(payload['ExpiresInSeconds'] ?? payload['expiresInSeconds'] ?? 0) || null,
      sessionId: pickString(payload, ['SessionId', 'sessionId']),
      user: {
        userId,
        userName,
        roles,
        roleId
      },
      rawLoginData: payload['Data'] ?? payload['data'] ?? payload
    };
  }

  private clearStaleModuleSelection(modules: ModuleAccessItem[]): void {
    const selectedModuleId = this.store.selectedModuleId();
    if (selectedModuleId && modules.some((module) => module.moduleId === selectedModuleId)) {
      return;
    }

    this.store.setSelectedModuleId('');
    this.store.clearMenu();
  }

  private errorMessage(error: unknown, fallback: string): string {
    const httpError = error as { error?: unknown; message?: string };
    return extractDbMessage(httpError?.error) || httpError?.message || fallback;
  }
}

function readRoles(payload: Record<string, unknown>, rows: Record<string, unknown>[]): string[] {
  const direct = payload['Roles'] ?? payload['roles'];
  if (Array.isArray(direct)) {
    return direct.map(String).filter(Boolean);
  }

  const roleSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (/role/i.test(key)) {
        const value = String(row[key] ?? '').trim();
        if (value) {
          roleSet.add(value);
        }
      }
    }
  }

  return Array.from(roleSet);
}

function toModuleAccessItem(row: Record<string, unknown>): ModuleAccessItem {
  return {
    raw: row,
    moduleId: pickString(row, moduleIdKeys()),
    moduleName: pickString(row, ['ModuleName', 'MODULENAME', 'MODULE_NAME', 'MODULE', 'Name', 'NAME']),
    roleId: pickString(row, roleIdKeys()),
    link: pickString(row, ['Link', 'LINK', 'Url', 'URL'])
  };
}

function findFirst(modules: ModuleAccessItem[], key: 'roleId'): string {
  const keys = key === 'roleId' ? roleIdKeys() : [];

  for (const module of modules) {
    const value = pickString(module.raw, keys);
    if (value) {
      return value;
    }
  }

  return '';
}

function findFirstValue(rows: Record<string, unknown>[], keys: string[]): string {
  for (const row of rows) {
    const value = pickString(row, keys);
    if (value) {
      return value;
    }
  }

  return '';
}

function roleIdKeys(): string[] {
  return ['RoleId', 'ROLE_ID', 'ROLEID', 'GROUP_ID', 'GroupId', 'GROUPID', 'groupId', 'groupidcheck', 'Group_Id', 'RoleAutoId', 'ROLE_AUTO_ID', 'AutoId', 'AUTOID'];
}

function moduleIdKeys(): string[] {
  return ['ModuleId', 'MODULEID', 'MODULE_ID', 'MODULE_AUTO_ID', 'ModuleAutoId', 'MODULEAUTOID', 'APPLICATION_ID', 'ApplicationId', 'APP_ID', 'Id', 'ID', 'AutoId', 'AUTOID'];
}
