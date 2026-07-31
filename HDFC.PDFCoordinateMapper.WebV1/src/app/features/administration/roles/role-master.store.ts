import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { RoleMasterApiService } from './role-master-api.service';
import { RoleMasterFormValue, RoleMasterMenuRow, RoleMasterRecord, RoleMasterView } from './role-master.models';

@Injectable({ providedIn: 'root' })
export class RoleMasterStore {
  private readonly api = inject(RoleMasterApiService);
  private readonly authStore = inject(AuthStore);

  private readonly rolesState = signal<RoleMasterRecord[]>([]);
  private readonly approvedRolesState = signal<RoleMasterRecord[]>([]);
  private readonly activeViewState = signal<RoleMasterView>('all');
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');
  private readonly roleMenuRowsState = signal<RoleMasterMenuRow[]>([]);
  private readonly roleMenuLoadingState = signal(false);
  private readonly roleMenuErrorState = signal('');

  readonly activeView = computed(() => this.activeViewState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());
  readonly activeRows = computed(() => this.activeViewState() === 'approved' ? this.approvedRolesState() : this.rolesState());
  readonly roleMenuRows = computed(() => this.roleMenuRowsState());
  readonly roleMenuLoading = computed(() => this.roleMenuLoadingState());
  readonly roleMenuError = computed(() => this.roleMenuErrorState());
  readonly selectedRoleMenuAccess = computed(() => this.roleMenuRowsState()
    .filter((row) => row.selected)
    .map((row) => row.menuAccessId)
    .filter(isMenuId)
    .join(','));

  loadRoles(): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');
    this.api.loadRoles().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (snapshot) => {
        this.rolesState.set(snapshot.allRoles);
        this.approvedRolesState.set(snapshot.approvedRoles);
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  setActiveView(view: RoleMasterView): void {
    this.activeViewState.set(view);
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  createRole(value: RoleMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();
    this.api.createRole(value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadRoles();
        onSuccess();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  updateRole(record: RoleMasterRecord, value: RoleMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();
    this.api.updateRole(record, value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadRoles();
        onSuccess();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  deleteRole(record: RoleMasterRecord): void {
    this.submittingState.set(true);
    this.clearMessages();
    this.api.deleteRole(record, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadRoles();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  loadRoleMenus(record: RoleMasterRecord | null, menuAccess: string): void {
    this.roleMenuLoadingState.set(true);
    this.roleMenuErrorState.set('');
    this.roleMenuRowsState.set([]);
    this.api.loadMenuRows(this.currentUser(), record, menuAccess).pipe(finalize(() => this.roleMenuLoadingState.set(false))).subscribe({
      next: (rows) => this.roleMenuRowsState.set(rows),
      error: (error: Error) => this.roleMenuErrorState.set(error.message)
    });
  }

  toggleRoleMenu(menuId: string): void {
    this.roleMenuRowsState.update((rows) => rows.map((row) => row.menuId === menuId ? { ...row, selected: !row.selected } : row));
  }

  setAllRoleMenus(selected: boolean): void {
    this.roleMenuRowsState.update((rows) => rows.map((row) => ({ ...row, selected })));
  }

  setRoleMenusSelected(menuIds: string[], selected: boolean): void {
    const selectedIds = new Set(menuIds);
    this.roleMenuRowsState.update((rows) => rows.map((row) => selectedIds.has(row.menuId) ? { ...row, selected } : row));
  }

  clearRoleMenus(): void {
    this.roleMenuRowsState.set([]);
    this.roleMenuErrorState.set('');
    this.roleMenuLoadingState.set(false);
  }

  clearMessages(): void {
    this.errorMessageState.set('');
    this.lastMessageState.set('');
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}

function isMenuId(value: string): boolean {
  return /^\d+(?:\.0)?$/.test(value);
}
