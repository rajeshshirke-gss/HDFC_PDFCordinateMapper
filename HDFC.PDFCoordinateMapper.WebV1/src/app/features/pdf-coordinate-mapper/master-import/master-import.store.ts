import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { MasterImportApiService } from './master-import-api.service';
import { MasterImportLogRow, MasterImportOption, MasterImportResult } from './master-import.models';

@Injectable({ providedIn: 'root' })
export class MasterImportStore {
  private readonly api = inject(MasterImportApiService);
  private readonly authStore = inject(AuthStore);

  private readonly mastersState = signal<MasterImportOption[]>([]);
  private readonly selectedMasterKeyState = signal('');
  private readonly rowsState = signal<Record<string, unknown>[]>([]);
  private readonly logRowsState = signal<MasterImportLogRow[]>([]);
  private readonly loadingState = signal(false);
  private readonly logsLoadingState = signal(false);
  private readonly importingState = signal(false);
  private readonly errorMessageState = signal('');
  private readonly lastMessageState = signal('');
  private readonly lastResultsState = signal<MasterImportResult[]>([]);

  readonly masters = computed(() => this.mastersState());
  readonly selectedMasterKey = computed(() => this.selectedMasterKeyState());
  readonly rows = computed(() => this.rowsState());
  readonly logRows = computed(() => this.logRowsState());
  readonly loading = computed(() => this.loadingState());
  readonly logsLoading = computed(() => this.logsLoadingState());
  readonly importing = computed(() => this.importingState());
  readonly errorMessage = computed(() => this.errorMessageState());
  readonly lastMessage = computed(() => this.lastMessageState());
  readonly lastResults = computed(() => this.lastResultsState());
  readonly selectedMaster = computed(() => this.mastersState().find((master) => sameKey(master.key, this.selectedMasterKeyState())) || null);

  loadMasters(initialKey: string | null | undefined): void {
    this.loadingState.set(true);
    this.clearMessages();
    this.api.loadMasters().pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (masters) => {
        this.mastersState.set(masters);
        const selected = masters.find((master) => sameKey(master.key, initialKey)) || masters[0] || null;
        if (selected) {
          this.selectMaster(selected.key);
        }
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  selectMaster(masterKey: string | null | undefined): void {
    if (!masterKey) return;
    this.selectedMasterKeyState.set(masterKey);
    this.loadData();
  }

  loadData(): void {
    const masterKey = this.selectedMasterKeyState();
    if (!masterKey) return;

    this.loadingState.set(true);
    this.clearMessages();
    this.api.loadData(masterKey).pipe(finalize(() => this.loadingState.set(false))).subscribe({
      next: (rows) => this.rowsState.set(rows),
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  importSelected(): void {
    const masterKey = this.selectedMasterKeyState();
    if (!masterKey) return;

    this.importingState.set(true);
    this.clearMessages();
    this.api.importMaster(masterKey, this.currentUser()).pipe(finalize(() => this.importingState.set(false))).subscribe({
      next: (result) => {
        this.lastResultsState.set([result]);
        this.lastMessageState.set(result.message);
        this.loadData();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  importAll(): void {
    this.importingState.set(true);
    this.clearMessages();
    this.api.importAll(this.currentUser()).pipe(finalize(() => this.importingState.set(false))).subscribe({
      next: (results) => {
        this.lastResultsState.set(results);
        this.lastMessageState.set(results.map((result) => result.message).join(' '));
        this.loadData();
      },
      error: (error: Error) => this.errorMessageState.set(error.message)
    });
  }

  loadImportLogs(): Observable<MasterImportLogRow[]> {
    const masterKey = this.selectedMasterKeyState();
    this.logsLoadingState.set(true);
    this.clearMessages();

    return this.api.loadImportLogs(masterKey).pipe(
      tap({
        next: (rows) => this.logRowsState.set(rows),
        error: (error: Error) => this.errorMessageState.set(error.message)
      }),
      finalize(() => this.logsLoadingState.set(false))
    );
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

function sameKey(left: string | null | undefined, right: string | null | undefined): boolean {
  const leftKey = (left || '').trim().toLowerCase();
  const rightKey = (right || '').trim().toLowerCase();
  return !!leftKey && !!rightKey && leftKey === rightKey;
}
