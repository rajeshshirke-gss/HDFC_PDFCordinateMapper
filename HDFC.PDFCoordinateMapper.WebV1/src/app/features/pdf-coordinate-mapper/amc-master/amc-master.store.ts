import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { AmcMasterApiService } from './amc-master-api.service';
import { AmcMasterFormValue, AmcMasterRecord, AmcMasterView } from './amc-master.models';

@Injectable({ providedIn: 'root' })
export class AmcMasterStore {
  private readonly api = inject(AmcMasterApiService);
  private readonly authStore = inject(AuthStore);

  private readonly amcsState = signal<AmcMasterRecord[]>([]);
  private readonly approvedAmcsState = signal<AmcMasterRecord[]>([]);
  private readonly activeViewState = signal<AmcMasterView>('all');
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');

  readonly amcs = computed(() => this.amcsState());
  readonly approvedAmcs = computed(() => this.approvedAmcsState());
  readonly activeView = computed(() => this.activeViewState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());
  readonly activeRows = computed(() => this.activeViewState() === 'approved' ? this.approvedAmcsState() : this.amcsState());

  loadAmcs(): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');

    this.api.loadAmcs().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (snapshot) => {
        this.amcsState.set(snapshot.amcs);
        this.approvedAmcsState.set(snapshot.approvedAmcs);
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  setActiveView(view: AmcMasterView): void {
    this.activeViewState.set(view);
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  createAmc(value: AmcMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.createAmc(value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadAmcs();
        onSuccess();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  updateAmc(record: AmcMasterRecord, value: AmcMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.updateAmc(record, value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadAmcs();
        onSuccess();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  deleteAmc(record: AmcMasterRecord): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.deleteAmc(record, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.lastMessageState.set(result.message);
        this.loadAmcs();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
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
