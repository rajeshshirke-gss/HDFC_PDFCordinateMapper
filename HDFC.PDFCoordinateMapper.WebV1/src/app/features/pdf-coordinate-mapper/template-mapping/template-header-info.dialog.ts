import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TemplateMasterRecord } from '../template-master/template-master.models';

@Component({
  selector: 'app-template-header-info-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div mat-dialog-title class="dialog-title">
      <h2>Template Information</h2>
      <button mat-icon-button class="dialog-close" type="button" aria-label="Close dialog" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      @if (template) {
        <dl class="info-grid">
          <div>
            <dt>Template Code</dt>
            <dd>{{ template.templateCode || '-' }}</dd>
          </div>
          <div>
            <dt>Template Name</dt>
            <dd>{{ template.templateName || '-' }}</dd>
          </div>
          <div>
            <dt>PDF File</dt>
            <dd>{{ template.originalFileName || '-' }}</dd>
          </div>
          <div>
            <dt>Total Pages</dt>
            <dd>{{ template.pdfPageCount || '-' }}</dd>
          </div>
          <div>
            <dt>Mapping Pages</dt>
            <dd>{{ template.mappingPageNumbers || '-' }}</dd>
          </div>
          <div>
            <dt>Printing Pages</dt>
            <dd>{{ template.printPageNumbers || '-' }}</dd>
          </div>
          <div>
            <dt>Repeat Rows/Page</dt>
            <dd>{{ template.repeatRowsPerPage || '-' }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ template.status || template.active || '-' }}</dd>
          </div>
        </dl>
      } @else {
        <p class="empty">Select a template to view template information.</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" (click)="close()">Close</button>
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
      font-size: 20px;
      font-weight: 700;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 18px;
      min-width: min(620px, 78vw);
      margin: 0;
    }

    .info-grid div {
      min-width: 0;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--app-grid-border);
    }

    dt {
      margin: 0 0 4px;
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      color: var(--app-ink);
      font-size: 14px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .empty {
      margin: 0;
      color: var(--app-muted);
      font-weight: 600;
    }

    @media (max-width: 680px) {
      .info-grid {
        grid-template-columns: 1fr;
        min-width: 0;
      }
    }
  `]
})
export class TemplateHeaderInfoDialog {
  readonly template = inject<TemplateMasterRecord | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TemplateHeaderInfoDialog>);

  close(): void {
    this.dialogRef.close();
  }
}
