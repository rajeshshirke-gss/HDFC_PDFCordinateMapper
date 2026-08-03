import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { UserMasterApiService } from './user-master-api.service';
import { UserActiveOption, UserMasterFormValue, UserMasterRecord, UserMasterView, UserRoleOption } from './user-master.models';

@Injectable({ providedIn: 'root' })
export class UserMasterStore {
  private readonly api = inject(UserMasterApiService);
  private readonly authStore = inject(AuthStore);

  private readonly usersState = signal<UserMasterRecord[]>([]);
  private readonly approvedUsersState = signal<UserMasterRecord[]>([]);
  private readonly rolesState = signal<UserRoleOption[]>([]);
  private readonly activeOptionsState = signal<UserActiveOption[]>([]);
  private readonly activeViewState = signal<UserMasterView>('all');
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly rolesLoadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  readonly users = computed(() => this.usersState());
  readonly approvedRecords = computed(() => this.approvedUsersState());
  readonly roles = computed(() => this.rolesState());
  readonly activeOptions = computed(() => this.activeOptionsState());
  readonly activeView = computed(() => this.activeViewState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly rolesLoading = computed(() => this.rolesLoadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());

  readonly allUsers = computed(() => this.usersState());
  readonly approvedUsers = computed(() => this.approvedUsersState());
  readonly deletedUsers = computed(() => this.usersState().filter((user) => user.approvalState === 'Deleted'));
  readonly pendingUsers = computed(() => this.usersState().filter((user) => user.approvalState === 'Pending'));
  readonly activeRows = computed(() => {
    const view = this.activeViewState();
    if (view === 'approved') return this.approvedUsers();
    if (view === 'deleted') return this.deletedUsers();
    if (view === 'pending') return this.pendingUsers();
    return this.allUsers();
  });

  loadUsers(): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');

    this.api.loadUsers().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (snapshot) => {
        this.usersState.set(snapshot.allUsers);
        this.approvedUsersState.set(snapshot.approvedUsers);
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  loadRoles(): void {
    this.rolesLoadingState.set(true);
    this.errorMessageState.set('');

    this.api.loadDropdownOptions().pipe(finalize(() => this.rolesLoadingState.set(false))).subscribe({
      next: (snapshot) => {
        this.rolesState.set(snapshot.roles);
        this.activeOptionsState.set(snapshot.activeOptions);
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  setActiveView(view: UserMasterView): void {
    this.activeViewState.set(view);
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  createUser(value: UserMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.createUser(value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadUsers();
        onSuccess();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  updateUser(record: UserMasterRecord, value: UserMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.updateUser(record, value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadUsers();
        onSuccess();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  deleteUser(record: UserMasterRecord): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.deleteUser(record, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadUsers();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  clearMessages(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    this.errorMessageState.set('');
    this.lastMessageState.set('');
  }

  private setErrorMessage(message: string): void {
    this.errorMessageState.set(message);
    this.lastMessageState.set('');
    this.scheduleMessageClear(message, 'error');
  }

  private setLastMessage(message: string): void {
    this.lastMessageState.set(message);
    this.errorMessageState.set('');
    this.scheduleMessageClear(message, 'success');
  }

  private scheduleMessageClear(message: string, type: 'error' | 'success'): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messageTimer = setTimeout(() => {
      if (type === 'error' && this.errorMessageState() === message) {
        this.errorMessageState.set('');
      }

      if (type === 'success' && this.lastMessageState() === message) {
        this.lastMessageState.set('');
      }

      this.messageTimer = null;
    }, 4000);
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}
