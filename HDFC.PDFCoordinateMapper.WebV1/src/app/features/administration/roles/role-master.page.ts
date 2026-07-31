import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';
import { filter, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { RoleMasterFormDialog } from './role-master-form.dialog';
import { RoleMasterFormValue, RoleMasterRecord, RoleMasterView } from './role-master.models';
import { RoleMasterStore } from './role-master.store';

@Component({
  selector: 'app-role-master-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatSnackBarModule, MatTabsModule, MatTooltipModule, AgGridAngular],
  template: `
    <section class="role-master-page">
      <header class="page-header">
        <div>
          <!-- <p class="breadcrumb">Administration / Role Management</p> -->
          <div class="title-row">
            <h1>Roles</h1>
            <mat-tab-group class="view-tabs" [mat-stretch-tabs]="false" [fitInkBarToContent]="true" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectTab($event)">
              <mat-tab label="All"></mat-tab>
              <mat-tab label="Approved"></mat-tab>
            </mat-tab-group>
            <div class="header-actions inline-actions">
              <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="refresh()">
                <mat-icon>refresh</mat-icon>Refresh
              </button>

              <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="openCreate()">
                <mat-icon>admin_panel_settings</mat-icon>
                Add Role
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="message-strip">
        @if (store.errorMessage()) { <p class="alert error">{{ store.errorMessage() }}</p> }
        @if (store.lastMessage()) { <p class="alert success">{{ store.lastMessage() }}</p> }
      </div>

      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="activeRows()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
          [quickFilterText]="quickSearch()"
          (gridReady)="onGridReady($event)"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && activeRows().length === 0) {
          <div class="empty-state">No roles found for this view.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .role-master-page {
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
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      min-height: 66px;
      padding: 10px 0 12px;
    }

    .title-row,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 20px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .inline-actions {
      margin-left: 2px;
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
export class RoleMasterPage implements OnInit {
  readonly store = inject(RoleMasterStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly gridApi = signal<GridApi<RoleMasterRecord> | null>(null);

  readonly quickSearch = computed(() => this.store.quickSearch());
  readonly activeRows = computed(() => this.store.activeRows());
  readonly columnDefs = computed<ColDef<RoleMasterRecord>[]>(() => buildColumnDefs(this.activeRows()));
  readonly defaultColDef: ColDef<RoleMasterRecord> = { sortable: true, filter: 'agTextColumnFilter', floatingFilter: true, resizable: true };

  ngOnInit(): void {
    this.store.loadRoles();
  }

  selectedTabIndex(): number {
    return (['all', 'approved'] as RoleMasterView[]).indexOf(this.store.activeView());
  }

  selectTab(index: number): void {
    this.store.setActiveView((['all', 'approved'] as RoleMasterView[])[index] ?? 'all');
  }

  refresh(): void {
    this.store.loadRoles();
  }

  onGridReady(event: GridReadyEvent<RoleMasterRecord>): void {
    this.gridApi.set(event.api);
  }

  onCellClicked(event: CellClickedEvent<RoleMasterRecord>): void {
    const target = event.event?.target as HTMLElement | null;
    const action = target?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) return;
    if (action === 'view') this.openView(record);
    if (action === 'edit') this.openEdit(record);
    if (action === 'delete') this.confirmDelete(record);
  }

  openCreate(): void {
    this.openForm('create', null);
  }

  openView(record: RoleMasterRecord): void {
    this.openForm('view', record);
  }

  openEdit(record: RoleMasterRecord): void {
    this.openForm('edit', record);
  }

  confirmDelete(record: RoleMasterRecord): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Role',
        message: `Submit delete request for ${record.roleName || record.roleCode}?`,
        confirmText: 'Submit Delete',
        danger: true
      }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.deleteRole(record);
      this.snackBar.open('Delete request submitted.', 'Close', { duration: 5000 });
    });
  }

  private openForm(mode: 'create' | 'edit' | 'view', record: RoleMasterRecord | null): void {
    const dialogRef = this.dialog.open(RoleMasterFormDialog, {
      width: '1040px',
      maxWidth: '98vw',
      height: '82vh',
      disableClose: mode !== 'view',
      data: { mode, record, submitting: this.store.submitting() }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((value?: RoleMasterFormValue) => {
      if (!value || mode === 'view') return;
      const message = mode === 'create' ? `Submit role ${value.roleCode} for approval?` : `Submit update for role ${record?.roleCode}?`;
      this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: { title: mode === 'create' ? 'Create Role' : 'Update Role', message, confirmText: mode === 'create' ? 'Submit' : 'Submit Update' }
      }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
        const onSuccess = () => this.snackBar.open(this.store.lastMessage() || 'Role request submitted.', 'Close', { duration: 5000 });
        if (mode === 'create') this.store.createRole(value, onSuccess);
        else if (record) this.store.updateRole(record, value, onSuccess);
      });
    });
  }
}

const hiddenResponseFields = new Set(['password']);

const headerLabels: Record<string, string> = {
  autoid: 'Auto ID',
  rolecode: 'Role Code',
  rolename: 'Role Name',
  description: 'Description',
  menuaccess: 'Menu Access',
  isactive: 'Active',
  createdby: 'Created By',
  createddate: 'Created Date',
  action: 'Action'
};

function buildColumnDefs(rows: RoleMasterRecord[]): ColDef<RoleMasterRecord>[] {
  const keys = orderedResponseKeys(rows);
  return [actionColumn(), ...keys.map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<RoleMasterRecord>) => formatCellValue(data?.raw?.[key])
  }))];
}

function orderedResponseKeys(rows: RoleMasterRecord[]): string[] {
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

function actionColumn(): ColDef<RoleMasterRecord> {
  return {
    headerName: 'Actions',
    width: 150,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: () => `
      <button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button>
      <button class="grid-action" data-action="edit" title="Edit" aria-label="Edit"><span class="material-icons">edit</span></button>
      <button class="grid-action delete" data-action="delete" title="Delete" aria-label="Delete"><span class="material-icons">delete</span></button>
    `
  };
}

function headerFor(key: string): string {
  const normalized = key.toLowerCase();
  return headerLabels[normalized] ?? key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  const normalized = key.toLowerCase();
  if (/description|menuaccess|action/.test(normalized)) return 220;
  if (/date|created|modified|approved/.test(normalized)) return 180;
  return 140;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
