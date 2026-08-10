import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { filter, take } from 'rxjs';

import { AuthStore } from '../../../core/auth/auth.store';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { TemplateMappingApiService } from './template-mapping-api.service';
import { TemplateMappingRecord, TemplateMappingView } from './template-mapping.models';

@Component({
  selector: 'app-template-mapping-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, MatTabsModule, AgGridAngular],
  template: `
    <section class="mapping-page">
      <header class="page-header">
        <div class="title-row">
          <h1>Template Mapping Master</h1>
          <mat-tab-group class="view-tabs" [mat-stretch-tabs]="false" [fitInkBarToContent]="true" [selectedIndex]="activeView() === 'approved' ? 1 : 0" (selectedIndexChange)="selectTab($event)">
            <mat-tab label="All"></mat-tab>
            <mat-tab label="Approved"></mat-tab>
          </mat-tab-group>
          <div class="header-actions">
            <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="loadMappings()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
            <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="openCreate()">
              <mat-icon>add</mat-icon>
              Add Mapping
            </button>
          </div>
        </div>
      </header>

      <div class="message-strip">
        @if (errorMessage()) {
          <p class="alert error">{{ errorMessage() }}</p>
        }
        @if (lastMessage()) {
          <p class="alert success">{{ lastMessage() }}</p>
        }
      </div>

      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="activeRows()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!loading() && activeRows().length === 0) {
          <div class="empty-state">No template mappings found for this view.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .mapping-page {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 10px;
      height: calc(100vh - 100px);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .page-header {
      min-height: 66px;
      padding: 10px 0 12px;
    }

    .title-row,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }

    .alert {
      margin: 0;
      padding: 10px 12px;
      border-radius: calc(var(--app-control-radius) - 2px);
      font-size: 13px;
      font-weight: 600;
    }

    .alert.error {
      border-left: 3px solid var(--mat-sys-tertiary);
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .alert.success {
      border-left: 3px solid #16833a;
      background: #effaf2;
      color: #11612d;
    }

    .message-strip {
      display: grid;
      gap: 8px;
      min-height: 0;
    }

    .grid-shell {
      position: relative;
      min-height: 0;
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 6px;
    }

    ag-grid-angular {
      display: block;
      width: 100%;
      height: 100%;
    }

    .empty-state {
      position: absolute;
      inset: 88px 16px auto;
      padding: 16px;
      color: var(--app-muted);
      text-align: center;
    }

    :host ::ng-deep .grid-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      width: 100%;
      height: 100%;
    }

    :host ::ng-deep .grid-actions.single {
      justify-content: center;
    }

    :host ::ng-deep .grid-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: 1px solid var(--app-grid-border);
      border-radius: 4px;
      background: var(--app-surface);
      color: var(--app-primary);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    :host ::ng-deep .grid-action.delete {
      color: #b42318;
    }

    :host ::ng-deep .grid-action .material-icons {
      font-size: 18px;
      line-height: 18px;
    }
  `]
})
export class TemplateMappingPage implements OnInit {
  private readonly api = inject(TemplateMappingApiService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly mappings = signal<TemplateMappingRecord[]>([]);
  readonly approvedMappings = signal<TemplateMappingRecord[]>([]);
  readonly activeView = signal<TemplateMappingView>('all');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly lastMessage = signal('');
  readonly activeRows = computed(() => this.activeView() === 'approved' ? this.approvedMappings() : this.mappings());
  private messageTimer: ReturnType<typeof setTimeout> | null = null;
  readonly columnDefs = computed<ColDef<TemplateMappingRecord>[]>(() => [
    actionColumn(this.activeView()),
    { headerName: 'Mapping Code', field: 'mappingCode', minWidth: 160 },
    { headerName: 'Mapping Name', field: 'mappingName', minWidth: 220 },
    { headerName: 'Template', field: 'templateName', minWidth: 220 },
    { headerName: 'Fields', field: 'fieldCount', width: 110 },
    { headerName: 'Status', field: 'status', width: 120, valueFormatter: ({ value }) => formatStatus(value) },
    { headerName: 'Action', field: 'action', width: 130 },
    { headerName: 'Maker', field: 'createdBy', minWidth: 150 },
    { headerName: 'Created Date', field: 'createdDate', minWidth: 190 },
    { headerName: 'Modified By', field: 'modifiedBy', minWidth: 150 },
    { headerName: 'Modified Date', field: 'modifiedDate', minWidth: 190 },
    { headerName: 'Approved By', field: 'approvedBy', minWidth: 150 },
    { headerName: 'Approved Date', field: 'approvedDate', minWidth: 190 }
  ]);
  readonly defaultColDef: ColDef<TemplateMappingRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };

  ngOnInit(): void {
    const navigationMessage = String(history.state?.['message'] ?? '').trim();
    if (navigationMessage) {
      this.setLastMessage(navigationMessage);
    }

    this.loadMappings();
  }

  loadMappings(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.loadMappings().subscribe({
      next: (snapshot) => {
        this.mappings.set(snapshot.mappings);
        this.approvedMappings.set(snapshot.approvedMappings);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.setErrorMessage(error.message);
        this.loading.set(false);
      }
    });
  }

  selectTab(index: number): void {
    this.activeView.set(index === 1 ? 'approved' : 'all');
  }

  openCreate(): void {
    this.router.navigateByUrl('/pdf-coordinate-mapper/template-mapping/create');
  }

  onCellClicked(event: CellClickedEvent<TemplateMappingRecord>): void {
    const action = (event.event?.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) return;
    if (action === 'view') this.router.navigateByUrl(`/pdf-coordinate-mapper/template-mapping/${record.autoId}/view`);
    if (action === 'edit') this.router.navigateByUrl(`/pdf-coordinate-mapper/template-mapping/${record.autoId}/edit`);
    if (action === 'delete') this.confirmDelete(record);
  }

  private confirmDelete(record: TemplateMappingRecord): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Template Mapping',
        message: `Submit delete request for ${record.mappingName || record.mappingCode}?`,
        confirmText: 'Submit Delete',
        danger: true
      }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.api.deleteMapping(record, this.currentUser()).subscribe({
        next: (result) => {
          this.setLastMessage(result.message);
          this.snackBar.open(result.message, 'Close', { duration: 4000 });
          this.loadMappings();
        },
        error: (error: Error) => this.setErrorMessage(error.message)
      });
    });
  }

  private clearMessages(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
    this.errorMessage.set('');
    this.lastMessage.set('');
  }

  private setErrorMessage(message: string): void {
    this.errorMessage.set(message);
    this.lastMessage.set('');
    this.scheduleMessageClear(message, 'error');
  }

  private setLastMessage(message: string): void {
    this.lastMessage.set(message);
    this.errorMessage.set('');
    this.scheduleMessageClear(message, 'success');
  }

  private scheduleMessageClear(message: string, type: 'error' | 'success'): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messageTimer = setTimeout(() => {
      if (type === 'error' && this.errorMessage() === message) {
        this.errorMessage.set('');
      }

      if (type === 'success' && this.lastMessage() === message) {
        this.lastMessage.set('');
      }

      this.messageTimer = null;
    }, 4000);
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}

function actionColumn(view: TemplateMappingView): ColDef<TemplateMappingRecord> {
  return {
    headerName: 'Actions',
    width: view === 'approved' ? 96 : 136,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: () => view === 'approved'
      ? `<div class="grid-actions single"><button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button></div>`
      : `
        <div class="grid-actions">
          <button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button>
          <button class="grid-action" data-action="edit" title="Edit" aria-label="Edit"><span class="material-icons">edit</span></button>
          <button class="grid-action delete" data-action="delete" title="Delete" aria-label="Delete"><span class="material-icons">delete</span></button>
        </div>
      `
  };
}

function formatStatus(value: unknown): string {
  const status = String(value ?? '').trim();
  if (status === '0') return 'Pending';
  if (status === '1') return 'Approved';
  if (status === '2') return 'Rejected';
  return status;
}
