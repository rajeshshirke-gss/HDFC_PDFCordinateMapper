import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, FilterChangedEvent, GridApi, GridReadyEvent, ValueGetterParams } from 'ag-grid-community';
import { filter, take } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { ApprovalDetailRecord, ApprovalSummaryRecord } from './common-approval.models';
import { CommonApprovalStore } from './common-approval.store';

@Component({
  selector: 'app-common-approval-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, AgGridAngular],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>Approval Details</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="detail-content">
      <div class="toolbar">
        <div>
          <p class="eyebrow">{{ data.summary.masterName }}</p>
          <h3>{{ data.summary.description || data.summary.referenceNo || data.summary.tableAutoId }}</h3>
        </div>
        <div class="actions">
          <button mat-button type="button" (click)="store.clearDecisions()">Clear</button>
        </div>
      </div>

      @if (store.errorMessage()) { <p class="alert error">{{ store.errorMessage() }}</p> }
      @if (store.lastMessage()) { <p class="alert success">{{ store.lastMessage() }}</p> }

      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="store.details()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="10"
          [paginationPageSizeSelector]="[10, 25, 50]"
          (gridReady)="onGridReady($event)"
          (filterChanged)="onFilterChanged($event)"
          (cellClicked)="onCellClicked($event)"
        />
        @if (store.detailLoading()) {
          <div class="grid-overlay"><mat-spinner diameter="28" /></div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Close</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!store.selectedDecisionCount() || store.submitting()" (click)="confirmSubmit()">
        Submit Decisions
      </button>
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
      color: var(--mat-sys-tertiary);
      flex: 0 0 auto;
    }

    .dialog-close:hover {
      background: var(--mat-sys-tertiary-container);
    }

    .detail-content {
      width: min(1080px, 94vw);
      max-height: 76vh;
      overflow: hidden;
    }

    .toolbar,
    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .eyebrow,
    h3 {
      margin: 0;
    }

    .eyebrow {
      color: var(--app-muted);
      font-size: 12px;
    }

    h3 {
      color: var(--app-heading);
      font-size: 16px;
    }

    .grid-shell {
      position: relative;
      height: 52vh;
      min-height: 360px;
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
      margin: 10px 0;
      padding: 9px 12px;
      font-size: 13px;
      font-weight: 600;
    }

    .alert.error { border-left: 3px solid var(--mat-sys-tertiary); background: var(--mat-sys-tertiary-container); color: var(--mat-sys-on-tertiary-container); }
    .alert.success { border-left: 3px solid #16833a; background: #effaf2; color: #11612d; }

    .grid-overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(255,255,255,.72);
    }

    :host ::ng-deep .decision-check {
      width: 16px;
      height: 16px;
      accent-color: var(--app-primary);
      cursor: pointer;
      margin: 0;
    }

    :host ::ng-deep .decision-column-header .ag-header-cell-label {
      justify-content: center;
    }

    :host ::ng-deep .decision-column-header .ag-floating-filter {
      padding: 0;
    }

    :host ::ng-deep .decision-column-header .ag-floating-filter-body {
      display: flex;
      justify-content: center;
      width: 100%;
      margin: 0;
    }

    :host ::ng-deep .decision-column-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    :host ::ng-deep .decision-filter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      min-height: 40px;
    }

    :host ::ng-deep .decision-filter input {
      width: 16px;
      height: 16px;
      accent-color: var(--app-primary);
      cursor: pointer;
      margin: 0;
    }
  `]
})
export class CommonApprovalDetailDialog {
  readonly data = inject<{ summary: ApprovalSummaryRecord }>(MAT_DIALOG_DATA);
  readonly store = inject(CommonApprovalStore);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<CommonApprovalDetailDialog>);
  private readonly gridApi = signal<GridApi<ApprovalDetailRecord> | null>(null);

  readonly defaultColDef: ColDef<ApprovalDetailRecord> = { sortable: true, filter: 'agTextColumnFilter', floatingFilter: true, resizable: true };
  readonly columnDefs = computed<ColDef<ApprovalDetailRecord>[]>(() => [
    decisionColumn('Approve', 'approve', (decision, checked) => this.setFilteredDecision(decision, checked)),
    decisionColumn('Reject', 'reject', (decision, checked) => this.setFilteredDecision(decision, checked)),
    ...responseColumns(this.store.details())
  ]);

  constructor() {
    this.store.clearMessages();
    this.store.loadDetails(this.data.summary);
  }

  onGridReady(event: GridReadyEvent<ApprovalDetailRecord>): void {
    this.gridApi.set(event.api);
  }

  onFilterChanged(event: FilterChangedEvent<ApprovalDetailRecord>): void {
    event.api.refreshCells({ force: true });
  }

  onCellClicked(event: CellClickedEvent<ApprovalDetailRecord>): void {
    const action = (event.event?.target as HTMLElement | null)?.closest<HTMLInputElement>('[data-decision]')?.dataset?.['decision'];
    if (!action || !event.data) return;
    const decision = action === 'approve' ? 'approve' : 'reject';
    this.store.setDetailDecision(event.data.autoId, event.data.decision === decision ? '' : decision);
  }

  setFilteredDecision(decision: 'approve' | 'reject', checked: boolean): void {
    const rows = this.filteredRows();
    const targetRows = checked ? rows : rows.filter((row) => row.decision === decision);
    this.store.setFilteredDecision(targetRows.map((row) => row.autoId), checked ? decision : '');
    this.gridApi()?.refreshHeader();
    this.gridApi()?.refreshCells({ force: true });
  }

  confirmSubmit(): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Submit Decisions',
        message: `Submit ${this.store.selectedDecisionCount()} approval decision(s)?`,
        confirmText: 'Submit'
      }
    }).afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.submitDecisions(() => undefined);
    });
  }

  close(): void {
    this.store.clearDetail();
    this.dialogRef.close();
  }

  private filteredRows(): ApprovalDetailRecord[] {
    const api = this.gridApi();
    if (!api) return this.store.details();
    const rows: ApprovalDetailRecord[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (node.data) rows.push(node.data);
    });
    return rows;
  }
}

function decisionColumn(
  label: string,
  decision: 'approve' | 'reject',
  onToggle: (decision: 'approve' | 'reject', checked: boolean) => void
): ColDef<ApprovalDetailRecord> {
  return {
    headerName: label,
    width: 104,
    minWidth: 104,
    maxWidth: 104,
    pinned: 'left',
    sortable: false,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressFloatingFilterButton: true,
    headerClass: 'decision-column-header',
    cellClass: 'decision-column-cell',
    floatingFilterComponent: DecisionAllFloatingFilterComponent,
    floatingFilterComponentParams: { decision, onToggle },
    valueGetter: ({ data }: ValueGetterParams<ApprovalDetailRecord>) => data?.decision === decision ? label : '',
    cellRenderer: ({ data }: { data?: ApprovalDetailRecord }) => `<input class="decision-check" data-decision="${decision}" type="checkbox" ${data?.decision === decision ? 'checked' : ''} />`
  };
}

class DecisionAllFloatingFilterComponent {
  private params!: {
    decision: 'approve' | 'reject';
    onToggle: (decision: 'approve' | 'reject', checked: boolean) => void;
    api: GridApi<ApprovalDetailRecord>;
  };
  private element!: HTMLDivElement;
  private input!: HTMLInputElement;
  private readonly refreshState = () => this.updateState();
  private readonly toggle = () => {
    this.params.onToggle(this.params.decision, this.input.checked);
  };

  init(params: DecisionAllFloatingFilterComponent['params']): void {
    this.params = params;
    this.element = document.createElement('div');
    this.element.className = 'decision-filter';
    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.title = `Select all filtered ${params.decision}`;
    this.input.addEventListener('change', this.toggle);
    this.element.append(this.input);

    params.api.addEventListener('filterChanged', this.refreshState);
    params.api.addEventListener('modelUpdated', this.refreshState);
    this.updateState();
  }

  getGui(): HTMLElement {
    return this.element;
  }

  refresh(params: DecisionAllFloatingFilterComponent['params']): boolean {
    this.params = params;
    this.updateState();
    return true;
  }

  destroy(): void {
    this.input.removeEventListener('change', this.toggle);
    this.params.api.removeEventListener('filterChanged', this.refreshState);
    this.params.api.removeEventListener('modelUpdated', this.refreshState);
  }

  private updateState(): void {
    if (!this.params?.api || !this.input) return;
    const rows = filteredRows(this.params.api);
    const selected = rows.filter((row) => row.decision === this.params.decision).length;
    this.input.checked = rows.length > 0 && selected === rows.length;
    this.input.indeterminate = selected > 0 && selected < rows.length;
  }
}

function filteredRows(api: GridApi<ApprovalDetailRecord>): ApprovalDetailRecord[] {
  const rows: ApprovalDetailRecord[] = [];
  api.forEachNodeAfterFilter((node) => {
    if (node.data) rows.push(node.data);
  });
  return rows;
}

function responseColumns(rows: ApprovalDetailRecord[]): ColDef<ApprovalDetailRecord>[] {
  const keys = orderedKeys(rows);
  return keys.map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: widthFor(key),
    valueGetter: ({ data }: ValueGetterParams<ApprovalDetailRecord>) => formatValue(data?.raw?.[key])
  }));
}

function orderedKeys(rows: ApprovalDetailRecord[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row.raw)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }
  return keys;
}

function headerFor(key: string): string {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widthFor(key: string): number {
  return /date|remark|description|action/i.test(key) ? 190 : 140;
}

function formatValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
