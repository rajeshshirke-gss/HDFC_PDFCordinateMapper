import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MfCommonApprovalRecord } from './mf-common-approval.models';
import { MfCommonApprovalStore } from './mf-common-approval.store';

@Component({
  selector: 'app-mf-common-approval-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>{{ data.record.masterName }} Approval Details</h2>
      <button mat-icon-button type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="detail-content">
      <section class="summary">
        <div><span>Action</span><strong>{{ data.record.action }}</strong></div>
        <div><span>Maker</span><strong>{{ data.record.createdBy }}</strong></div>
        <div><span>Created Date</span><strong>{{ data.record.createdDate }}</strong></div>
        <div><span>Remark</span><strong>{{ data.record.remark || '-' }}</strong></div>
      </section>

      @if (store.detailLoading()) {
        <div class="loading"><mat-spinner diameter="30" /></div>
      } @else {
        @for (detail of store.details(); track detail.raw) {
          <div class="fields">
            @for (field of detail.fields; track field.label) {
              <div class="field">
                <span>{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Close</button>
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

    .detail-content {
      width: min(820px, 92vw);
      max-height: 72vh;
      overflow: auto;
    }

    .summary,
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .summary {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--app-border);
      margin-bottom: 12px;
    }

    .field,
    .summary div {
      display: grid;
      gap: 3px;
    }

    span {
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 600;
    }

    strong {
      color: var(--app-heading);
      font-size: 14px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .loading {
      display: grid;
      place-items: center;
      min-height: 180px;
    }

    @media (max-width: 680px) {
      .summary,
      .fields {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MfCommonApprovalDetailDialog {
  readonly data = inject<{ record: MfCommonApprovalRecord }>(MAT_DIALOG_DATA);
  readonly store = inject(MfCommonApprovalStore);
  private readonly dialogRef = inject(MatDialogRef<MfCommonApprovalDetailDialog>);

  constructor() {
    this.store.loadDetails(this.data.record);
  }

  close(): void {
    this.store.clearDetails();
    this.dialogRef.close();
  }
}
