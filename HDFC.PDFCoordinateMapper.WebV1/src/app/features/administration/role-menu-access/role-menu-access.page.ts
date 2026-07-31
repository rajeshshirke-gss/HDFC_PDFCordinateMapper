import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';

import { ModuleMasterRecord } from './role-menu-access.models';
import { RoleMenuAccessStore } from './role-menu-access.store';

@Component({
  selector: 'app-role-menu-access-page',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular
  ],
  template: `
    <section class="module-master-page">
      <header class="page-header">
        <div>
          <!-- <p class="breadcrumb">Administration / Module Management</p> -->
          <div class="title-row">
            <h1>Module Master</h1>
            <!-- <span class="count-pill">{{ store.modules().length }} modules</span> -->
          </div>
        </div>
      </header>

      <div class="message-strip">
        @if (store.errorMessage()) {
          <p class="alert error">{{ store.errorMessage() }}</p>
        }
      </div>

      <div class="workspace">
        <div class="grid-shell ag-theme-quartz">
          <ag-grid-angular
            [rowData]="store.modules()"
            [columnDefs]="columnDefs()"
            [defaultColDef]="defaultColDef"
            [pagination]="true"
            [paginationPageSize]="25"
            [paginationPageSizeSelector]="[10, 25, 50, 100]"
            [quickFilterText]="store.quickSearch()"
            (gridReady)="onGridReady($event)"
          />
          @if (!store.loading() && store.modules().length === 0) {
            <div class="empty-state">No module records returned by ModuleMaster_IUDS.</div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-master-page {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 10px;
      height: calc(100vh - 100px);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .page-header,
    .title-row {
      display: flex;
      align-items: center;
    }

    .page-header {
      justify-content: space-between;
      gap: 20px;
      min-height: 66px;
      padding: 10px 0 12px;
    }

    .title-row {
      gap: 20px;
      min-width: 0;
    }

    .breadcrumb {
      margin: 0;
      color: var(--app-muted);
      font-size: 13px;
    }

    h1 {
      margin: 0;
      color: var(--app-heading);
      font-weight: 700;
      line-height: 1.2;
      min-width: max-content;
      padding-right: 4px;
    }

    h1 {
      font-size: 24px;
    }

    .alert { margin: 0; padding: 10px 12px; border-left: 3px solid var(--mat-sys-tertiary); background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); font-size: 13px; font-weight: 600; }

    .message-strip {
      min-height: 0;
    }

    .workspace {
      display: grid;
      min-height: 0;
      overflow: hidden;
    }

    .grid-shell {
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 6px;
      background: var(--app-surface);
      position: relative;
      width: 100%;
      height: 100%;
    }

    .empty-state {
      position: absolute;
      inset: 88px 16px auto;
      color: var(--app-muted);
      text-align: center;
    }

    ag-grid-angular {
      display: block;
      width: 100%;
      height: 100%;
    }

  `]
})
export class RoleMenuAccessPage implements OnInit {
  readonly store = inject(RoleMenuAccessStore);
  private readonly gridApi = signal<GridApi<ModuleMasterRecord> | null>(null);

  readonly columnDefs = computed<ColDef<ModuleMasterRecord>[]>(() => buildColumnDefs(this.store.modules()));
  readonly defaultColDef: ColDef<ModuleMasterRecord> = { sortable: true, filter: 'agTextColumnFilter', floatingFilter: true, resizable: true };

  ngOnInit(): void {
    this.store.loadInitialData();
  }

  onGridReady(event: GridReadyEvent<ModuleMasterRecord>): void {
    this.gridApi.set(event.api);
  }
}

const hiddenResponseFields = new Set(['password']);

const headerLabels: Record<string, string> = {
  autoid: 'Auto ID',
  moduleid: 'Module ID',
  modulename: 'Module Name',
  description: 'Description',
  isactive: 'Active',
  link: 'Link',
  action: 'Action'
};

function buildColumnDefs(rows: ModuleMasterRecord[]): ColDef<ModuleMasterRecord>[] {
  const keys = orderedResponseKeys(rows);
  return keys.map((key) => ({
    headerName: headerFor(key),
    colId: key,
    flex: 1,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<ModuleMasterRecord>) => formatCellValue(data?.raw?.[key])
  }));
}

function orderedResponseKeys(rows: ModuleMasterRecord[]): string[] {
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
  const normalized = key.toLowerCase();
  return headerLabels[normalized] ?? key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  const normalized = key.toLowerCase();
  if (/description|link|url|action/.test(normalized)) return 220;
  if (/date|created|modified|approved/.test(normalized)) return 180;
  return 140;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
