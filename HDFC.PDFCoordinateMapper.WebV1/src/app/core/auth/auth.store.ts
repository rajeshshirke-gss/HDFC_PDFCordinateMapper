import { Injectable, computed, signal } from '@angular/core';

import { AuthSession, MenuNode, ModuleAccessItem } from './auth.models';

const SESSION_KEY = 'hdfc_pdf_mapper_v1_session';
const MODULES_KEY = 'hdfc_pdf_mapper_v1_modules';
const MENU_KEY = 'hdfc_pdf_mapper_v1_menu';
const SELECTED_MODULE_KEY = 'hdfc_pdf_mapper_v1_selected_module';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly sessionState = signal<AuthSession | null>(readJson<AuthSession>(SESSION_KEY));
  private readonly moduleState = signal<ModuleAccessItem[]>(readJson<ModuleAccessItem[]>(MODULES_KEY) ?? []);
  private readonly menuState = signal<MenuNode[]>(readJson<MenuNode[]>(MENU_KEY) ?? []);
  private readonly selectedModuleIdState = signal<string>(localStorage.getItem(SELECTED_MODULE_KEY) ?? '');

  readonly session = computed(() => this.sessionState());
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly token = computed(() => this.sessionState()?.token ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()));
  readonly modules = computed(() => this.moduleState());
  readonly menu = computed(() => this.menuState());
  readonly selectedModuleId = computed(() => this.selectedModuleIdState());

  setSession(session: AuthSession): void {
    this.sessionState.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  setModules(modules: ModuleAccessItem[]): void {
    this.moduleState.set(modules);
    localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
  }

  setSelectedModuleId(moduleId: string): void {
    this.selectedModuleIdState.set(moduleId);
    if (moduleId) {
      localStorage.setItem(SELECTED_MODULE_KEY, moduleId);
    } else {
      localStorage.removeItem(SELECTED_MODULE_KEY);
    }
  }

  setMenu(menu: MenuNode[]): void {
    this.menuState.set(menu);
    localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  }

  clearMenu(): void {
    this.menuState.set([]);
    localStorage.removeItem(MENU_KEY);
  }

  clear(): void {
    this.sessionState.set(null);
    this.moduleState.set([]);
    this.menuState.set([]);
    this.selectedModuleIdState.set('');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MODULES_KEY);
    localStorage.removeItem(MENU_KEY);
    localStorage.removeItem(SELECTED_MODULE_KEY);
  }
}

function readJson<T>(key: string): T | null {
  const value = localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
