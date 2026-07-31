import { Injectable, computed, inject, signal } from '@angular/core';

import { MenuNode } from '../../../core/auth/auth.models';
import { AuthStore } from '../../../core/auth/auth.store';
import { ModuleMasterRecord, RoleAccessOption } from './role-menu-access.models';
import { RoleMenuAccessApiService } from './role-menu-access-api.service';

@Injectable({ providedIn: 'root' })
export class RoleMenuAccessStore {
  private readonly api = inject(RoleMenuAccessApiService);
  private readonly authStore = inject(AuthStore);

  private readonly modulesState = signal<ModuleMasterRecord[]>([]);
  private readonly rolesState = signal<RoleAccessOption[]>([]);
  private readonly selectedModuleState = signal<ModuleMasterRecord | null>(null);
  private readonly selectedRoleIdState = signal('');
  private readonly menuState = signal<MenuNode[]>([]);
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly menuLoadingState = signal(false);
  private readonly errorState = signal('');

  readonly modules = computed(() => this.modulesState());
  readonly roles = computed(() => this.rolesState());
  readonly selectedModule = computed(() => this.selectedModuleState());
  readonly selectedRoleId = computed(() => this.selectedRoleIdState());
  readonly menu = computed(() => this.menuState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly menuLoading = computed(() => this.menuLoadingState());
  readonly errorMessage = computed(() => this.errorState());

  loadInitialData(): void {
    this.loadingState.set(true);
    this.errorState.set('');
    this.api.loadInitialData(this.currentUser()).subscribe({
      next: (snapshot) => {
        this.modulesState.set(snapshot.modules);
        this.rolesState.set(snapshot.roles);
        this.selectedRoleIdState.set(this.selectedRoleIdState() || snapshot.roles[0]?.roleId || snapshot.roles[0]?.roleCode || '');
        this.loadingState.set(false);
      },
      error: (error: Error) => {
        this.errorState.set(error.message);
        this.loadingState.set(false);
      }
    });
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  setSelectedRole(roleId: string): void {
    this.selectedRoleIdState.set(roleId);
    this.menuState.set([]);
  }

  selectModule(module: ModuleMasterRecord): void {
    const moduleId = module.moduleId || module.autoId;
    if (!moduleId) {
      this.errorState.set('Selected module does not contain a module id.');
      return;
    }

    this.selectedModuleState.set(module);
    this.menuState.set([]);
    this.menuLoadingState.set(true);
    this.errorState.set('');
    this.api.loadMenu(this.selectedRoleId(), moduleId).subscribe({
      next: (menu) => {
        this.menuState.set(menu);
        this.menuLoadingState.set(false);
      },
      error: (error: Error) => {
        this.errorState.set(error.message);
        this.menuLoadingState.set(false);
      }
    });
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}
