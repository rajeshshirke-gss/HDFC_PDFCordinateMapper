import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, ValueGetterParams } from 'ag-grid-community';
import { take } from 'rxjs';

import { AmcMasterFormDialog } from './amc-master-form.dialog';
import { AmcMasterRecord } from './amc-master.models';
import { AmcMasterStore } from './amc-master.store';

@Component({
  selector: 'app-amc-master-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTabsModule,
    AgGridAngular
  ],
  template: `
    <section class="amc-master-page">
      <header class="page-header">
        <div class="title-row">
          <h1>AMC Master</h1>
          <mat-tab-group class="view-tabs" [mat-stretch-tabs]="false" [fitInkBarToContent]="true" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectTab($event)">
            <mat-tab label="All"></mat-tab>
            <mat-tab label="Approved"></mat-tab>
          </mat-tab-group>
          <div class="header-actions">
            <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="refresh()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>
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
          [rowData]="activeRows()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
          [quickFilterText]="store.quickSearch()"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && activeRows().length === 0) {
          <div class="empty-state">No AMC records found for this view.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .amc-master-page {
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

    :host ::ng-deep .grid-action.delete {
      color: #b42318;
    }

    :host ::ng-deep .grid-action .material-icons {
      font-size: 18px;
      line-height: 18px;
    }
  `]
})
export class AmcMasterPage implements OnInit {
  readonly store = inject(AmcMasterStore);

  private readonly dialog = inject(MatDialog);

  readonly activeRows = computed(() => this.store.activeRows());
  readonly defaultColDef: ColDef<AmcMasterRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };
  readonly columnDefs = computed<ColDef<AmcMasterRecord>[]>(() => buildColumnDefs(this.activeRows()));

  ngOnInit(): void {
    this.store.loadAmcs();
  }

  selectedTabIndex(): number {
    return this.store.activeView() === 'approved' ? 1 : 0;
  }

  selectTab(index: number): void {
    this.store.setActiveView(index === 1 ? 'approved' : 'all');
  }

  refresh(): void {
    this.store.loadAmcs();
  }

  onCellClicked(event: CellClickedEvent<AmcMasterRecord>): void {
    const target = event.event?.target as HTMLElement | null;
    const action = target?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) return;
    if (action === 'view') this.openForm('view', record);
  }

  private openForm(mode: 'view', record: AmcMasterRecord | null): void {
    this.dialog.open(AmcMasterFormDialog, {
      width: '860px',
      maxWidth: '96vw',
      disableClose: mode !== 'view',
      data: { record }
    }).afterClosed().pipe(take(1)).subscribe();
  }
}

const hiddenResponseFields = new Set(['autoid', 'mst_col_id', 'mstcolid', 'common_approval_id', 'commonapprovalid']);

function buildColumnDefs(rows: AmcMasterRecord[]): ColDef<AmcMasterRecord>[] {
  return [actionColumn(), ...orderedResponseKeys(rows).map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<AmcMasterRecord>) => formatCellValue(data?.raw?.[key])
  }))];
}

function orderedResponseKeys(rows: AmcMasterRecord[]): string[] {
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

function actionColumn(): ColDef<AmcMasterRecord> {
  return {
    headerName: 'Actions',
    width: 84,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: () => `
      <button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button>
    `
  };
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  const normalized = key.toLowerCase();
  if (/name|description|remark/.test(normalized)) return 220;
  if (/date/.test(normalized)) return 180;
  return 140;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
