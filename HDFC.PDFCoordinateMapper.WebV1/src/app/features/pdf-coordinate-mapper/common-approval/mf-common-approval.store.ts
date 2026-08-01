import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { MfCommonApprovalApiService } from './mf-common-approval-api.service';
import { MfCommonApprovalDetail, MfCommonApprovalRecord } from './mf-common-approval.models';

@Injectable({ providedIn: 'root' })
export class MfCommonApprovalStore {
  private readonly api = inject(MfCommonApprovalApiService);
  private readonly authStore = inject(AuthStore);

  private readonly pendingState = signal<MfCommonApprovalRecord[]>([]);
  private readonly mastersState = signal<string[]>([]);
  private readonly selectedMasterState = signal('');
  private readonly detailsState = signal<MfCommonApprovalDetail[]>([]);
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');

  readonly pending = computed(() => this.pendingState());
  readonly masters = computed(() => this.mastersState());
  readonly selectedMaster = computed(() => this.selectedMasterState());
  readonly details = computed(() => this.detailsState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly detailLoading = computed(() => this.detailLoadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());

  loadMasters(): void {
    this.api.loadMasters().subscribe({
      next: (masters) => this.mastersState.set(masters),
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  loadPending(): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');

    this.api.loadPending(this.selectedMasterState(), this.currentUser()).pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (rows) => this.pendingState.set(rows),
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  setSelectedMaster(masterName: string): void {
    this.selectedMasterState.set(masterName);
    this.loadPending();
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  loadDetails(record: MfCommonApprovalRecord): void {
    this.detailLoadingState.set(true);
    this.errorMessageState.set('');
    this.detailsState.set([]);

    this.api.loadDetails(record, this.currentUser()).pipe(finalize(() => this.detailLoadingState.set(false))).subscribe({
      next: (details) => this.detailsState.set(details),
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  approve(record: MfCommonApprovalRecord, remark: string, onSuccess: () => void): void {
    this.submitDecision('approve', record, remark, onSuccess);
  }

  reject(record: MfCommonApprovalRecord, remark: string, onSuccess: () => void): void {
    this.submitDecision('reject', record, remark, onSuccess);
  }

  clearDetails(): void {
    this.detailsState.set([]);
  }

  clearMessages(): void {
    this.errorMessageState.set('');
    this.lastMessageState.set('');
  }

  private submitDecision(action: 'approve' | 'reject', record: MfCommonApprovalRecord, remark: string, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    const request = action === 'approve'
      ? this.api.approve(record, remark, this.currentUser())
      : this.api.reject(record, remark, this.currentUser());

    request.pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadPending();
        onSuccess();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}
