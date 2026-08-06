import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { TemplateMasterApiService } from './template-master-api.service';
import { TemplateMasterFormValue, TemplateMasterRecord, TemplateMasterView } from './template-master.models';

@Injectable({ providedIn: 'root' })
export class TemplateMasterStore {
  private readonly api = inject(TemplateMasterApiService);
  private readonly authStore = inject(AuthStore);

  private readonly templatesState = signal<TemplateMasterRecord[]>([]);
  private readonly approvedTemplatesState = signal<TemplateMasterRecord[]>([]);
  private readonly activeViewState = signal<TemplateMasterView>('all');
  private readonly quickSearchState = signal('');
  private readonly loadingState = signal(false);
  private readonly submittingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');
  private messageTimer: ReturnType<typeof setTimeout> | null = null;

  readonly templates = computed(() => this.templatesState());
  readonly approvedTemplates = computed(() => this.approvedTemplatesState());
  readonly activeView = computed(() => this.activeViewState());
  readonly quickSearch = computed(() => this.quickSearchState());
  readonly loading = computed(() => this.loadingState());
  readonly submitting = computed(() => this.submittingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());
  readonly activeRows = computed(() => this.activeViewState() === 'approved' ? this.approvedTemplatesState() : this.templatesState());

  loadTemplates(): void {
    this.loadingState.set(true);
    this.errorMessageState.set('');

    this.api.loadTemplates().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (snapshot) => {
        this.templatesState.set(snapshot.templates);
        this.approvedTemplatesState.set(snapshot.approvedTemplates);
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  setActiveView(view: TemplateMasterView): void {
    this.activeViewState.set(view);
  }

  setQuickSearch(value: string): void {
    this.quickSearchState.set(value);
  }

  createTemplate(value: TemplateMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.createTemplate(value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadTemplates();
        onSuccess();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  updateTemplate(record: TemplateMasterRecord, value: TemplateMasterFormValue, onSuccess: () => void): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.updateTemplate(record, value, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadTemplates();
        onSuccess();
      },
      error: (error: Error) => this.setErrorMessage(error.message)
    });
  }

  deleteTemplate(record: TemplateMasterRecord): void {
    this.submittingState.set(true);
    this.clearMessages();

    this.api.deleteTemplate(record, this.currentUser()).pipe(finalize(() => this.submittingState.set(false))).subscribe({
      next: (result) => {
        this.setLastMessage(result.message);
        this.loadTemplates();
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
