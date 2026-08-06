import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AmcMasterDialogData } from './amc-master.models';

@Component({
  selector: 'app-amc-master-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>{{ title }}</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form class="amc-form" [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>AMC Code</mat-label>
            <input matInput formControlName="amcCode" maxlength="100" />
            <mat-error>AMC Code is required.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>AMC Name</mat-label>
            <input matInput formControlName="amcName" maxlength="500" />
            <mat-error>AMC Name is required.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Active</mat-label>
            <mat-select formControlName="active">
              <mat-option value="Y">Active</mat-option>
              <mat-option value="N">Inactive</mat-option>
            </mat-select>
            <mat-error>Active is required.</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="amcDescription" rows="3" maxlength="2000"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Remark</mat-label>
          <textarea matInput formControlName="remark" rows="2" maxlength="4000"></textarea>
        </mat-form-field>
      </form>
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

    .amc-form {
      display: grid;
      gap: 12px;
      min-width: min(760px, 76vw);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    mat-form-field {
      width: 100%;
    }

    @media (max-width: 720px) {
      .amc-form,
      .form-grid {
        min-width: 0;
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AmcMasterFormDialog {
  readonly data = inject<AmcMasterDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AmcMasterFormDialog>);

  readonly form = this.fb.nonNullable.group({
    amcCode: ['', [Validators.required, Validators.maxLength(100)]],
    amcName: ['', [Validators.required, Validators.maxLength(500)]],
    amcDescription: ['', Validators.maxLength(2000)],
    active: ['Y', Validators.required],
    remark: ['', Validators.maxLength(4000)]
  });

  readonly title = 'View AMC';

  constructor() {
    if (this.data.record) {
      this.form.patchValue({
        amcCode: this.data.record.amcCode,
        amcName: this.data.record.amcName,
        amcDescription: this.data.record.amcDescription,
        active: normalizeActive(this.data.record.active),
        remark: this.data.record.actionRemark
      });
    }
    this.form.disable();
  }

  close(): void {
    this.dialogRef.close();
  }
}

function normalizeActive(value: string): string {
  return value?.trim().toUpperCase() === 'N' ? 'N' : 'Y';
}
