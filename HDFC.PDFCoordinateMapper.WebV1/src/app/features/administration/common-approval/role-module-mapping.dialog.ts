import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { ApprovalSummaryRecord, RoleModuleMappingRecord } from './common-approval.models';
import { CommonApprovalStore } from './common-approval.store';

@Component({
  selector: 'app-role-module-mapping-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, AgGridAngular],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>Role Module Mapping</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="mapping-content">
      <div class="grid-shell ag-theme-quartz">
        <ag-grid-angular
          [rowData]="store.mapping()"
          [columnDefs]="columnDefs()"
          [defaultColDef]="defaultColDef"
          [pagination]="true"
          [paginationPageSize]="25"
        />
        @if (store.mappingLoading()) {
          <div class="grid-overlay"><mat-spinner diameter="28" /></div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-right: 10px; }
    .dialog-title h2 { margin: 0; color: var(--app-heading); font-size: 22px; font-weight: 600; }
    .dialog-close { color: var(--mat-sys-tertiary); flex: 0 0 auto; }
    .dialog-close:hover { background: var(--mat-sys-tertiary-container); }
    .mapping-content { width: min(1040px, 94vw); max-height: 76vh; overflow: hidden; }
    .grid-shell { position: relative; height: 56vh; min-height: 360px; overflow: hidden; border: 1px solid var(--app-border); border-radius: 6px; }
    ag-grid-angular { display: block; width: 100%; height: 100%; }
    .grid-overlay { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(255,255,255,.72); }
  `]
})
export class RoleModuleMappingDialog {
  readonly data = inject<{ summary: ApprovalSummaryRecord }>(MAT_DIALOG_DATA);
  readonly store = inject(CommonApprovalStore);
  private readonly dialogRef = inject(MatDialogRef<RoleModuleMappingDialog>);

  readonly defaultColDef: ColDef<RoleModuleMappingRecord> = { sortable: true, filter: 'agTextColumnFilter', floatingFilter: true, resizable: true };
  readonly columnDefs = computed<ColDef<RoleModuleMappingRecord>[]>(() => responseColumns(this.store.mapping()));

  constructor() {
    this.store.loadRoleModuleMapping(this.data.summary);
  }

  close(): void {
    this.store.clearMapping();
    this.dialogRef.close();
  }
}

function responseColumns(rows: RoleModuleMappingRecord[]): ColDef<RoleModuleMappingRecord>[] {
  const keys = orderedKeys(rows);
  return keys.map((key) => ({
    headerName: headerFor(key),
    colId: key,
    minWidth: /module|menu|caption/i.test(key) ? 170 : 130,
    valueGetter: ({ data }: ValueGetterParams<RoleModuleMappingRecord>) => formatValue(data?.raw?.[key])
  }));
}

function orderedKeys(rows: RoleModuleMappingRecord[]): string[] {
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

function formatValue(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
