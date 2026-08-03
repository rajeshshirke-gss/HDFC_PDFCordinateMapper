import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, IHeaderParams, ValueGetterParams } from 'ag-grid-community';

import { RoleMasterDialogData, RoleMasterFormValue, RoleMasterMenuRow } from './role-master.models';
import { RoleMasterStore } from './role-master.store';

@Component({
  selector: 'app-role-menu-select-all-header',
  standalone: true,
  template: `
    <input class="header-checkbox" type="checkbox" [checked]="checked()" [disabled]="disabled()" aria-label="Select all menus" (change)="toggle($event)" />
  `,
  styles: [`
    .header-checkbox {
      width: 16px;
      height: 16px;
      margin: 0;
      accent-color: var(--app-primary);
      cursor: pointer;
    }
  `]
})
export class RoleMenuSelectAllHeader {
  private params: IHeaderParams<RoleMasterMenuRow> | null = null;

  checked(): boolean {
    return Boolean(this.params?.context?.componentParent?.allFilteredMenusSelected());
  }

  disabled(): boolean {
    return Boolean(this.params?.context?.componentParent?.isMenuSelectionDisabled());
  }

  agInit(params: IHeaderParams<RoleMasterMenuRow>): void {
    this.params = params;
  }

  refresh(params: IHeaderParams<RoleMasterMenuRow>): boolean {
    this.params = params;
    return true;
  }

  toggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.params?.context?.componentParent?.setFilteredMenus(checked);
  }
}

@Component({
  selector: 'app-role-master-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, AgGridAngular, RoleMenuSelectAllHeader],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>{{ title }}</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="role-dialog-content">
      <form class="role-form" [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Role Code</mat-label>
            <input matInput formControlName="roleCode" maxlength="50" required />
            <mat-error>Role Code is required.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Role Name</mat-label>
            <input matInput formControlName="roleName" maxlength="100" required />
            <mat-error>Role Name is required.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Active</mat-label>
            <mat-select formControlName="active" required>
              <mat-option value="Y">Active</mat-option>
              @if (data.mode !== 'create') {
                <mat-option value="N">Inactive</mat-option>
              }
            </mat-select>
            <mat-error>Active is required.</mat-error>
          </mat-form-field>

          <section class="menu-section wide">
            <div class="menu-toolbar">
              <div>
                <h3>Menu List</h3>
                <p>{{ selectedCount() }} selected of {{ menuRows().length }}</p>
              </div>
              <!-- <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search-field">
                <mat-label>Search Menu</mat-label>
                <input matInput [value]="menuSearch()" (input)="setMenuSearch($any($event.target).value)" />
              </mat-form-field> -->
            </div>

            <div class="menu-grid ag-theme-quartz">
              <ag-grid-angular
                [rowData]="menuRows()"
                [columnDefs]="menuColumnDefs"
                [defaultColDef]="menuDefaultColDef"
                [quickFilterText]="menuSearch()"
                [domLayout]="'autoHeight'"
                [suppressCellFocus]="true"
                [context]="gridContext"
                (gridReady)="onMenuGridReady($event)"
                (cellClicked)="onMenuCellClicked($event)"
              />
              @if (store.roleMenuLoading()) {
                <div class="grid-overlay"><mat-spinner diameter="28" /></div>
              } @else if (!menuRows().length) {
                <div class="grid-overlay empty">No menus returned by API.</div>
              }
            </div>

            @if (store.roleMenuError()) {
              <p class="menu-error">{{ store.roleMenuError() }}</p>
            }
          </section>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (data.mode !== 'view') {
        <button mat-button type="button" (click)="clearForm()">Clear</button>
      }
      <button mat-button type="button" (click)="close()">Close</button>
      @if (data.mode !== 'view') {
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">
          {{ data.mode === 'create' ? 'Submit for Approval' : 'Submit Update for Approval' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-right: 10px;
    }

    .dialog-title h2 {
      margin: 0;
      color: var(--app-heading);
      font-size: 22px;
      font-weight: 600;
    }

    .dialog-close {
      color: var(--app-heading);
      flex: 0 0 auto;
      background: transparent;
    }

    .dialog-close:hover {
      background: transparent;
    }

    .role-form {
      min-width: min(960px, 88vw);
    }

    .role-dialog-content {
      max-height: calc(82vh - 116px);
      overflow-y: auto;
      overflow-x: hidden;
      padding-top: 12px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px 12px;
      padding-top: 4px;
    }

    .form-grid mat-form-field {
      overflow: visible;
    }

    .wide {
      grid-column: 1 / -1;
    }

    .menu-section {
      display: grid;
      gap: 8px;
      min-width: 0;
    }

    .menu-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    h3,
    p {
      margin: 0;
    }

    h3 {
      color: var(--app-heading);
      font-size: 15px;
      font-weight: 700;
    }

    p {
      color: var(--app-muted);
      font-size: 12px;
    }

    .search-field {
      width: 260px;
    }

    .menu-grid {
      position: relative;
      min-height: 180px;
      overflow: visible;
      border: 1px solid var(--app-border);
      border-radius: 6px;
    }

    ag-grid-angular {
      display: block;
      width: 100%;
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.72);
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 600;
    }

    .menu-error {
      color: var(--mat-sys-on-tertiary-container);
      font-weight: 600;
    }

    :host ::ng-deep .menu-checkbox {
      width: 16px;
      height: 16px;
      accent-color: var(--app-primary);
      cursor: pointer;
    }

    :host ::ng-deep .menu-checkbox:disabled {
      cursor: default;
      opacity: 0.55;
    }

    @media (max-width: 760px) {
      .role-form {
        min-width: 0;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .menu-toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .search-field {
        width: 100%;
      }


      .page-header{
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    margin-bottom:20px;
}

.page-breadcrumb{
    font-size:15px;
    color:#6b7280;
    margin-bottom:6px;
}

.page-title{
    font-size:22px;
    font-weight:700;
    color:#0f172a;
    margin:0 0 12px;
}

.page-tabs{
    margin-bottom:16px;
}
    }
  `]
})
export class RoleMasterFormDialog {
  readonly data = inject<RoleMasterDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoleMasterFormDialog>);
  readonly store = inject(RoleMasterStore);

  readonly menuRows = computed(() => this.store.roleMenuRows());
  readonly menuSearch = signal('');
  private readonly menuGridApi = signal<GridApi<RoleMasterMenuRow> | null>(null);
  readonly selectedCount = computed(() => this.menuRows().filter((row) => row.selected).length);
  readonly gridContext = { componentParent: this };

  readonly menuDefaultColDef: ColDef<RoleMasterMenuRow> = { sortable: true, filter: 'agTextColumnFilter', floatingFilter: true, resizable: true };
  readonly menuColumnDefs: ColDef<RoleMasterMenuRow>[] = [
    {
      headerName: '',
      headerComponent: RoleMenuSelectAllHeader,
      width: 52,
      sortable: false,
      filter: false,
      cellRenderer: ({ data }: { data?: RoleMasterMenuRow }) => `
        <input class="menu-checkbox" data-action="toggle" type="checkbox" ${data?.selected ? 'checked' : ''} ${this.isMenuSelectionDisabled() ? 'disabled' : ''} aria-label="Select menu" />
      `
    },
    { headerName: 'Module Name', field: 'moduleName', minWidth: 160 },
    { headerName: 'Main Menu', field: 'mainMenu', minWidth: 160 },
    { headerName: 'Sub Menu', field: 'subMenu', minWidth: 180 },
    {
      headerName: 'Status',
      minWidth: 130,
      valueGetter: ({ data }: ValueGetterParams<RoleMasterMenuRow>) => data?.selected ? 'Selected' : 'Not Selected'
    }
  ];

  readonly form = this.fb.nonNullable.group({
    roleCode: ['', Validators.required],
    roleName: ['', Validators.required],
    description: [''],
    active: ['Y', Validators.required],
    menuAccess: ['']
  });

  readonly title = this.data.mode === 'create'
    ? 'Create Role'
    : this.data.mode === 'edit'
      ? 'Edit Role'
      : 'View Role';

  constructor() {
    if (this.data.record) {
      this.form.patchValue({
        roleCode: this.data.record.roleCode,
        roleName: this.data.record.roleName,
        description: this.data.record.description,
        active: this.data.record.active || 'Y',
        menuAccess: this.data.record.menuAccess
      });
    }

    if (this.data.mode === 'edit') {
      this.form.controls.roleCode.disable();
    }

    if (this.data.mode === 'create') {
      this.form.controls.active.setValue('Y');
      this.form.controls.active.disable();
    }

    if (this.data.mode === 'view') {
      this.form.disable();
    }

    this.store.loadRoleMenus(this.data.record, this.form.controls.menuAccess.value);
  }

  onMenuCellClicked(event: CellClickedEvent<RoleMasterMenuRow>): void {
    const target = event.event?.target as HTMLElement | null;
    if (this.data.mode === 'view' || !target?.closest('[data-action="toggle"]') || !event.data) {
      return;
    }

    this.toggleMenu(event.data.menuId);
  }

  onMenuGridReady(event: GridReadyEvent<RoleMasterMenuRow>): void {
    this.menuGridApi.set(event.api);
  }

  setMenuSearch(value: string): void {
    this.menuSearch.set(value);
    queueMicrotask(() => this.menuGridApi()?.refreshHeader());
  }

  isMenuSelectionDisabled(): boolean {
    return this.data.mode === 'view';
  }

  allFilteredMenusSelected(): boolean {
    const rows = this.filteredMenuRows();
    return rows.length > 0 && rows.every((row) => row.selected);
  }

  setFilteredMenus(selected: boolean): void {
    if (this.isMenuSelectionDisabled()) {
      return;
    }

    this.store.setRoleMenusSelected(this.filteredMenuRows().map((row) => row.menuId), selected);
    this.syncMenuAccess();
    queueMicrotask(() => this.menuGridApi()?.refreshHeader());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.syncMenuAccess();
    const value = this.form.getRawValue() as RoleMasterFormValue;
    this.store.clearRoleMenus();
    this.dialogRef.close(value);
  }

  close(): void {
    this.store.clearRoleMenus();
    this.dialogRef.close();
  }

  clearForm(): void {
    if (this.data.mode === 'edit' && this.data.record) {
      this.form.patchValue({
        roleCode: this.data.record.roleCode,
        roleName: this.data.record.roleName,
        description: this.data.record.description,
        active: this.data.record.active || 'Y',
        menuAccess: this.data.record.menuAccess
      });
      this.store.loadRoleMenus(this.data.record, this.data.record.menuAccess);
      return;
    }

    this.form.reset({
      roleCode: '',
      roleName: '',
      description: '',
      active: 'Y',
      menuAccess: ''
    });
    this.form.controls.active.disable();
    this.store.setAllRoleMenus(false);
    this.syncMenuAccess();
    queueMicrotask(() => this.menuGridApi()?.refreshHeader());
  }

  private toggleMenu(menuId: string): void {
    this.store.toggleRoleMenu(menuId);
    this.syncMenuAccess();
    queueMicrotask(() => this.menuGridApi()?.refreshHeader());
  }

  private syncMenuAccess(): void {
    this.form.controls.menuAccess.setValue(this.store.selectedRoleMenuAccess());
  }

  private filteredMenuRows(): RoleMasterMenuRow[] {
    const api = this.menuGridApi();
    if (!api) {
      return this.menuRows();
    }

    const rows: RoleMasterMenuRow[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) {
        rows.push(node.data);
      }
    });
    return rows;
  }
}
