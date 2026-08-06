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
import { TemplateMasterApiService } from './template-master-api.service';
import { TemplateMasterFormDialog } from './template-master-form.dialog';
import { TemplateMasterFormValue, TemplateMasterRecord, TemplateMasterView } from './template-master.models';
import { TemplateMasterStore } from './template-master.store';

@Component({
  selector: 'app-template-master-page',
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
    <section class="template-master-page">
      <header class="page-header">
        <div class="title-row">
          <h1>Template Master</h1>
          <mat-tab-group class="view-tabs" [mat-stretch-tabs]="false" [fitInkBarToContent]="true" [selectedIndex]="selectedTabIndex()" (selectedIndexChange)="selectTab($event)">
            <mat-tab label="All"></mat-tab>
            <mat-tab label="Approved"></mat-tab>
          </mat-tab-group>
          <div class="header-actions">
            <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="refresh()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
            <button mat-flat-button color="primary" class="app-primary-button" type="button" (click)="openCreate()">
              <mat-icon>add</mat-icon>
              Add Template
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
          (gridReady)="onGridReady($event)"
          (cellClicked)="onCellClicked($event)"
        />
        @if (!store.loading() && activeRows().length === 0) {
          <div class="empty-state">No templates found for this view.</div>
        }
      </div>
    </section>
  `,
  styles: [`
    .template-master-page {
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
export class TemplateMasterPage implements OnInit {
  readonly store = inject(TemplateMasterStore);

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly api = inject(TemplateMasterApiService);
  private readonly gridApi = signal<GridApi<TemplateMasterRecord> | null>(null);

  readonly activeRows = computed(() => this.store.activeRows());
  readonly defaultColDef: ColDef<TemplateMasterRecord> = {
    sortable: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    resizable: true
  };
  readonly columnDefs = computed<ColDef<TemplateMasterRecord>[]>(() => buildColumnDefs(this.activeRows(), this.store.activeView()));

  ngOnInit(): void {
    this.store.loadTemplates();
  }

  selectedTabIndex(): number {
    return this.store.activeView() === 'approved' ? 1 : 0;
  }

  selectTab(index: number): void {
    this.store.setActiveView(index === 1 ? 'approved' : 'all');
  }

  refresh(): void {
    this.store.loadTemplates();
  }

  onGridReady(event: GridReadyEvent<TemplateMasterRecord>): void {
    this.gridApi.set(event.api);
  }

  onCellClicked(event: CellClickedEvent<TemplateMasterRecord>): void {
    const target = event.event?.target as HTMLElement | null;
    const action = target?.closest<HTMLButtonElement>('[data-action]')?.dataset?.['action'];
    const record = event.data;
    if (!action || !record) return;
    if (action === 'view') this.openForm('view', record);
    if (action === 'edit') this.openForm('edit', record);
    if (action === 'delete') this.confirmDelete(record);
    if (action === 'preview') window.open(this.api.previewUrl(record), '_blank', 'noopener');
  }

  openCreate(): void {
    this.openForm('create', null);
  }

  private openForm(mode: TemplateMasterView | 'create' | 'edit' | 'view', record: TemplateMasterRecord | null): void {
    if (mode === 'all' || mode === 'approved') return;
    this.dialog.open(TemplateMasterFormDialog, {
      width: '980px',
      maxWidth: '96vw',
      disableClose: mode !== 'view',
      data: { mode, record, submitting: this.store.submitting() }
    }).afterClosed().pipe(take(1)).subscribe((value?: TemplateMasterFormValue) => {
      if (!value || mode === 'view') return;
      const title = mode === 'create' ? 'Create Template' : 'Update Template';
      const message = mode === 'create'
        ? `Submit template ${value.templateCode || value.templateName} for approval?`
        : `Submit update for template ${record?.templateCode}?`;
      this.dialog.open(ConfirmDialogComponent, {
        width: '440px',
        data: { title, message, confirmText: mode === 'create' ? 'Submit' : 'Submit Update' }
      }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
        const onSuccess = () => this.snackBar.open(this.store.lastMessage() || 'Template request submitted.', 'Close', { duration: 4000 });
        if (mode === 'create') {
          this.store.createTemplate(value, onSuccess);
        } else if (record) {
          this.store.updateTemplate(record, value, onSuccess);
        }
      });
    });
  }

  private confirmDelete(record: TemplateMasterRecord): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete Template',
        message: `Submit delete request for ${record.templateName || record.templateCode}?`,
        confirmText: 'Submit Delete',
        danger: true
      }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => this.store.deleteTemplate(record));
  }
}

const hiddenResponseFields = new Set(['autoid', 'templatecode', 'file_path', 'filepath', 'stored_file_name', 'storedfilename']);
const leadingResponseFields = ['amcname'];
const auditResponseFields = ['createdby', 'createddate', 'modifiedby', 'modifieddate', 'approvedby', 'approveddate'];

function buildColumnDefs(rows: TemplateMasterRecord[], view: TemplateMasterView): ColDef<TemplateMasterRecord>[] {
  return [actionColumn(view), ...orderedResponseKeys(rows).map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<TemplateMasterRecord>) => formatCellValue(data?.raw?.[key])
  }))];
}

function orderedResponseKeys(rows: TemplateMasterRecord[]): string[] {
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

  const byNormalizedKey = new Map(keys.map((key) => [normalizeKey(key), key]));
  const leading = leadingResponseFields.map((key) => byNormalizedKey.get(key)).filter(isPresent);
  const audit = auditResponseFields.map((key) => byNormalizedKey.get(key)).filter(isPresent);
  const reserved = new Set([...leading, ...audit]);
  return [...leading, ...keys.filter((key) => !reserved.has(key) && !auditResponseFields.includes(normalizeKey(key))), ...audit];
}

function actionColumn(view: TemplateMasterView): ColDef<TemplateMasterRecord> {
  return {
    headerName: 'Actions',
    width: view === 'approved' ? 96 : 182,
    pinned: 'left',
    sortable: false,
    filter: false,
    cellRenderer: () => view === 'approved'
      ? `<div class="grid-actions single"><button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button></div>`
      : `
        <div class="grid-actions">
          <button class="grid-action" data-action="view" title="View" aria-label="View"><span class="material-icons">visibility</span></button>
          <button class="grid-action" data-action="edit" title="Edit" aria-label="Edit"><span class="material-icons">edit</span></button>
          <button class="grid-action" data-action="preview" title="Preview PDF" aria-label="Preview PDF"><span class="material-icons">picture_as_pdf</span></button>
          <button class="grid-action delete" data-action="delete" title="Delete" aria-label="Delete"><span class="material-icons">delete</span></button>
        </div>
      `
  };
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  const normalized = key.toLowerCase();
  if (/name|description|pages|remark/.test(normalized)) return 220;
  if (/date|hash/.test(normalized)) return 180;
  return 140;
}

function formatCellValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isPresent(value: string | undefined): value is string {
  return !!value;
}
