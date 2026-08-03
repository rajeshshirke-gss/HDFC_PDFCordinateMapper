import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { UserMasterDialogData, UserMasterFormValue } from './user-master.models';

@Component({
  selector: 'app-user-master-form-dialog',
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
      <form class="user-form" [formGroup]="form">
        <section>
          <h3>Identity</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>User ID</mat-label>
              <input matInput formControlName="userId" maxlength="35" required />
              <mat-error>User ID is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>User Name</mat-label>
              <input matInput formControlName="userName" maxlength="100" required />
              <mat-error>User Name is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" required />
              <mat-error>Valid email is required.</mat-error>
            </mat-form-field>
          </div>
        </section>

        <section>
          <h3>Organization</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Branch Code</mat-label>
              <input matInput formControlName="branchCode" required />
              <mat-error>Branch Code is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Branch Name</mat-label>
              <input matInput formControlName="branchName" required />
              <mat-error>Branch Name is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Department Code</mat-label>
              <input matInput formControlName="departmentCode" required />
              <mat-error>Department Code is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Department Name</mat-label>
              <input matInput formControlName="departmentName" required />
              <mat-error>Department Name is required.</mat-error>
            </mat-form-field>
          </div>
        </section>

        <section>
          <h3>Access</h3>
          <div class="form-grid compact">
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="roleId" required>
                @for (role of data.roles; track role.id) {
                  <mat-option [value]="role.id">{{ role.name }}</mat-option>
                }
              </mat-select>
              <mat-error>Role is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Active</mat-label>
              <mat-select formControlName="active" required>
                @for (option of activeOptions; track option.id) {
                  <mat-option [value]="option.id">{{ option.name }}</mat-option>
                }
              </mat-select>
              <mat-error>Active is required.</mat-error>
            </mat-form-field>
          </div>
        </section>
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

    .user-form {
      display: grid;
      gap: 16px;
      min-width: min(820px, 78vw);
    }

    h3 {
      margin: 0 0 10px;
      color: var(--app-heading);
      font-size: 15px;
      font-weight: 700;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .form-grid.compact {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 760px) {
      .user-form,
      .form-grid,
      .form-grid.compact {
        min-width: 0;
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserMasterFormDialog {
  readonly data = inject<UserMasterDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserMasterFormDialog>);

  readonly form = this.fb.nonNullable.group({
    userId: ['', [Validators.required, Validators.maxLength(35)]],
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', Validators.required],
    branchCode: ['', Validators.required],
    branchName: ['', Validators.required],
    departmentCode: ['', Validators.required],
    departmentName: ['', Validators.required],
    active: ['Y', Validators.required]
  });

  readonly title = this.data.mode === 'create'
    ? 'Create User'
    : this.data.mode === 'edit'
      ? 'Edit User'
      : 'View User';

  readonly activeOptions = this.data.activeOptions.length
    ? this.data.activeOptions
    : [
      { id: 'Y', name: 'Active', raw: { DESCRIPTION: 'Active' } },
      { id: 'N', name: 'InActive', raw: { DESCRIPTION: 'InActive' } }
    ];

  constructor() {
    this.form.controls.active.setValue(this.activeOptions[0]?.id || 'Y');

    if (this.data.record) {
      this.form.patchValue({
        userId: this.data.record.userId,
        userName: this.data.record.userName,
        email: this.data.record.email,
        roleId: this.data.record.roleId,
        branchCode: this.data.record.branchCode,
        branchName: this.data.record.branchName,
        departmentCode: this.data.record.departmentCode,
        departmentName: this.data.record.departmentName,
        active: resolveActiveValue(this.data.record.active, this.activeOptions)
      });
    }

    if (this.data.mode === 'edit') {
      this.form.controls.userId.disable();
    }

    if (this.data.mode === 'view') {
      this.form.disable();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue() as UserMasterFormValue);
  }

  close(): void {
    this.dialogRef.close();
  }

  clearForm(): void {
    if (this.data.mode === 'edit' && this.data.record) {
      this.form.patchValue({
        userId: this.data.record.userId,
        userName: this.data.record.userName,
        email: this.data.record.email,
        roleId: this.data.record.roleId,
        branchCode: this.data.record.branchCode,
        branchName: this.data.record.branchName,
        departmentCode: this.data.record.departmentCode,
        departmentName: this.data.record.departmentName,
        active: resolveActiveValue(this.data.record.active, this.activeOptions)
      });
      return;
    }

    this.form.reset({
      userId: '',
      userName: '',
      email: '',
      roleId: '',
      branchCode: '',
      branchName: '',
      departmentCode: '',
      departmentName: '',
      active: this.activeOptions[0]?.id || 'Y'
    });
  }
}

function resolveActiveValue(value: string, options: { id: string; name: string }[]): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'y') return options.find((option) => option.id === 'Y')?.id || 'Y';
  if (normalized === 'n') return options.find((option) => option.id === 'N')?.id || 'N';
  if (normalized === 'dr') return options.find((option) => option.id === 'DR')?.id || 'DR';
  if (normalized === 'l') return options.find((option) => option.id === 'L')?.id || 'L';
  if (normalized === 'u') return options.find((option) => option.id === 'U')?.id || 'U';
  if (normalized === 'd') return options.find((option) => option.id === 'D')?.id || 'D';
  const match = options.find((option) => option.id.toLowerCase() === normalized || option.name.toLowerCase() === normalized);
  return match?.id || value || options[0]?.id || 'Y';
}
