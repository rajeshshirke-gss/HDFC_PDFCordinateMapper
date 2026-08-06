import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { take } from 'rxjs';

import { MasterImportStore } from './master-import.store';
import { MasterImportLogDialog } from './master-import-log.dialog';

@Component({
  selector: 'app-master-import-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, AgGridAngular],
  template: `
    <section class="master-import-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">PDF Coordinate Mapper</p>
          <h1>{{ store.selectedMaster()?.name || 'Master Import' }}</h1>
        </div>

        <div class="header-actions">
          <button mat-stroked-button type="button" [disabled]="!store.selectedMasterKey() || store.logsLoading() || store.importing()" (click)="viewLog()">
            <mat-icon>history</mat-icon>
            View Log
          </button>

          <button mat-flat-button color="primary" class="app-primary-button" type="button" [disabled]="store.loading() || store.importing()" (click)="refresh()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>

          <button mat-flat-button color="primary" class="app-primary-button" type="button" [disabled]="!store.selectedMasterKey() || store.importing()" (click)="importSelected()">
            <mat-icon>download</mat-icon>
            Import
          </button>

          <button mat-stroked-button type="button" [disabled]="store.importing()" (click)="importAll()">
            <mat-icon>sync</mat-icon>
            Import All
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
          [rowData]="store.rows()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
        />
        @if (!store.loading() && store.rows().length === 0) {
          <div class="empty-state">No imported records found.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .master-import-page {
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
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 10px 0 12px;
    }

    .eyebrow {
      margin: 0 0 4px;
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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
  `]
})
export class MasterImportPage implements OnInit {
  readonly store = inject(MasterImportStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly defaultColDef: ColDef<Record<string, unknown>> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };
  readonly columnDefs = computed<ColDef<Record<string, unknown>>[]>(() => buildColumnDefs(this.store.rows()));

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const routeMasterKey = params.get('masterKey') || this.route.snapshot.data['masterKey'] || 'AMC';
      this.store.loadMasters(routeMasterKey);
    });
  }

  refresh(): void {
    this.store.loadData();
  }

  viewLog(): void {
    this.store.loadImportLogs().pipe(take(1)).subscribe({
      next: (rows) => {
        this.dialog.open(MasterImportLogDialog, {
          width: '860px',
          maxWidth: '92vw',
          data: {
            masterName: this.store.selectedMaster()?.name || 'Master',
            rows
          }
        });
      }
    });
  }

  importSelected(): void {
    this.store.importSelected();
  }

  importAll(): void {
    this.store.importAll();
  }
}

function buildColumnDefs(rows: Record<string, unknown>[]): ColDef<Record<string, unknown>>[] {
  return orderedKeys(rows).map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<Record<string, unknown>>) => formatCellValue(data?.[key])
  }));
}

function orderedKeys(rows: Record<string, unknown>[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue;
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
  const normalized = key.toLowerCase();
  if (/name|description|address|remark/.test(normalized)) return 220;
  if (/date|time/.test(normalized)) return 180;
  return 140;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
