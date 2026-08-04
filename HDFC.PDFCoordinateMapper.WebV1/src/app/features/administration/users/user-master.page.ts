import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';
import { filter, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { UserMasterFormDialog } from './user-master-form.dialog';
import { UserMasterFormValue, UserMasterRecord, UserMasterView } from './user-master.models';
import { UserMasterStore } from './user-master.store';

@Component({
  selector: 'app-user-master-page',
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
    MatTooltipModule,
    AgGridAngular
  ],
  template: `
    <section class="user-master-page">
      <header class="page-header">
        <div>
          <!-- <p class="breadcrumb">Administration / User Management</p> -->
          <div class="title-row">
            <h1>Users</h1>
            <mat-tab-group
              class="view-tabs"
              [mat-stretch-tabs]="false"
              [fitInkBarToContent]="true"
              [selectedIndex]="selectedTabIndex()"
              (selectedIndexChange)="selectTab($event)">
              <mat-tab label="All"></mat-tab>
              <mat-tab label="Approved"></mat-tab>
              <!-- <mat-tab label="Deleted"></mat-tab>
              <mat-tab label="Pending Approval"></mat-tab> -->
            </mat-tab-group>
            <div class="header-actions inline-actions">
              <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="refresh()">
                <mat-icon>refresh</mat-icon>Refresh
              </button>
              <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="openCreate()">
                <mat-icon>person_add</mat-icon>
                Add User
              </button>
            </div>
          </div>
          <!-- <p class="subtitle">Create, update and manage access for application users.</p> -->
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

      <!-- <div class="toolbar">
        <mat-form-field appearance="outline">
          <mat-label>Search users</mat-label>
          <input matInput [ngModel]="quickSearch()" (ngModelChange)="setSearch($event)" />
        </mat-form-field>
        <span class="result-count">{{ activeRows().length }} records</span>
      </div> -->

      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="activeRows()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
          [paginationPageSizeSelector]="[10, 25, 50, 100]"
          [quickFilterText]="quickSearch()"
          [suppressCellFocus]="false"
          (gridReady)="onGridReady($event)"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && activeRows().length === 0) {
          <div class="empty-state">
            No users found for this view.
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .user-master-page {
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

    .title-row {
      display: flex;
      align-items: center;
      gap: 20px;
      min-width: 0;
      flex-wrap: wrap;
    }

    .breadcrumb,
    .subtitle {
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

    .header-actions,
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .inline-actions {
      margin-left: 2px;
    }

    .toolbar {
      justify-content: space-between;
    }

    .toolbar mat-form-field {
      width: min(420px, 100%);
    }

    .result-count {
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 600;
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
      font-size: 18px;
      line-height: 1;
    }

    :host ::ng-deep .grid-action.delete {
      color: #b42318;
    }

    :host ::ng-deep .grid-action.disabled,
    :host ::ng-deep .grid-action:disabled {
      color: var(--app-muted);
      cursor: not-allowed;
      opacity: 0.55;
    }

    :host ::ng-deep .grid-action .material-icons {
      font-size: 18px;
      line-height: 18px;
    }

    :host ::ng-deep .approved-actions-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host ::ng-deep .approved-actions-cell .grid-action {
      margin-right: 0;
    }

    :host ::ng-deep .approved-actions-header .ag-header-cell-label {
      justify-content: center;
    }

    @media (max-width: 760px) {
      .page-header,
      .toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .header-actions {
        justify-content: flex-end;
      }

      .user-master-page {
        height: auto;
        min-height: calc(100vh - 100px);
        overflow: visible;
      }
    }
  `]
})
export class UserMasterPage implements OnInit {
  readonly store = inject(UserMasterStore);

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly gridApi = signal<GridApi<UserMasterRecord> | null>(null);

  readonly quickSearch = computed(() => this.store.quickSearch());
  readonly activeRows = computed(() => this.store.activeRows());

  readonly defaultColDef: ColDef<UserMasterRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };

  readonly columnDefs = computed<ColDef<UserMasterRecord>[]>(() => buildColumnDefs(this.activeRows(), this.store.activeView()));

  ngOnInit(): void {
    this.store.loadRoles();
    this.store.loadUsers();
  }

  selectedTabIndex(): number {
    const views: UserMasterView[] = ['all', 'approved', 'deleted', 'pending'];
    return views.indexOf(this.store.activeView());
  }

  selectTab(index: number): void {
    const views: UserMasterView[] = ['all', 'approved', 'deleted', 'pending'];
    this.store.setActiveView(views[index] ?? 'all');
  }

  setSearch(value: string): void {
    this.store.setQuickSearch(value);
    this.gridApi()?.setGridOption('quickFilterText', value);
  }

  refresh(): void {
    this.store.loadUsers();
  }

  onGridReady(event: GridReadyEvent<UserMasterRecord>): void {
    this.gridApi.set(event.api);
  }

  onCellClicked(event: CellClickedEvent<UserMasterRecord>): void {
    const target = event.event?.target as HTMLElement | null;
    const actionButton = target?.closest<HTMLButtonElement>('[data-action]');
    const action = actionButton?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) {
      return;
    }

    if (actionButton?.disabled) {
      return;
    }

    if (action === 'view') this.openView(record);
    if (action === 'edit' && this.canEdit(record)) this.openEdit(record);
    if (action === 'delete' && this.canDelete()) this.confirmDelete(record);
  }

  openCreate(): void {
    this.openForm('create', null);
  }

  openView(record: UserMasterRecord): void {
    this.openForm('view', record);
  }

  openEdit(record: UserMasterRecord): void {
    if (!this.canEdit(record)) {
      this.snackBar.open('This user is already pending for approval.', 'Close', { duration: 4000 });
      return;
    }

    this.openForm('edit', record);
  }

  confirmDelete(record: UserMasterRecord): void {
    if (!this.canDelete()) {
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete User',
        message: `Submit delete request for ${record.userName || record.userId}?`,
        confirmText: 'Submit Delete',
        danger: true
      }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.deleteUser(record);
      this.snackBar.open('Delete request submitted.', 'Close', { duration: 4000 });
    });
  }

  private openForm(mode: 'create' | 'edit' | 'view', record: UserMasterRecord | null): void {
    const dialogRef = this.dialog.open(UserMasterFormDialog, {
      width: '920px',
      maxWidth: '96vw',
      disableClose: mode !== 'view',
      data: {
        mode,
        record,
        roles: this.store.roles(),
        activeOptions: this.store.activeOptions(),
        submitting: this.store.submitting()
      }
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((value?: UserMasterFormValue) => {
      if (!value || mode === 'view') {
        return;
      }

      const message = mode === 'create'
        ? `Submit user ${value.userId} for approval?`
        : `Submit update for user ${record?.userId}?`;

      this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: mode === 'create' ? 'Create User' : 'Update User',
          message,
          confirmText: mode === 'create' ? 'Submit' : 'Submit Update'
        }
      }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
        const onSuccess = () => {
          this.snackBar.open(this.store.lastMessage() || 'User request submitted.', 'Close', { duration: 4000 });
        };

        if (mode === 'create') {
          this.store.createUser(value, onSuccess);
        } else if (record) {
          this.store.updateUser(record, value, onSuccess);
        }
      });
    });
  }

  private canEdit(record: UserMasterRecord): boolean {
    return this.store.activeView() !== 'approved' && record.approvalState !== 'Pending';
  }

  private canDelete(): boolean {
    return this.store.activeView() !== 'approved';
  }
}

const hiddenResponseFields = new Set(['autoid', 'moduleid', 'moduleaccessid', 'password']);

const headerLabels: Record<string, string> = {
  autoid: 'Auto ID',
  userid: 'User ID',
  groupid: 'Group ID',
  rolename: 'Role Name',
  username: 'User Name',
  email: 'Email',
  createdby: 'Created By',
  createddate: 'Created Date',
  action: 'Action',
  isactive: 'Active',
  departmentcode: 'Department Code',
  departmentname: 'Department Name',
  branchcode: 'Branch Code',
  branchname: 'Branch Name'
};

function buildColumnDefs(rows: UserMasterRecord[], view: UserMasterView): ColDef<UserMasterRecord>[] {
  const responseKeys = orderedResponseKeys(rows);
  const dataColumns = responseKeys.map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<UserMasterRecord>) => formatCellValue(data?.raw?.[key])
  }));

  return [actionColumn(view), ...dataColumns];
}

function orderedResponseKeys(rows: UserMasterRecord[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row.raw)) {
      const normalized = normalizeFieldKey(key);
      if (hiddenResponseFields.has(normalized) || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      keys.push(key);
    }
  }

  return keys;
}

function actionColumn(view: UserMasterView): ColDef<UserMasterRecord> {
  return {
    headerName: 'Actions',
    width: view === 'approved' ? 90 : 150,
    minWidth: view === 'approved' ? 90 : 150,
    maxWidth: view === 'approved' ? 90 : undefined,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellClass: view === 'approved' ? 'approved-actions-cell' : undefined,
    headerClass: view === 'approved' ? 'approved-actions-header' : undefined,
    cellRenderer: ({ data }: { data?: UserMasterRecord }) => {
      const viewButton = `
        <button class="grid-action" data-action="view" title="View" aria-label="View">
          <span class="material-icons">visibility</span>
        </button>
      `;

      if (view === 'approved') {
        return viewButton;
      }

      const pendingApproval = data?.approvalState === 'Pending';
      const editButton = pendingApproval
        ? `
          <button class="grid-action disabled" title="Pending for approval" aria-label="Edit disabled" disabled>
            <span class="material-icons">edit</span>
          </button>
        `
        : `
          <button class="grid-action" data-action="edit" title="Edit" aria-label="Edit">
            <span class="material-icons">edit</span>
          </button>
        `;

      return `
        ${viewButton}
        ${editButton}
        <button class="grid-action delete" data-action="delete" title="Delete" aria-label="Delete">
          <span class="material-icons">delete</span>
        </button>
      `;
    }
  };
}

function headerFor(key: string): string {
  const normalized = key.toLowerCase();
  if (headerLabels[normalized]) {
    return headerLabels[normalized];
  }

  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  const normalized = key.toLowerCase();
  if (/email|action|departmentname|branchname/.test(normalized)) return 220;
  if (/date|created/.test(normalized)) return 180;
  if (/username|rolename|department|branch/.test(normalized)) return 160;
  return 130;
}

function formatCellValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

function normalizeFieldKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}
