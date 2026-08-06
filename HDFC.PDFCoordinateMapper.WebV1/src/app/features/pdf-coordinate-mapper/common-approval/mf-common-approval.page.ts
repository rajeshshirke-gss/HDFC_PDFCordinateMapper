import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { filter, take } from 'rxjs';

import { MfCommonApprovalActionDialog } from './mf-common-approval-action.dialog';
import { MfCommonApprovalDetailDialog } from './mf-common-approval-detail.dialog';
import { MfCommonApprovalAction, MfCommonApprovalActionValue, MfCommonApprovalRecord } from './mf-common-approval.models';
import { MfCommonApprovalStore } from './mf-common-approval.store';

@Component({
  selector: 'app-mf-common-approval-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, AgGridAngular],
  template: `
    <section class="approval-page">
      <header class="page-header">
        <h1>PDF Module Common Approval</h1>
        <div class="header-actions">
          <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="refresh()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </header>

      <div class="message-strip">
        @if (store.errorMessage()) {
          <p class="alert error">{{ store.errorMessage() }}</p>
        }
        @if (store.lastMessage()) {
          <p class="alert success">{{ store.lastMessage() }}</p>
        }
      </div>

      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="store.pending()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
          [quickFilterText]="store.quickSearch()"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && store.pending().length === 0) {
          <div class="empty-state">No pending PDF module approvals found.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .approval-page {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 10px;
      height: calc(100vh - 100px);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .page-header,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-header {
      justify-content: space-between;
      min-height: 66px;
      padding: 10px 0 12px;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-size: 24px;
      font-weight: 700;
    }

    .message-strip {
      display: grid;
      gap: 8px;
      min-height: 0;
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
      gap: 6px;
      width: 100%;
      height: 100%;
      white-space: nowrap;
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

    :host ::ng-deep .grid-action[disabled] {
      opacity: 0.38;
      cursor: not-allowed;
      color: var(--app-muted);
    }

    :host ::ng-deep .grid-action.reject {
      color: #b42318;
    }

    :host ::ng-deep .grid-action.approve {
      color: #16833a;
    }

    :host ::ng-deep .grid-action .material-icons {
      font-size: 18px;
      line-height: 18px;
    }
  `]
})
export class MfCommonApprovalPage implements OnInit {
  readonly store = inject(MfCommonApprovalStore);

  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly defaultColDef: ColDef<MfCommonApprovalRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };
  readonly columnDefs = computed<ColDef<MfCommonApprovalRecord>[]>(() => buildColumnDefs(this.store.pending()));

  ngOnInit(): void {
    this.store.loadPending();
  }

  refresh(): void {
    this.store.loadPending();
  }

  onCellClicked(event: CellClickedEvent<MfCommonApprovalRecord>): void {
    const action = (event.event?.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) return;
    if (action === 'view') this.openDetails(record);
    if (action === 'preview') this.previewMapping(record);
    if (action === 'approve') this.openAction('approve', record);
    if (action === 'reject') this.openAction('reject', record);
  }

  private openDetails(record: MfCommonApprovalRecord): void {
    this.dialog.open(MfCommonApprovalDetailDialog, {
      width: '900px',
      maxWidth: '96vw',
      data: { record }
    });
  }

  private previewMapping(record: MfCommonApprovalRecord): void {
    if (record.masterName !== 'Template Mapping Master') return;
    const mappingId = record.tblAutoId || record.autoId;
    this.router.navigateByUrl(`/pdf-coordinate-mapper/template-mapping/${mappingId}/view`);
  }

  private openAction(action: MfCommonApprovalAction, record: MfCommonApprovalRecord): void {
    this.dialog.open(MfCommonApprovalActionDialog, {
      width: '600px',
      maxWidth: '96vw',
      data: { action, record }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe((value: MfCommonApprovalActionValue) => {
      const onSuccess = () => this.snackBar.open(this.store.lastMessage() || 'Approval decision submitted.', 'Close', { duration: 5000 });
      if (action === 'approve') {
        this.store.approve(record, value.remark, onSuccess);
      } else {
        this.store.reject(record, value.remark, onSuccess);
      }
    });
  }
}

const hiddenResponseFields = new Set(['commonapprovalid', 'tableautoid', 'autoid', 'autoid1', 'tblautoid']);

function buildColumnDefs(rows: MfCommonApprovalRecord[]): ColDef<MfCommonApprovalRecord>[] {
  return [actionColumn(), ...orderedResponseKeys(rows).map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<MfCommonApprovalRecord>) => formatCellValue(data?.raw?.[key])
  }))];
}

function orderedResponseKeys(rows: MfCommonApprovalRecord[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.raw)) {
      const normalized = normalizeKey(key);
      if (hiddenResponseFields.has(normalized) || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

function actionColumn(): ColDef<MfCommonApprovalRecord> {
  return {
    headerName: 'Actions',
    width: 184,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: ({ data }: ICellRendererParams<MfCommonApprovalRecord>) => {
      const previewDisabled = data?.masterName === 'Template Mapping Master' ? '' : ' disabled';
      return `
        <div class="grid-actions">
          <button class="grid-action approve" data-action="approve" title="Approve" aria-label="Approve"><span class="material-icons">check_circle</span></button>
          <button class="grid-action reject" data-action="reject" title="Reject" aria-label="Reject"><span class="material-icons">cancel</span></button>
          <button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button>
          <button class="grid-action" data-action="preview" title="Preview Mapping" aria-label="Preview Mapping"${previewDisabled}><span class="material-icons">preview</span></button>
        </div>
      `;
    }
  };
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  if (/description|remark|displayfield/i.test(key)) return 220;
  if (/date|created/i.test(key)) return 180;
  if (/master|action/i.test(key)) return 160;
  return 130;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}
