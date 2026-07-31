import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';
import { take } from 'rxjs';

import { ApprovalSummaryRecord } from './common-approval.models';
import { CommonApprovalStore } from './common-approval.store';
import { CommonApprovalDetailDialog } from './common-approval-detail.dialog';
import { RoleModuleMappingDialog } from './role-module-mapping.dialog';

@Component({
  selector: 'app-common-approval-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    AgGridAngular
  ],
  template: `
    <section class="approval-page">
      <header class="page-header">
        <div>
          <!-- <p class="breadcrumb">Administration / Master Authentication</p> -->
          <h1>Master Authentication</h1>
        </div>
        <!-- <div class="header-actions">
          <mat-form-field appearance="outline" class="master-select">
            <mat-label>Master</mat-label>
            <mat-select [ngModel]="store.selectedMaster()?.id || ''" (ngModelChange)="selectMaster($event)">
              <mat-option value="">All Masters</mat-option>
              @for (master of store.masters(); track master.id) {
                <mat-option [value]="master.id">{{ master.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-icon-button matTooltip="Refresh" aria-label="Refresh approvals" type="button" (click)="refresh()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div> -->
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
          [suppressCellFocus]="false"
          (gridReady)="onGridReady($event)"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && store.pending().length === 0) {
          <div class="empty-state">No pending records found.</div>
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

    .page-header {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: center;
      min-height: 66px;
      padding: 10px 0 12px;
    }

    .breadcrumb {
      margin: 0;
      color: var(--app-muted);
      font-size: 13px;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
      min-width: max-content;
      padding-right: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .master-select {
      width: 260px;
    }

    .message-strip {
      display: grid;
      gap: 8px;
      min-height: 0;
    }

    .alert {
      margin: 0;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
    }

    .alert.error { border-left: 3px solid var(--mat-sys-tertiary); background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .alert.success { border-left: 3px solid #16833a; background: #effaf2; color: #11612d; }

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

    :host ::ng-deep .grid-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      margin-right: 5px;
      border: 1px solid var(--app-grid-border);
      border-radius: 4px;
      background: var(--app-surface);
      color: var(--app-primary);
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }

    :host ::ng-deep .grid-action .material-icons {
      font-size: 18px;
      line-height: 18px;
    }

    @media (max-width: 760px) {
      .approval-page {
        height: auto;
        min-height: calc(100vh - 100px);
        overflow: visible;
      }

      .page-header,
      .header-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .master-select {
        width: 100%;
      }
    }
  `]
})
export class CommonApprovalPage implements OnInit {
  readonly store = inject(CommonApprovalStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly gridApi = signal<GridApi<ApprovalSummaryRecord> | null>(null);

  readonly defaultColDef: ColDef<ApprovalSummaryRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };

  readonly columnDefs = computed<ColDef<ApprovalSummaryRecord>[]>(() => buildColumnDefs(this.store.pending()));

  ngOnInit(): void {
    this.store.loadMasters();
    this.store.loadPending();
  }

  selectMaster(masterId: string): void {
    this.store.setSelectedMaster(masterId);
  }

  refresh(): void {
    this.store.loadPending();
  }

  onGridReady(event: GridReadyEvent<ApprovalSummaryRecord>): void {
    this.gridApi.set(event.api);
  }

  onCellClicked(event: CellClickedEvent<ApprovalSummaryRecord>): void {
    const action = (event.event?.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    if (!action || !event.data) {
      return;
    }

    if (action === 'view') {
      this.dialog.open(CommonApprovalDetailDialog, {
        width: '1120px',
        maxWidth: '96vw',
        disableClose: true,
        data: { summary: event.data }
      }).afterClosed().pipe(take(1)).subscribe(() => {
        this.refresh();
        if (this.store.lastMessage()) {
          this.snackBar.open(this.store.lastMessage(), 'Close', { duration: 5000 });
        }
      });
    }

    if (action === 'mapping') {
      this.dialog.open(RoleModuleMappingDialog, {
        width: '1080px',
        maxWidth: '96vw',
        data: { summary: event.data }
      });
    }
  }
}

const hiddenResponseFields = new Set(['password']);

function buildColumnDefs(rows: ApprovalSummaryRecord[]): ColDef<ApprovalSummaryRecord>[] {
  return [actionColumn(), ...orderedResponseKeys(rows).map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<ApprovalSummaryRecord>) => formatCellValue(data?.raw?.[key])
  }))];
}

function actionColumn(): ColDef<ApprovalSummaryRecord> {
  return {
    headerName: 'Actions',
    width: 116,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: () => `
      <button class="grid-action" data-action="view" title="View" aria-label="View">
        <span class="material-icons">visibility</span>
      </button>
      <button class="grid-action" data-action="mapping" title="Mapping" aria-label="Mapping">
        <span class="material-icons">account_tree</span>
      </button>
    `
  };
}

function orderedResponseKeys(rows: ApprovalSummaryRecord[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.raw)) {
      const normalized = key.toLowerCase();
      if (hiddenResponseFields.has(normalized) || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  if (/description|remark|action/i.test(key)) return 230;
  if (/date|created|modified/i.test(key)) return 180;
  if (/master|role|user/i.test(key)) return 160;
  return 130;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
