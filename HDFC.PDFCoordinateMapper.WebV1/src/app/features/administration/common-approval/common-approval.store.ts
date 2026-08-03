import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { ApprovalDecision, ApprovalDetailRecord, ApprovalMasterOption, ApprovalSummaryRecord, RoleModuleMappingRecord } from './common-approval.models';
import { CommonApprovalApiService } from './common-approval-api.service';

@Injectable({ providedIn: 'root' })
export class CommonApprovalStore {
  private readonly api = inject(CommonApprovalApiService);
  private readonly authStore = inject(AuthStore);

  private readonly mastersState = signal<ApprovalMasterOption[]>([]);
  private readonly selectedMasterState = signal<ApprovalMasterOption | null>(null);
  private readonly pendingState = signal<ApprovalSummaryRecord[]>([]);
  private readonly selectedSummaryState = signal<ApprovalSummaryRecord | null>(null);
  private readonly detailsState = signal<ApprovalDetailRecord[]>([]);
  private readonly mappingState = signal<RoleModuleMappingRecord[]>([]);
  private readonly loadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly mappingLoadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorState = signal('');
  private readonly lastMessageState = signal('');
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  readonly masters = computed(() => this.mastersState());
  readonly selectedMaster = computed(() => this.selectedMasterState());
  readonly pending = computed(() => this.pendingState());
  readonly selectedSummary = computed(() => this.selectedSummaryState());
  readonly details = computed(() => this.detailsState());
  readonly mapping = computed(() => this.mappingState());
  readonly loading = computed(() => this.loadingState());
  readonly detailLoading = computed(() => this.detailLoadingState());
  readonly mappingLoading = computed(() => this.mappingLoadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorState());
  readonly lastMessage = computed(() => this.lastMessageState());
  readonly selectedDecisionCount = computed(() => this.detailsState().filter((row) => row.decision).length);

  loadMasters(): void {
    this.loadingState.set(true);
    this.errorState.set('');
    this.api.loadMasters().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (masters) => this.mastersState.set(masters),
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  setSelectedMaster(masterId: string): void {
    const master = this.mastersState().find((item) => item.id === masterId || item.name === masterId) ?? null;
    this.selectedMasterState.set(master);
    this.loadPending();
  }

  loadPending(): void {
    this.loadingState.set(true);
    this.errorState.set('');
    this.api.loadPending(this.currentUser(), this.selectedMasterState()).pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (rows) => this.pendingState.set(rows),
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  loadDetails(summary: ApprovalSummaryRecord): void {
    this.selectedSummaryState.set(summary);
    this.detailLoadingState.set(true);
    this.errorState.set('');
    this.api.loadDetails(summary, this.currentUser()).pipe(finalize(() => this.detailLoadingState.set(false))).subscribe({
      next: (rows) => this.detailsState.set(rows),
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  setDetailDecision(autoId: string, decision: ApprovalDecision): void {
    this.detailsState.update((rows) => rows.map((row) => row.autoId === autoId ? { ...row, decision } : row));
  }

  setFilteredDecision(autoIds: string[], decision: ApprovalDecision): void {
    const ids = new Set(autoIds);
    this.detailsState.update((rows) => rows.map((row) => ids.has(row.autoId) ? { ...row, decision } : row));
  }

  clearDecisions(): void {
    this.detailsState.update((rows) => rows.map((row) => ({ ...row, decision: '' })));
  }

  submitDecisions(onSuccess: () => void): void {
    const summary = this.selectedSummaryState();
    if (!summary) {
      this.setErrorMessage('Select a pending approval record first.');
      return;
    }

    if (!this.selectedDecisionCount()) {
      this.setErrorMessage('Select at least one approve or reject decision.');
      return;
    }

    this.submittingState.set(true);
    this.errorState.set('');
    this.lastMessageState.set('');
    this.api.submitDecisions(this.detailsState(), summary, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (results) => {
        this.setLastMessage(results.map((result) => result.message).filter(Boolean).join(' ') || 'Approval decision submitted.');
        this.loadPending();
        this.loadDetails(summary);
        onSuccess();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  loadRoleModuleMapping(record: ApprovalSummaryRecord | ApprovalDetailRecord): void {
    this.mappingLoadingState.set(true);
    this.errorState.set('');
    this.mappingState.set([]);
    this.api.loadRoleModuleMapping(record, this.currentUser()).pipe(finalize(() => this.mappingLoadingState.set(false))).subscribe({
      next: (rows) => this.mappingState.set(rows),
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  clearDetail(): void {
    this.selectedSummaryState.set(null);
    this.detailsState.set([]);
  }

  clearMapping(): void {
    this.mappingState.set([]);
    this.mappingLoadingState.set(false);
  }

  clearMessages(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    this.errorState.set('');
    this.lastMessageState.set('');
  }

  private setErrorMessage(message: string): void {
    this.errorState.set(message);
    this.lastMessageState.set('');
    this.scheduleMessageClear(message, 'error');
  }

  private setLastMessage(message: string): void {
    this.lastMessageState.set(message);
    this.errorState.set('');
    this.scheduleMessageClear(message, 'success');
  }

  private scheduleMessageClear(message: string, type: 'error' | 'success'): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messageTimer = setTimeout(() => {
      if (type === 'error' && this.errorState() === message) {
        this.errorState.set('');
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
