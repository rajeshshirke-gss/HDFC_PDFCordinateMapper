import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MfCommonApprovalActionData, MfCommonApprovalActionValue } from './mf-common-approval.models';

@Component({
  selector: 'app-mf-common-approval-action-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <p class="summary">{{ data.record.masterName }} - {{ data.record.displayFields[0] || data.record.tblAutoId }}</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Remark</mat-label>
          <textarea matInput formControlName="remark" rows="3" maxlength="4000"></textarea>
          @if (data.action === 'reject') {
            <mat-error>Rejection remark is required.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">{{ buttonText }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .summary {
      margin: 0 0 12px;
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 600;
    }

    mat-form-field {
      width: min(520px, 78vw);
    }
  `]
})
export class MfCommonApprovalActionDialog {
  readonly data = inject<MfCommonApprovalActionData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MfCommonApprovalActionDialog>);

  readonly title = this.data.action === 'approve' ? 'Approve Request' : 'Reject Request';
  readonly buttonText = this.data.action === 'approve' ? 'Approve' : 'Reject';
  readonly form = this.fb.nonNullable.group({
    remark: ['', this.data.action === 'reject' ? [Validators.required, Validators.maxLength(4000)] : [Validators.maxLength(4000)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue() as MfCommonApprovalActionValue);
  }

  close(): void {
    this.dialogRef.close();
  }
}
