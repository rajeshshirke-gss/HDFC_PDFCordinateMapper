import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MasterImportLogRow } from './master-import.models';

export interface MasterImportLogDialogData {
  masterName: string;
  rows: MasterImportLogRow[];
}

@Component({
  selector: 'app-master-import-log-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>{{ data.masterName }} Import Log</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="log-table-shell">
        <table class="log-table">
          <thead>
            <tr>
              <th>Record Count</th>
              <th>Status</th>
              <th>Imported By</th>
              <th>Import Date Time</th>
            </tr>
          </thead>
          <tbody>
            @for (row of pagedRows(); track row.raw) {
              <tr>
                <td>{{ row.recordCount }}</td>
                <td>{{ row.status }}</td>
                <td>{{ row.importedBy }}</td>
                <td>{{ row.importDateTime }}</td>
              </tr>
            }
          </tbody>
        </table>

        @if (data.rows.length === 0) {
          <div class="empty-state">No import log records found.</div>
        }
      </div>

      @if (data.rows.length > pageSize) {
        <div class="pager">
          <span>Page {{ pageIndex() + 1 }} of {{ totalPages() }} · {{ data.rows.length }} records</span>
          <div class="pager-actions">
            <button mat-stroked-button type="button" [disabled]="pageIndex() === 0" (click)="previousPage()">
              <mat-icon>chevron_left</mat-icon>
              Previous
            </button>
            <button mat-stroked-button type="button" [disabled]="pageIndex() >= totalPages() - 1" (click)="nextPage()">
              Next
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-right: 8px;
    }

    .dialog-title h2 {
      margin: 0;
      color: var(--app-heading);
      font-size: 20px;
      font-weight: 700;
    }

    .dialog-close {
      flex: 0 0 auto;
    }

    mat-dialog-content {
      min-width: min(760px, 80vw);
      max-height: 62vh;
    }

    .log-table-shell {
      overflow: auto;
      border: 1px solid var(--app-border);
      border-radius: 6px;
    }

    .log-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th,
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--app-border);
      text-align: left;
      white-space: nowrap;
    }

    th {
      background: var(--mat-sys-surface-container);
      color: var(--app-heading);
      font-weight: 700;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .empty-state {
      padding: 18px;
      color: var(--app-muted);
      text-align: center;
    }

    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 12px;
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 600;
    }

    .pager-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pager-actions button {
      min-width: 104px;
    }
  `]
})
export class MasterImportLogDialog {
  readonly pageSize = 10;
  readonly data = inject<MasterImportLogDialogData>(MAT_DIALOG_DATA);
  readonly pageIndex = signal(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.data.rows.length / this.pageSize)));
  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.data.rows.slice(start, start + this.pageSize);
  });
  private readonly dialogRef = inject(MatDialogRef<MasterImportLogDialog>);

  previousPage(): void {
    this.pageIndex.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.pageIndex.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  close(): void {
    this.dialogRef.close();
  }
}
