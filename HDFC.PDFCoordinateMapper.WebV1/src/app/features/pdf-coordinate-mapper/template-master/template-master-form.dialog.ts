import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { TemplateMasterApiService } from './template-master-api.service';
import { TemplateMasterDialogData, TemplateMasterFormValue, TemplateUploadResult } from './template-master.models';

@Component({
  selector: 'app-template-master-form-dialog',
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
      <form class="template-form" [formGroup]="form">
        <section>
          <h3>Template</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Template Code</mat-label>
              <input matInput formControlName="templateCode" maxlength="100" />
              <mat-error>Template Code is required.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Template Name</mat-label>
              <input matInput formControlName="templateName" maxlength="500" />
              <mat-error>Template Name is required.</mat-error>
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
            <textarea matInput formControlName="templateDescription" rows="2" maxlength="2000"></textarea>
          </mat-form-field>
        </section>

        <section>
          <h3>PDF</h3>
          @if (data.mode === 'create') {
            <div class="upload-row">
              <button mat-stroked-button type="button" [disabled]="uploading()" (click)="fileInput.click()">
                <mat-icon>upload_file</mat-icon>
                Upload PDF
              </button>
              <input #fileInput type="file" accept="application/pdf,.pdf" hidden (change)="onFileSelected($event)" />
              <span class="upload-name">{{ form.controls.originalFileName.value || 'No PDF selected' }}</span>
            </div>
            @if (uploadError()) {
              <p class="field-error">{{ uploadError() }}</p>
            }
          } @else {
            <p class="readonly-note">Template PDF cannot be re-uploaded after the record is created.</p>
          }

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Original File</mat-label>
              <input matInput formControlName="originalFileName" readonly />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Page Count</mat-label>
              <input matInput formControlName="pdfPageCount" readonly />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>File Size Bytes</mat-label>
              <input matInput formControlName="fileSizeBytes" readonly />
            </mat-form-field>
          </div>
        </section>

        <section>
          <h3>Page Configuration</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Mapping Pages</mat-label>
              <mat-select formControlName="mappingPages" multiple>
                @for (page of pageOptions(); track page) {
                  <mat-option [value]="page">{{ page }}</mat-option>
                }
              </mat-select>
              <mat-error>Select mapping pages.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Printing Pages</mat-label>
              <mat-select formControlName="printPages" multiple>
                @for (page of pageOptions(); track page) {
                  <mat-option [value]="page">{{ page }}</mat-option>
                }
              </mat-select>
              <mat-error>Select printing pages.</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Repeat Rows Per Page</mat-label>
              <input matInput type="number" formControlName="repeatRowsPerPage" min="1" />
              <mat-error>Repeat rows must be greater than zero.</mat-error>
            </mat-form-field>
          </div>
        </section>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="close()">Close</button>
      @if (data.mode !== 'view') {
        <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || uploading()" (click)="submit()">
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

    .template-form {
      display: grid;
      gap: 16px;
      min-width: min(880px, 78vw);
    }

    h3 {
      margin: 0 0 10px;
      color: var(--app-heading);
      font-size: 15px;
      font-weight: 700;
    }

    mat-form-field {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .upload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .upload-name,
    .readonly-note {
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 600;
    }

    .field-error {
      margin: -4px 0 10px;
      color: #b42318;
      font-size: 13px;
      font-weight: 600;
    }

    @media (max-width: 760px) {
      .template-form,
      .form-grid {
        min-width: 0;
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TemplateMasterFormDialog {
  readonly data = inject<TemplateMasterDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TemplateMasterFormDialog>);
  private readonly api = inject(TemplateMasterApiService);

  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly pageOptions = signal<number[]>([]);

  readonly form = this.fb.nonNullable.group({
    templateCode: ['', [Validators.required, Validators.maxLength(100)]],
    templateName: ['', [Validators.required, Validators.maxLength(500)]],
    templateDescription: [''],
    originalFileName: ['', Validators.required],
    storedFileName: ['', Validators.required],
    filePath: ['', Validators.required],
    fileHash: ['', Validators.required],
    fileSizeBytes: ['', Validators.required],
    mimeType: ['application/pdf', Validators.required],
    pdfPageCount: ['', Validators.required],
    mappingPages: [[] as number[], Validators.required],
    printPages: [[] as number[], Validators.required],
    repeatRowsPerPage: ['1', [Validators.required, Validators.min(1)]],
    isDigitallySigned: ['N'],
    digitalSignatureDetails: [''],
    active: ['Y', Validators.required]
  });

  readonly title = this.data.mode === 'create'
    ? 'Create Template'
    : this.data.mode === 'edit'
      ? 'Edit Template'
      : 'View Template';

  constructor() {
    if (this.data.record) {
      const pageCount = Number(this.data.record.pdfPageCount || 0);
      this.setPageOptions(pageCount);
      this.form.patchValue({
        templateCode: this.data.record.templateCode,
        templateName: this.data.record.templateName,
        templateDescription: this.data.record.templateDescription,
        originalFileName: this.data.record.originalFileName,
        storedFileName: this.data.record.storedFileName,
        filePath: this.data.record.filePath,
        fileHash: this.data.record.fileHash,
        fileSizeBytes: this.data.record.fileSizeBytes,
        mimeType: this.data.record.mimeType || 'application/pdf',
        pdfPageCount: this.data.record.pdfPageCount,
        mappingPages: parsePages(this.data.record.mappingPageNumbers),
        printPages: parsePages(this.data.record.printPageNumbers),
        repeatRowsPerPage: this.data.record.repeatRowsPerPage || '1',
        isDigitallySigned: this.data.record.isDigitallySigned || 'N',
        digitalSignatureDetails: this.data.record.digitalSignatureDetails,
        active: normalizeActive(this.data.record.active)
      });
    }

    if (this.data.mode !== 'create') {
      this.form.controls.originalFileName.disable();
      this.form.controls.storedFileName.disable();
      this.form.controls.filePath.disable();
      this.form.controls.fileHash.disable();
      this.form.controls.fileSizeBytes.disable();
      this.form.controls.mimeType.disable();
      this.form.controls.pdfPageCount.disable();
    }

    if (this.data.mode === 'view') {
      this.form.disable();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.uploadError.set('');

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.uploadError.set('Only PDF files are allowed.');
      return;
    }

    this.uploading.set(true);
    this.api.uploadPdf(file).pipe(finalize(() => this.uploading.set(false))).subscribe({
      next: (result) => this.patchUpload(result),
      error: (error: Error) => this.uploadError.set(error.message)
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      mappingPageNumbers: value.mappingPages.join(','),
      printPageNumbers: value.printPages.join(',')
    } as TemplateMasterFormValue);
  }

  close(): void {
    this.dialogRef.close();
  }

  private patchUpload(result: TemplateUploadResult): void {
    this.setPageOptions(result.pdfPageCount);
    this.form.patchValue({
      originalFileName: result.originalFileName,
      storedFileName: result.storedFileName,
      filePath: result.filePath,
      fileHash: result.fileHash,
      fileSizeBytes: String(result.fileSizeBytes),
      mimeType: result.mimeType,
      pdfPageCount: String(result.pdfPageCount),
      mappingPages: [],
      printPages: []
    });
  }

  private setPageOptions(pageCount: number): void {
    const count = Math.max(0, Math.floor(pageCount));
    this.pageOptions.set(Array.from({ length: count }, (_, index) => index + 1));
  }
}

function parsePages(value: string): number[] {
  return value
    .split(',')
    .map((page) => Number(page.trim()))
    .filter((page) => Number.isFinite(page) && page > 0);
}

function normalizeActive(value: string): string {
  return value?.trim().toUpperCase() === 'N' ? 'N' : 'Y';
}
