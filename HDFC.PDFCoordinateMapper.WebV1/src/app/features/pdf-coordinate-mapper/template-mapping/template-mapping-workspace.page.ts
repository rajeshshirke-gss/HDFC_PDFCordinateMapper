import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, firstValueFrom } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import { AuthStore } from '../../../core/auth/auth.store';
import { TemplateMasterApiService } from '../template-master/template-master-api.service';
import { TemplateMasterRecord } from '../template-master/template-master.models';
import { TemplateHeaderInfoDialog } from './template-header-info.dialog';
import { TemplateMappingApiService } from './template-mapping-api.service';
import { DockPanelId, FieldType, MappingFieldDraft, PageStatus, TemplateMappingFieldConfigDraft, ValidationIssue } from './template-mapping.models';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

@Component({
  selector: 'app-template-mapping-workspace-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <section class="mapping-studio" (click)="onWorkspaceClick($event)">
      <header class="studio-header">
        <button mat-icon-button type="button" aria-label="Back" matTooltip="Back" (click)="back()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-block">
          <h1>Template Mapping</h1>
          <span>{{ modeLabel() }}</span>
        </div>
        <div class="header-fields">
          <mat-form-field appearance="outline">
            <mat-label>Template</mat-label>
            <mat-select [disabled]="isViewMode()" [ngModel]="selectedTemplateId()" (ngModelChange)="selectTemplate($event)">
              @for (template of approvedTemplates(); track template.autoId) {
                <mat-option [value]="template.autoId">{{ template.templateCode }} - {{ template.templateName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Mapping Code</mat-label>
            <input matInput [readonly]="isViewMode()" [ngModel]="mappingCode()" (ngModelChange)="mappingCode.set($event)" maxlength="100" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Mapping Name</mat-label>
            <input matInput [readonly]="isViewMode()" [ngModel]="mappingName()" (ngModelChange)="mappingName.set($event)" maxlength="500" />
          </mat-form-field>
        </div>
        <div class="command-actions">
          <button mat-stroked-button type="button" matTooltip="Preview PDF with mapped values" [disabled]="!selectedTemplate() || !fields().length" (click)="openPrintPreview($event)">
            <mat-icon>print</mat-icon>
            Print Preview
          </button>
          <button mat-stroked-button type="button" matTooltip="Template information" (click)="openHeaderInfo($event)">
            <mat-icon>info</mat-icon>
            Header
          </button>
          <button mat-stroked-button type="button" (click)="validateAll()">Validate</button>
          <button mat-flat-button color="primary" class="app-primary-button" type="button" [disabled]="isViewMode() || saving()" (click)="submit()">
            <mat-icon>send</mat-icon>
            Submit
          </button>
        </div>
      </header>

      @if (errorMessage()) {
        <p class="alert error">{{ errorMessage() }}</p>
      }
      @if (lastMessage()) {
        <p class="alert success">{{ lastMessage() }}</p>
      }

      <main class="workspace-shell">
        <nav class="dock-strip left" aria-label="Mapping tools">
          @for (tab of leftTabs; track tab.id) {
            <button type="button" [class.active]="activeDock() === tab.id" [matTooltip]="tab.label" (click)="openDock(tab.id, $event)">
              <mat-icon>{{ tab.icon }}</mat-icon>
              <span>{{ tab.short }}</span>
            </button>
          }
        </nav>

        @if (isLeftDockOpen()) {
          <aside class="dock-panel left-panel" (click)="$event.stopPropagation()">
            <div class="dock-title">
              <h2>{{ dockTitle(activeDock()) }}</h2>
              <div>
                <button mat-icon-button type="button" matTooltip="Pin" (click)="togglePin(activeDock())">
                  <mat-icon>{{ pinnedDock() === activeDock() ? 'keep_off' : 'push_pin' }}</mat-icon>
                </button>
                <button mat-icon-button type="button" matTooltip="Close" (click)="closeDock()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            @if (activeDock() === 'pages') {
              <div class="page-list">
                @for (page of pageStatuses(); track page.pageNo) {
                  <button type="button" [class.selected]="selectedPageNo() === page.pageNo" (click)="selectPage(page.pageNo)">
                    <strong>Page {{ page.pageNo }}</strong>
                    <span>{{ page.fieldCount }} fields</span>
                    <em [class.issue]="page.status === 'Has Issues'">{{ page.status }}</em>
                  </button>
                }
              </div>
            }

            @if (activeDock() === 'fieldNames') {
              <div class="header-list">
                @for (fieldName of recentFieldNames(); track fieldName) {
                  <button type="button" [class.selected]="fieldNameInput() === fieldName" (click)="useFieldName(fieldName)">
                    <mat-icon>text_fields</mat-icon>
                    <span>{{ fieldName }}</span>
                  </button>
                } @empty {
                  <p class="panel-empty">Enter a field/header name in the toolbar, then draw on the PDF.</p>
                }
              </div>
            }

            @if (activeDock() === 'pageFields') {
              <div class="field-list">
                @for (field of fieldsForSelectedPage(); track field.fieldUid) {
                  <button type="button" [class.selected]="selectedFieldUid() === field.fieldUid" (click)="selectField(field.fieldUid)">
                    <strong>{{ field.fieldName }}</strong>
                    <span>{{ field.fieldType }} | {{ field.fieldWidth }} x {{ field.fieldHeight }}</span>
                  </button>
                }
              </div>
            }
          </aside>
        }

        <section class="pdf-work-area">
          <div class="pdf-toolbar">
            <div class="page-command">
              <button mat-icon-button type="button" matTooltip="Previous page" (click)="previousPage($event)">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span>Page {{ selectedPageNo() || '-' }}</span>
              <button mat-icon-button type="button" matTooltip="Next page" (click)="nextPage($event)">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
            <div class="tool-command">
              <mat-form-field appearance="outline" class="field-name-input">
                <mat-label>Field/Header Name</mat-label>
                <input matInput [readonly]="isViewMode()" [ngModel]="fieldNameInput()" (ngModelChange)="fieldNameInput.set($event)" maxlength="200" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Field Type</mat-label>
                <mat-select [disabled]="isViewMode()" [ngModel]="selectedFieldType()" (ngModelChange)="selectedFieldType.set($event)">
                  @for (type of fieldTypes; track type) {
                    <mat-option [value]="type">{{ type }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <span class="hint">{{ fieldNameInput().trim() ? 'Click to place or drag to draw field.' : 'Enter field/header name before drawing.' }}</span>
            </div>
          </div>

          <div class="pdf-stage" [class.ready]="canDrawField()">
            @if (!selectedTemplate()) {
              <div class="stage-empty">Select a template to load configured mapping pages.</div>
            } @else if (!selectedPageNo()) {
              <div class="stage-empty">Select a mapping page to begin.</div>
            } @else {
              <div
                class="paper"
                [style.width.px]="pageSize().width"
                [style.height.px]="pageSize().height"
                (mousedown)="beginDraw($event)"
                (mousemove)="continuePointerAction($event)"
                (mouseup)="finishPointerAction($event)"
                (mouseleave)="finishPointerAction($event)">
                <canvas #pdfCanvas class="pdf-canvas"></canvas>
                @if (pdfLoading()) {
                  <div class="pdf-status">Loading PDF page...</div>
                }
                @if (pdfError()) {
                  <div class="pdf-status error">{{ pdfError() }}</div>
                }
                <div class="mapping-overlay">
                  <div class="paper-header">Template Page {{ selectedPageNo() }}</div>
                  @for (field of fieldsForSelectedPage(); track field.fieldUid) {
                    @if (field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID') {
                      @for (box of gridCanvasBoxes(field); track box.index) {
                        <div
                          class="grid-canvas-box"
                          [class.selected]="selectedFieldUid() === field.fieldUid"
                          [style.left.%]="box.x"
                          [style.top.%]="box.y"
                          [style.width.%]="box.width"
                          [style.height.%]="box.height"
                          (mousedown)="beginMove(field.fieldUid, $event)"
                          (click)="selectField(field.fieldUid, $event)">
                          {{ box.value }}
                        </div>
                      }
                    }
                    @if (field.fieldType === 'OPTION_GROUP') {
                      @for (option of optionCanvasMarks(field); track option.configSequence) {
                        <div
                          class="option-canvas-mark"
                          [class.selected]="selectedFieldUid() === field.fieldUid"
                          [style.left.%]="option.optionXCoordinate"
                          [style.top.%]="option.optionYCoordinate"
                          [style.width.%]="option.optionWidth"
                          [style.height.%]="option.optionHeight"
                          (mousedown)="beginOptionMove(field.fieldUid, option.configSequence, $event)"
                          (click)="selectField(field.fieldUid, $event)">
                          {{ option.optionLabel || option.optionValue }}
                        </div>
                      }
                    }
                    <div
                      class="field-box"
                      [class.selected]="selectedFieldUid() === field.fieldUid"
                      [class.grid-field]="field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID'"
                      [class.option-field]="field.fieldType === 'OPTION_GROUP'"
                      [style.left.%]="field.xCoordinate"
                      [style.top.%]="field.yCoordinate"
                      [style.width.%]="fieldCanvasWidth(field)"
                      [style.height.%]="field.fieldHeight"
                      (mousedown)="beginMove(field.fieldUid, $event)"
                      (click)="selectField(field.fieldUid, $event)">
                      @if (field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID') {
                        <span>{{ field.fieldName }}</span>
                      } @else if (field.fieldType === 'OPTION_GROUP') {
                        <span>{{ field.fieldName }}</span>
                      } @else {
                        <span>{{ canvasPreviewValue(field) }}</span>
                      }
                      @if (!isViewMode() && selectedFieldUid() === field.fieldUid) {
                        <i class="resize-handle nw" (mousedown)="beginResize(field.fieldUid, 'nw', $event)"></i>
                        <i class="resize-handle ne" (mousedown)="beginResize(field.fieldUid, 'ne', $event)"></i>
                        <i class="resize-handle sw" (mousedown)="beginResize(field.fieldUid, 'sw', $event)"></i>
                        <i class="resize-handle se" (mousedown)="beginResize(field.fieldUid, 'se', $event)"></i>
                      }
                    </div>
                  }
                  @if (draftRect(); as draft) {
                    <div class="field-box draft" [style.left.%]="draft.x" [style.top.%]="draft.y" [style.width.%]="draft.width" [style.height.%]="draft.height">
                      {{ fieldNameInput() }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        @if (isRightDockOpen()) {
          <aside class="dock-panel right-panel" (click)="$event.stopPropagation()">
            <div class="dock-title">
              <h2>{{ dockTitle(activeDock()) }}</h2>
              <div>
                <button mat-icon-button type="button" matTooltip="Pin" (click)="togglePin(activeDock())">
                  <mat-icon>{{ pinnedDock() === activeDock() ? 'keep_off' : 'push_pin' }}</mat-icon>
                </button>
                <button mat-icon-button type="button" matTooltip="Close" (click)="closeDock()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            @if (activeDock() === 'inspector' || activeDock() === 'typeConfig') {
              @if (selectedField(); as field) {
                <div class="inspector-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Field Code</mat-label>
                    <input matInput [readonly]="isViewMode()" [ngModel]="field.fieldCode" (ngModelChange)="updateSelectedField('fieldCode', $event)" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Field Name</mat-label>
                    <input matInput [readonly]="isViewMode()" [ngModel]="field.fieldName" (ngModelChange)="updateSelectedField('fieldName', $event)" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Excel Header</mat-label>
                    <input matInput readonly [value]="field.excelHeaderName" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Preview Value</mat-label>
                    <input matInput [readonly]="isViewMode()" [ngModel]="field.sampleValue || ''" (ngModelChange)="updateSelectedField('sampleValue', $event)" />
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Field Type</mat-label>
                    <mat-select [disabled]="isViewMode()" [ngModel]="field.fieldType" (ngModelChange)="updateSelectedField('fieldType', $event)">
                      @for (type of fieldTypes; track type) {
                        <mat-option [value]="type">{{ type }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  @if (activeDock() === 'typeConfig') {
                    <div class="type-config-form">
                      @if (primaryConfig(field); as config) {
                        @if (field.fieldType === 'TEXT_FIELD' || field.fieldType === 'COMPUTED_FIELD') {
                          <mat-form-field appearance="outline">
                            <mat-label>Font Name</mat-label>
                            <input matInput [readonly]="isViewMode()" [ngModel]="config.fontName ?? 'Arial'" (ngModelChange)="updateSelectedConfig('fontName', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Font Size</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.fontSize ?? 11" (ngModelChange)="updateSelectedConfigNumber('fontSize', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Text Alignment</mat-label>
                            <mat-select [disabled]="isViewMode()" [ngModel]="config.textAlignment ?? 'LEFT'" (ngModelChange)="updateSelectedConfig('textAlignment', $event)">
                              <mat-option value="LEFT">LEFT</mat-option>
                              <mat-option value="CENTER">CENTER</mat-option>
                              <mat-option value="RIGHT">RIGHT</mat-option>
                            </mat-select>
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Max Characters</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.maxCharacters ?? ''" (ngModelChange)="updateSelectedConfigNumber('maxCharacters', $event)" />
                          </mat-form-field>
                          @if (field.fieldType === 'COMPUTED_FIELD') {
                            <mat-form-field appearance="outline" class="wide-control">
                              <mat-label>Computed Expression</mat-label>
                              <textarea matInput rows="3" [readonly]="isViewMode()" [ngModel]="config.computedExpression ?? ''" (ngModelChange)="updateSelectedConfig('computedExpression', $event)"></textarea>
                            </mat-form-field>
                            <mat-form-field appearance="outline">
                              <mat-label>Output Format</mat-label>
                              <input matInput [readonly]="isViewMode()" [ngModel]="config.outputFormat ?? ''" (ngModelChange)="updateSelectedConfig('outputFormat', $event)" />
                            </mat-form-field>
                          }
                        }

                        @if (field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID') {
                          <mat-form-field appearance="outline">
                            <mat-label>Box Width</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.boxWidth ?? field.fieldWidth" (ngModelChange)="updateSelectedConfigNumber('boxWidth', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Box Height</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.boxHeight ?? field.fieldHeight" (ngModelChange)="updateSelectedConfigNumber('boxHeight', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Box Spacing</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.boxSpacing ?? 2" (ngModelChange)="updateSelectedConfigNumber('boxSpacing', $event)" />
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Max Boxes</mat-label>
                            <input matInput type="number" [readonly]="isViewMode()" [ngModel]="config.maxBoxes ?? 10" (ngModelChange)="updateSelectedConfigNumber('maxBoxes', $event)" />
                          </mat-form-field>
                          @if (field.fieldType === 'DATE_GRID') {
                            <mat-form-field appearance="outline">
                              <mat-label>Date Format</mat-label>
                              <input matInput [readonly]="isViewMode()" [ngModel]="config.dateFormat ?? 'DDMMYYYY'" (ngModelChange)="updateSelectedConfig('dateFormat', $event)" />
                            </mat-form-field>
                            <mat-form-field appearance="outline">
                              <mat-label>Date Separator</mat-label>
                              <input matInput [readonly]="isViewMode()" [ngModel]="config.dateSeparator ?? '/'" (ngModelChange)="updateSelectedConfig('dateSeparator', $event)" />
                            </mat-form-field>
                          }
                        }

                        @if (field.fieldType === 'OPTION_GROUP') {
                          <mat-form-field appearance="outline">
                            <mat-label>Selection Mode</mat-label>
                            <mat-select [disabled]="isViewMode()" [ngModel]="config.selectionMode ?? 'SINGLE'" (ngModelChange)="updateSelectedConfig('selectionMode', $event)">
                              <mat-option value="SINGLE">SINGLE</mat-option>
                              <mat-option value="MULTIPLE">MULTIPLE</mat-option>
                            </mat-select>
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Mark Value</mat-label>
                            <input matInput [readonly]="isViewMode()" [ngModel]="config.markValue ?? 'X'" (ngModelChange)="updateSelectedConfig('markValue', $event)" />
                          </mat-form-field>
                          <div class="option-config-list">
                            @for (option of field.configs; track option.configSequence) {
                              <div class="option-row">
                                <label>
                                  <span>Value</span>
                                  <input [readonly]="isViewMode()" [ngModel]="option.optionValue ?? ''" (ngModelChange)="updateOptionConfig(option.configSequence, 'optionValue', $event)" />
                                </label>
                                <label>
                                  <span>Label</span>
                                  <input [readonly]="isViewMode()" [ngModel]="option.optionLabel ?? ''" (ngModelChange)="updateOptionConfig(option.configSequence, 'optionLabel', $event)" />
                                </label>
                                <label>
                                  <span>X</span>
                                  <input type="number" [readonly]="isViewMode()" [ngModel]="option.optionXCoordinate ?? field.xCoordinate" (ngModelChange)="updateOptionConfigNumber(option.configSequence, 'optionXCoordinate', $event)" />
                                </label>
                                <label>
                                  <span>Y</span>
                                  <input type="number" [readonly]="isViewMode()" [ngModel]="option.optionYCoordinate ?? field.yCoordinate" (ngModelChange)="updateOptionConfigNumber(option.configSequence, 'optionYCoordinate', $event)" />
                                </label>
                                <button mat-icon-button type="button" [disabled]="isViewMode()" matTooltip="Remove option" (click)="removeOptionConfig(option.configSequence)">
                                  <mat-icon>delete</mat-icon>
                                </button>
                              </div>
                            }
                            <button mat-stroked-button type="button" [disabled]="isViewMode()" (click)="addOptionConfig()">
                              <mat-icon>add</mat-icon>
                              Add Option
                            </button>
                          </div>
                        }
                      }
                    </div>
                  }
                  <div class="coordinate-grid">
                    <span>X {{ field.xCoordinate }}</span>
                    <span>Y {{ field.yCoordinate }}</span>
                    <span>W {{ field.fieldWidth }}</span>
                    <span>H {{ field.fieldHeight }}</span>
                  </div>
                  <button mat-stroked-button color="warn" type="button" [disabled]="isViewMode()" (click)="deleteSelectedField()">
                    <mat-icon>delete</mat-icon>
                    Delete Field
                  </button>
                </div>
              } @else {
                <p class="panel-empty">Select a mapped field to edit properties.</p>
              }
            }

            @if (activeDock() === 'issues') {
              <div class="issues-list">
                @for (issue of validationIssues(); track issue.message) {
                  <p><strong>{{ issue.pageNo ? 'Page ' + issue.pageNo : 'Mapping' }}</strong>{{ issue.message }}</p>
                }
                @if (!validationIssues().length) {
                  <p class="panel-empty">No validation issues.</p>
                }
              </div>
            }

            @if (activeDock() === 'review') {
              <div class="review-list">
                <p><strong>Template</strong>{{ selectedTemplate()?.templateName || '-' }}</p>
                <p><strong>Mapping Code</strong>{{ mappingCode() || '-' }}</p>
                <p><strong>Mapping Name</strong>{{ mappingName() || '-' }}</p>
                <p><strong>Total Fields</strong>{{ fields().length }}</p>
                @for (page of pageStatuses(); track page.pageNo) {
                  <p><strong>Page {{ page.pageNo }}</strong>{{ page.fieldCount }} fields | {{ page.status }}</p>
                }
              </div>
            }
          </aside>
        }

        <nav class="dock-strip right" aria-label="Mapping details">
          @for (tab of rightTabs; track tab.id) {
            <button type="button" [class.active]="activeDock() === tab.id" [matTooltip]="tab.label" (click)="openDock(tab.id, $event)">
              <mat-icon>{{ tab.icon }}</mat-icon>
              <span>{{ tab.short }}</span>
            </button>
          }
        </nav>
      </main>
    </section>
  `,
  styles: [`
    .mapping-studio {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 8px;
      height: calc(100vh - 88px);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .studio-header {
      display: grid;
      grid-template-columns: auto auto minmax(360px, 1fr) auto;
      align-items: center;
      gap: 12px;
      min-width: 0;
      padding: 8px 0;
    }

    .title-block {
      display: grid;
      gap: 2px;
      min-width: 150px;
    }

    h1,
    h2 {
      margin: 0;
      color: var(--app-heading);
      font-weight: 700;
      line-height: 1.2;
    }

    h1 {
      font-size: 22px;
    }

    .title-block span {
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .header-fields,
    .command-actions,
    .pdf-toolbar,
    .page-command,
    .tool-command {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .header-fields mat-form-field {
      width: min(31%, 280px);
      min-width: 160px;
    }

    .command-actions {
      justify-content: flex-end;
    }

    .command-actions button {
      white-space: nowrap;
    }

    .alert {
      margin: 0;
      padding: 9px 12px;
      border-radius: 6px;
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

    .workspace-shell {
      position: relative;
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) 40px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 6px;
      background: var(--app-surface);
    }

    .dock-strip {
      z-index: 4;
      display: grid;
      align-content: start;
      gap: 4px;
      padding: 6px 4px;
      border-color: var(--app-border);
      background: #eef2f7;
    }

    .dock-strip.left {
      border-right: 1px solid var(--app-border);
    }

    .dock-strip.right {
      border-left: 1px solid var(--app-border);
    }

    .dock-strip button {
      display: grid;
      place-items: center;
      gap: 3px;
      width: 32px;
      min-height: 78px;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: var(--app-primary);
      cursor: pointer;
    }

    .dock-strip button.active,
    .dock-strip button:hover {
      border-color: var(--app-primary);
      background: #ffffff;
    }

    .dock-strip mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .dock-strip span {
      writing-mode: vertical-rl;
      color: inherit;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .dock-panel {
      position: absolute;
      z-index: 3;
      top: 0;
      bottom: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      width: min(340px, calc(100% - 80px));
      padding: 10px;
      border-color: var(--app-border);
      background: var(--app-surface);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.16);
      overflow: hidden;
    }

    .left-panel {
      left: 40px;
      border-right: 1px solid var(--app-border);
    }

    .right-panel {
      right: 40px;
      width: min(460px, calc(100% - 80px));
      border-left: 1px solid var(--app-border);
    }

    .dock-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--app-grid-border);
    }

    .dock-title h2 {
      font-size: 16px;
    }

    .pdf-work-area {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      background: #f8fafc;
    }

    .pdf-toolbar {
      justify-content: space-between;
      min-height: 56px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--app-grid-border);
      background: var(--app-surface);
    }

    .tool-command mat-form-field {
      width: 180px;
    }

    .tool-command .field-name-input {
      width: 260px;
    }

    .hint {
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .pdf-stage {
      display: grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      padding: 16px;
      overflow: auto;
      cursor: default;
    }

    .pdf-stage.ready {
      cursor: crosshair;
    }

    .stage-empty {
      color: var(--app-muted);
      font-weight: 700;
      text-align: center;
    }

    .paper {
      position: relative;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      overflow: hidden;
    }

    .pdf-canvas {
      display: block;
      width: 100%;
      height: 100%;
      background: #ffffff;
    }

    .pdf-status {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.82);
      color: var(--app-muted);
      font-weight: 700;
      text-align: center;
    }

    .pdf-status.error {
      color: #b42318;
    }

    .mapping-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: auto;
    }

    .paper-header {
      position: absolute;
      inset: 18px 24px auto;
      height: 44px;
      border-bottom: 2px solid #e5e7eb;
      color: var(--app-muted);
      font-size: 13px;
      font-weight: 700;
      line-height: 44px;
    }

    .field-box {
      position: absolute;
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 24px;
      padding: 2px 4px;
      border: 2px solid #00539f;
      border-radius: 4px;
      background: rgba(0, 83, 159, 0.12);
      color: #003b71;
      cursor: pointer;
      font-size: 11px;
      font-weight: 800;
      user-select: none;
    }

    .field-box span,
    .field-box.draft {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .field-box.selected {
      border-color: #e31837;
      background: rgba(227, 24, 55, 0.12);
      color: #9b1220;
    }

    .field-box.draft {
      border-style: dashed;
      background: rgba(22, 131, 58, 0.12);
      color: #11612d;
      pointer-events: none;
    }

    .field-box.grid-field {
      padding: 0;
      border-style: dashed;
      border-color: #0f766e;
      background: rgba(15, 118, 110, 0.04);
      color: #0f3f3a;
    }

    .field-box.option-field {
      border-style: dashed;
      background: rgba(0, 83, 159, 0.06);
    }

    .grid-canvas-box {
      position: absolute;
      z-index: 2;
      display: grid;
      place-items: center;
      min-width: 8px;
      min-height: 10px;
      border: 1px solid #0f766e;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.72);
      color: #0f3f3a;
      cursor: pointer;
      font-size: 13px;
      font-weight: 800;
      overflow: hidden;
    }

    .grid-canvas-box.selected {
      border-color: #e31837;
      background: rgba(227, 24, 55, 0.12);
      color: #9b1220;
    }

    .option-canvas-mark {
      position: absolute;
      z-index: 2;
      display: grid;
      place-items: center;
      min-width: 18px;
      min-height: 18px;
      border: 2px solid #7c3aed;
      border-radius: 4px;
      background: rgba(124, 58, 237, 0.12);
      color: #4c1d95;
      cursor: pointer;
      font-size: 10px;
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-canvas-mark.selected {
      border-color: #e31837;
      background: rgba(227, 24, 55, 0.12);
      color: #9b1220;
    }

    .resize-handle {
      position: absolute;
      width: 9px;
      height: 9px;
      border: 1px solid #ffffff;
      border-radius: 50%;
      background: #e31837;
    }

    .resize-handle.nw {
      top: -5px;
      left: -5px;
      cursor: nwse-resize;
    }

    .resize-handle.ne {
      top: -5px;
      right: -5px;
      cursor: nesw-resize;
    }

    .resize-handle.sw {
      bottom: -5px;
      left: -5px;
      cursor: nesw-resize;
    }

    .resize-handle.se {
      right: -5px;
      bottom: -5px;
      cursor: nwse-resize;
    }

    .page-list,
    .header-list,
    .field-list,
    .inspector-form,
    .issues-list,
    .review-list {
      display: grid;
      align-content: start;
      gap: 8px;
      min-height: 0;
      overflow: auto;
      padding-top: 10px;
    }

    .page-list button,
    .header-list button,
    .field-list button {
      display: grid;
      gap: 3px;
      width: 100%;
      min-height: 52px;
      padding: 9px 10px;
      border: 1px solid var(--app-grid-border);
      border-radius: 6px;
      background: var(--app-surface);
      color: var(--app-ink);
      cursor: pointer;
      text-align: left;
    }

    .header-list button {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
    }

    .page-list button.selected,
    .header-list button.selected,
    .field-list button.selected {
      border-color: var(--app-primary);
      background: var(--app-primary-row-hover);
    }

    .page-list span,
    .field-list span {
      color: var(--app-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .page-list em {
      color: #16833a;
      font-size: 12px;
      font-style: normal;
      font-weight: 700;
    }

    .page-list em.issue {
      color: #b42318;
    }

    .coordinate-grid,
    .review-list p,
    .issues-list p {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
    }

    .coordinate-grid span,
    .review-list p,
    .issues-list p {
      padding: 8px;
      border: 1px solid var(--app-grid-border);
      border-radius: 4px;
      background: #f8fafc;
      font-size: 12px;
      font-weight: 700;
    }

    .type-config-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--app-grid-border);
      border-radius: 6px;
      background: #f8fafc;
    }

    .type-config-form .wide-control,
    .option-config-list {
      grid-column: 1 / -1;
    }

    .option-config-list {
      display: grid;
      gap: 10px;
    }

    .option-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px;
      align-items: end;
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--app-grid-border);
      border-radius: 6px;
      background: var(--app-surface);
    }

    .option-row label {
      display: grid;
      gap: 4px;
      min-width: 0;
    }

    .option-row label:nth-child(1) {
      grid-column: 1;
      grid-row: 1;
    }

    .option-row label:nth-child(2) {
      grid-column: 2;
      grid-row: 1;
    }

    .option-row label:nth-child(3) {
      grid-column: 1;
      grid-row: 2;
    }

    .option-row label:nth-child(4) {
      grid-column: 2;
      grid-row: 2;
    }

    .option-row label span {
      color: var(--app-muted);
      font-size: 11px;
      font-weight: 800;
    }

    .option-row input {
      min-width: 0;
      width: 100%;
      height: 36px;
      padding: 0 8px;
      border: 1px solid var(--app-grid-border);
      border-radius: 4px;
      background: var(--app-surface);
      font: inherit;
    }

    .option-row button {
      grid-column: 3;
      grid-row: 1 / span 2;
      align-self: center;
    }

    .review-list strong,
    .issues-list strong {
      color: var(--app-muted);
      margin-right: 8px;
    }

    .panel-empty {
      margin: 10px 0 0;
      color: var(--app-muted);
      font-weight: 600;
    }

    @media (max-width: 1100px) {
      .studio-header {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .header-fields,
      .command-actions {
        grid-column: 1 / -1;
      }

      .header-fields mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class TemplateMappingWorkspacePage implements OnInit, AfterViewInit {
  @ViewChild('pdfCanvas') private pdfCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly templateApi = inject(TemplateMasterApiService);
  private readonly mappingApi = inject(TemplateMappingApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  readonly leftTabs: Array<{ id: DockPanelId; label: string; short: string; icon: string }> = [
    { id: 'pages', label: 'Pages', short: 'Pages', icon: 'article' },
    { id: 'fieldNames', label: 'Field Names', short: 'Names', icon: 'edit_note' },
    { id: 'pageFields', label: 'Page Fields', short: 'Fields', icon: 'list_alt' }
  ];
  readonly rightTabs: Array<{ id: DockPanelId; label: string; short: string; icon: string }> = [
    { id: 'inspector', label: 'Field Inspector', short: 'Inspect', icon: 'tune' },
    { id: 'typeConfig', label: 'Type Config', short: 'Config', icon: 'rule' },
    { id: 'issues', label: 'Issues', short: 'Issues', icon: 'error_outline' },
    { id: 'review', label: 'Review', short: 'Review', icon: 'fact_check' }
  ];
  readonly fieldTypes: FieldType[] = ['TEXT_FIELD', 'CHAR_GRID', 'DATE_GRID', 'OPTION_GROUP', 'COMPUTED_FIELD'];

  readonly approvedTemplates = signal<TemplateMasterRecord[]>([]);
  readonly currentAutoId = signal('');
  readonly currentMstColId = signal('');
  readonly selectedTemplateId = signal('');
  readonly mappingCode = signal('');
  readonly mappingName = signal('');
  readonly selectedPageNo = signal<number | null>(null);
  readonly fieldNameInput = signal('');
  readonly selectedFieldType = signal<FieldType>('TEXT_FIELD');
  readonly fields = signal<MappingFieldDraft[]>([]);
  readonly selectedFieldUid = signal('');
  readonly validationIssues = signal<ValidationIssue[]>([]);
  readonly activeDock = signal<DockPanelId | null>('pages');
  readonly pinnedDock = signal<DockPanelId | null>(null);
  readonly draftRect = signal<CoordinateRect | null>(null);
  readonly pageSize = signal({ width: 780, height: 1103 });
  readonly pdfLoading = signal(false);
  readonly pdfError = signal('');
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly lastMessage = signal('');

  private pointerAction: PointerAction | null = null;
  private pdfDocument: PDFDocumentProxy | null = null;
  private renderVersion = 0;
  private activePaperRect: DOMRect | null = null;

  readonly selectedTemplate = computed(() => this.approvedTemplates().find((template) => template.autoId === this.selectedTemplateId()) ?? null);
  readonly mappingPages = computed(() => {
    const template = this.selectedTemplate();
    if (!template) return [];
    const configuredPages = parsePages(template.mappingPageNumbers);
    if (configuredPages.length) return configuredPages;
    const pageCount = Number(template.pdfPageCount || 0);
    return Array.from({ length: Math.max(0, pageCount) }, (_, index) => index + 1);
  });
  readonly recentFieldNames = computed(() => uniqueFieldNames(this.fields()));
  readonly fieldsForSelectedPage = computed(() => this.fields().filter((field) => field.pageNo === this.selectedPageNo()));
  readonly selectedField = computed(() => this.fields().find((field) => field.fieldUid === this.selectedFieldUid()) ?? null);
  readonly pageStatuses = computed<PageStatus[]>(() => this.mappingPages().map((pageNo) => {
    const pageFields = this.fields().filter((field) => field.pageNo === pageNo);
    const hasIssue = this.validationIssues().some((issue) => issue.pageNo === pageNo);
    return {
      pageNo,
      fieldCount: pageFields.length,
      status: hasIssue ? 'Has Issues' : pageFields.length ? 'In Progress' : 'Not Started'
    };
  }));

  ngOnInit(): void {
    const routeMode = this.route.snapshot.routeConfig?.path || '';
    this.templateApi.loadTemplates().subscribe({
      next: (snapshot) => {
        this.approvedTemplates.set(snapshot.approvedTemplates.length ? snapshot.approvedTemplates : snapshot.templates);
        this.loadExistingMappingIfNeeded();
      },
      error: (error: Error) => this.errorMessage.set(error.message)
    });

    if (routeMode.includes('view')) {
      this.activeDock.set('review');
    }
  }

  ngAfterViewInit(): void {
    this.renderSelectedPage();
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.pointerAction) return;
    this.continuePointerAction(event);
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(event: MouseEvent): void {
    if (!this.pointerAction) return;
    this.finishPointerAction(event);
  }

  modeLabel(): string {
    if (this.isViewMode()) return 'View Mode';
    if (this.route.snapshot.routeConfig?.path?.includes('edit')) return 'Edit Mode';
    return 'Create Mode';
  }

  isViewMode(): boolean {
    return Boolean(this.route.snapshot.routeConfig?.path?.includes('view'));
  }

  isEditMode(): boolean {
    return Boolean(this.route.snapshot.routeConfig?.path?.includes('edit'));
  }

  selectTemplate(templateId: string): void {
    this.selectedTemplateId.set(templateId);
    this.fields.set([]);
    this.selectedFieldUid.set('');
    this.fieldNameInput.set('');
    const firstPage = this.mappingPages()[0] ?? null;
    this.selectedPageNo.set(firstPage);
    this.activeDock.set('pages');
    this.loadSelectedTemplatePdf();
  }

  selectPage(pageNo: number): void {
    if (!this.mappingPages().includes(pageNo)) return;
    this.selectedPageNo.set(pageNo);
    this.selectedFieldUid.set('');
    this.draftRect.set(null);
    this.pointerAction = null;
    this.renderSelectedPage();
  }

  useFieldName(fieldName: string): void {
    this.fieldNameInput.set(fieldName);
  }

  openDock(panel: DockPanelId, event: Event): void {
    event.stopPropagation();
    this.activeDock.set(panel);
  }

  closeDock(): void {
    this.activeDock.set(null);
    this.pinnedDock.set(null);
  }

  togglePin(panel: DockPanelId | null): void {
    if (!panel) return;
    this.pinnedDock.set(this.pinnedDock() === panel ? null : panel);
  }

  onWorkspaceClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.field-box') || target.closest('.dock-panel') || target.closest('.dock-strip') || target.closest('.studio-header')) return;
    if (!this.pinnedDock()) {
      this.activeDock.set(null);
    }
  }

  isLeftDockOpen(): boolean {
    return this.activeDock() === 'pages' || this.activeDock() === 'fieldNames' || this.activeDock() === 'pageFields';
  }

  isRightDockOpen(): boolean {
    return this.activeDock() === 'inspector' || this.activeDock() === 'typeConfig' || this.activeDock() === 'issues' || this.activeDock() === 'review';
  }

  dockTitle(panel: DockPanelId | null): string {
    return [...this.leftTabs, ...this.rightTabs].find((tab) => tab.id === panel)?.label || '';
  }

  canDrawField(): boolean {
    return Boolean(!this.isViewMode() && this.selectedTemplate() && this.selectedPageNo() && this.fieldNameInput().trim());
  }

  beginDraw(event: MouseEvent): void {
    if (!this.canDrawField() || isOverlayFieldTarget(event.target)) return;
    const point = this.paperPoint(event);
    if (!point) return;
    event.preventDefault();
    this.pointerAction = { kind: 'draw', startX: point.x, startY: point.y };
    this.draftRect.set({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  beginMove(fieldUid: string, event: MouseEvent): void {
    const point = this.paperPoint(event);
    const field = this.fields().find((item) => item.fieldUid === fieldUid);
    if (!point || !field) return;
    event.preventDefault();
    event.stopPropagation();
    this.showFieldInspector(fieldUid);
    if (this.isViewMode()) return;
    this.pointerAction = {
      kind: 'move',
      fieldUid,
      startX: point.x,
      startY: point.y,
      original: toRect(field)
    };
  }

  beginResize(fieldUid: string, corner: ResizeCorner, event: MouseEvent): void {
    if (this.isViewMode()) return;
    const point = this.paperPoint(event);
    const field = this.fields().find((item) => item.fieldUid === fieldUid);
    if (!point || !field) return;
    event.preventDefault();
    event.stopPropagation();
    this.showFieldInspector(fieldUid);
    this.pointerAction = {
      kind: 'resize',
      fieldUid,
      corner,
      startX: point.x,
      startY: point.y,
      original: toRect(field)
    };
  }

  beginOptionMove(fieldUid: string, configSequence: number, event: MouseEvent): void {
    if (this.isViewMode()) return;
    const point = this.paperPoint(event);
    const field = this.fields().find((item) => item.fieldUid === fieldUid);
    const option = field?.configs.find((item) => item.configSequence === configSequence);
    if (!point || !field || !option) return;
    event.preventDefault();
    event.stopPropagation();
    this.showFieldTypeConfig(fieldUid);
    this.pointerAction = {
      kind: 'optionMove',
      fieldUid,
      configSequence,
      startX: point.x,
      startY: point.y,
      originalX: option.optionXCoordinate ?? field.xCoordinate,
      originalY: option.optionYCoordinate ?? field.yCoordinate,
      width: option.optionWidth ?? 3,
      height: option.optionHeight ?? 2
    };
  }

  continuePointerAction(event: MouseEvent): void {
    if (!this.pointerAction) return;
    const point = this.paperPoint(event);
    if (!point) return;
    event.preventDefault();

    if (this.pointerAction.kind === 'draw') {
      this.draftRect.set(normalizeRect(this.pointerAction.startX, this.pointerAction.startY, point.x, point.y));
      return;
    }

    if (this.pointerAction.kind === 'move') {
      const deltaX = point.x - this.pointerAction.startX;
      const deltaY = point.y - this.pointerAction.startY;
      const next = {
        ...this.pointerAction.original,
        x: clamp(this.pointerAction.original.x + deltaX, 0, 100 - this.pointerAction.original.width),
        y: clamp(this.pointerAction.original.y + deltaY, 0, 100 - this.pointerAction.original.height)
      };
      this.patchFieldRect(this.pointerAction.fieldUid, next);
      return;
    }

    if (this.pointerAction.kind === 'optionMove') {
      const deltaX = point.x - this.pointerAction.startX;
      const deltaY = point.y - this.pointerAction.startY;
      this.patchOptionConfig(this.pointerAction.configSequence, (config) => ({
        ...config,
        optionXCoordinate: round2(clamp(this.pointerAction.originalX + deltaX, 0, 100 - this.pointerAction.width)),
        optionYCoordinate: round2(clamp(this.pointerAction.originalY + deltaY, 0, 100 - this.pointerAction.height))
      }));
      return;
    }

    const next = resizeRect(this.pointerAction.original, this.pointerAction.corner, point);
    this.patchFieldRect(this.pointerAction.fieldUid, next);
  }

  finishPointerAction(event: MouseEvent): void {
    if (!this.pointerAction) return;
    event.preventDefault();

    if (this.pointerAction.kind === 'draw') {
      const draft = this.draftRect();
      this.draftRect.set(null);
      if (draft && draft.width >= 2 && draft.height >= 1.2) {
        this.addFieldFromRect(draft);
      } else {
        this.addFieldFromRect(defaultRectAt(this.pointerAction.startX, this.pointerAction.startY));
      }
    }

    this.pointerAction = null;
    this.activePaperRect = null;
  }

  private addFieldFromRect(rect: CoordinateRect): void {
    const headerName = this.fieldNameInput().trim();
    const field: MappingFieldDraft = {
      fieldUid: `${Date.now()}_${Math.round(Math.random() * 10000)}`,
      fieldCode: normalizeCode(headerName),
      fieldName: headerName,
      excelHeaderName: headerName,
      fieldType: this.selectedFieldType(),
      pageNo: this.selectedPageNo() || 1,
      xCoordinate: round2(rect.x),
      yCoordinate: round2(rect.y),
      fieldWidth: round2(rect.width),
      fieldHeight: round2(rect.height),
      isRequired: true,
      sampleValue: headerName,
      configs: []
    };
    const configuredField = ensureFieldConfigs(field);
    this.fields.update((items) => [...items, configuredField]);
    this.showFieldInspector(configuredField.fieldUid);
  }

  private patchFieldRect(fieldUid: string, rect: CoordinateRect): void {
    this.fields.update((items) => items.map((field) => field.fieldUid === fieldUid
      ? {
        ...field,
        xCoordinate: round2(rect.x),
        yCoordinate: round2(rect.y),
        fieldWidth: round2(rect.width),
        fieldHeight: round2(rect.height)
      }
      : field));
  }

  private paperPoint(event: MouseEvent): CoordinatePoint | null {
    const target = event.target;
    const paper = target instanceof HTMLElement ? target.closest<HTMLElement>('.paper') : null;
    const rect = paper?.getBoundingClientRect() ?? this.activePaperRect;
    if (!rect) return null;
    if (paper) this.activePaperRect = rect;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    };
  }

  selectField(fieldUid: string, event?: Event): void {
    event?.stopPropagation();
    this.showFieldInspector(fieldUid);
  }

  private showFieldInspector(fieldUid: string): void {
    this.selectedFieldUid.set(fieldUid);
    this.activeDock.set('inspector');
  }

  private showFieldTypeConfig(fieldUid: string): void {
    this.selectedFieldUid.set(fieldUid);
    this.activeDock.set('typeConfig');
  }

  updateSelectedField(key: 'fieldCode' | 'fieldName' | 'fieldType' | 'sampleValue', value: string): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.map((field) => {
      if (field.fieldUid !== fieldUid) return field;
      const next = { ...field, [key]: value };
      return key === 'fieldType' ? resetFieldConfigs(next) : next;
    }));
  }

  primaryConfig(field: MappingFieldDraft): TemplateMappingFieldConfigDraft {
    if (!field.configs.length) {
      this.fields.update((items) => items.map((item) => item.fieldUid === field.fieldUid ? ensureFieldConfigs(item) : item));
      return defaultConfigForField(field)[0];
    }
    return resolvedPrimaryConfig(field);
  }

  canvasPreviewValue(field: MappingFieldDraft): string {
    return this.previewValue(field);
  }

  gridCanvasBoxes(field: MappingFieldDraft): Array<{ index: number; value: string; x: number; y: number; width: number; height: number }> {
    const config = resolvedPrimaryConfig(field);
    const value = field.fieldType === 'DATE_GRID' && config.ignoreDateSeparator
      ? this.previewValue(field).replace(/[^a-z0-9]/gi, '')
      : this.previewValue(field);
    const maxBoxes = Math.max(1, Number(config.maxBoxes ?? 1));
    const boxWidth = Math.max(0.1, Number(config.boxWidth ?? field.fieldWidth));
    const boxHeight = Math.max(0.1, Number(config.boxHeight ?? field.fieldHeight));
    const boxSpacing = Math.max(0.1, Number(config.boxSpacing ?? boxWidth));
    return Array.from({ length: maxBoxes }, (_, index) => ({
      index,
      value: value[index] || '',
      x: round2(field.xCoordinate + (index * boxSpacing)),
      y: round2(field.yCoordinate),
      width: round2(boxWidth),
      height: round2(boxHeight)
    }));
  }

  fieldCanvasWidth(field: MappingFieldDraft): number {
    if (field.fieldType !== 'CHAR_GRID' && field.fieldType !== 'DATE_GRID') return field.fieldWidth;
    const config = resolvedPrimaryConfig(field);
    const maxBoxes = Math.max(1, Number(config.maxBoxes ?? 1));
    const boxWidth = Math.max(0.1, Number(config.boxWidth ?? field.fieldWidth));
    const boxSpacing = Math.max(0.1, Number(config.boxSpacing ?? boxWidth));
    return round2(boxWidth + ((maxBoxes - 1) * boxSpacing));
  }

  optionCanvasMarks(field: MappingFieldDraft): TemplateMappingFieldConfigDraft[] {
    const options = field.configs.length ? field.configs : defaultConfigForField(field);
    return options.map((option) => ({
      ...option,
      optionXCoordinate: option.optionXCoordinate ?? field.xCoordinate,
      optionYCoordinate: option.optionYCoordinate ?? field.yCoordinate,
      optionWidth: option.optionWidth ?? 3,
      optionHeight: option.optionHeight ?? 2
    }));
  }

  updateSelectedConfig(key: keyof TemplateMappingFieldConfigDraft, value: string): void {
    this.patchSelectedConfig((config) => ({ ...config, [key]: value }));
  }

  updateSelectedConfigNumber(key: keyof TemplateMappingFieldConfigDraft, value: string | number): void {
    const numberValue = Number(value);
    this.patchSelectedConfig((config) => ({ ...config, [key]: Number.isFinite(numberValue) ? numberValue : undefined }));
  }

  addOptionConfig(): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.map((field) => {
      if (field.fieldUid !== fieldUid) return field;
      const configs = field.configs.length ? field.configs : defaultConfigForField(field);
      const nextSequence = Math.max(0, ...configs.map((config) => config.configSequence)) + 1;
      return {
        ...field,
        configs: [
          ...configs,
          {
            ...defaultOptionConfig(field, nextSequence),
            optionValue: `OPTION_${nextSequence}`,
            optionLabel: `Option ${nextSequence}`
          }
        ]
      };
    }));
  }

  removeOptionConfig(configSequence: number): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.map((field) => field.fieldUid === fieldUid
      ? { ...field, configs: field.configs.filter((config) => config.configSequence !== configSequence) }
      : field));
  }

  updateOptionConfig(configSequence: number, key: keyof TemplateMappingFieldConfigDraft, value: string): void {
    this.patchOptionConfig(configSequence, (config) => ({ ...config, [key]: value }));
  }

  updateOptionConfigNumber(configSequence: number, key: keyof TemplateMappingFieldConfigDraft, value: string | number): void {
    const numberValue = Number(value);
    this.patchOptionConfig(configSequence, (config) => ({ ...config, [key]: Number.isFinite(numberValue) ? numberValue : undefined }));
  }

  private patchSelectedConfig(updater: (config: TemplateMappingFieldConfigDraft) => TemplateMappingFieldConfigDraft): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.map((field) => {
      if (field.fieldUid !== fieldUid) return field;
      const configs = field.configs.length ? field.configs : defaultConfigForField(field);
      return { ...field, configs: configs.map((config, index) => index === 0 ? updater(config) : config) };
    }));
  }

  private patchOptionConfig(configSequence: number, updater: (config: TemplateMappingFieldConfigDraft) => TemplateMappingFieldConfigDraft): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.map((field) => {
      if (field.fieldUid !== fieldUid) return field;
      const configs = field.configs.length ? field.configs : defaultConfigForField(field);
      return { ...field, configs: configs.map((config) => config.configSequence === configSequence ? updater(config) : config) };
    }));
  }

  deleteSelectedField(): void {
    const fieldUid = this.selectedFieldUid();
    this.fields.update((items) => items.filter((field) => field.fieldUid !== fieldUid));
    this.selectedFieldUid.set('');
  }

  previousPage(event: Event): void {
    event.stopPropagation();
    const pages = this.mappingPages();
    const currentIndex = pages.indexOf(this.selectedPageNo() || 0);
    if (currentIndex > 0) this.selectPage(pages[currentIndex - 1]);
  }

  nextPage(event: Event): void {
    event.stopPropagation();
    const pages = this.mappingPages();
    const currentIndex = pages.indexOf(this.selectedPageNo() || 0);
    if (currentIndex >= 0 && currentIndex < pages.length - 1) this.selectPage(pages[currentIndex + 1]);
  }

  openHeaderInfo(event: Event): void {
    event.stopPropagation();
    this.dialog.open(TemplateHeaderInfoDialog, {
      width: '720px',
      maxWidth: '96vw',
      data: this.selectedTemplate()
    });
  }

  async openPrintPreview(event: Event): Promise<void> {
    event.stopPropagation();
    if (!this.selectedTemplate()) {
      this.errorMessage.set('Template is required for print preview.');
      return;
    }
    if (!this.fields().length) {
      this.errorMessage.set('At least one mapped field is required for print preview.');
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      this.errorMessage.set('Popup blocked. Allow popups to open print preview.');
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.open();
    previewWindow.document.write('<!doctype html><title>Preparing Preview</title><body style="font-family:Arial,sans-serif;padding:16px">Preparing print preview...</body>');
    previewWindow.document.close();

    try {
      this.pdfLoading.set(true);
      this.errorMessage.set('');
      const document = await this.ensurePdfDocument();
      const mappedPages = this.mappingPages().filter((pageNo) => this.fields().some((field) => field.pageNo === pageNo));
      const previewPages = await Promise.all(mappedPages.map((pageNo) => this.renderPreviewPage(document, pageNo)));

      previewWindow.document.open();
      previewWindow.document.write(this.buildPrintPreviewHtml(previewPages));
      previewWindow.document.close();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to open print preview.');
    } finally {
      this.pdfLoading.set(false);
    }
  }

  validateAll(): void {
    const issues: ValidationIssue[] = [];
    if (!this.selectedTemplate()) issues.push({ message: 'Template is required.' });
    if (!this.mappingCode().trim()) issues.push({ message: 'Mapping Code is required.' });
    if (!this.mappingName().trim()) issues.push({ message: 'Mapping Name is required.' });
    for (const pageNo of this.mappingPages()) {
      if (!this.fields().some((field) => field.pageNo === pageNo)) {
        issues.push({ pageNo, message: 'No fields mapped on this page.' });
      }
    }
    for (const field of this.fields()) {
      if (!field.fieldCode.trim() || !field.fieldName.trim()) {
        issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Field code and name are required.' });
      }
      const config = resolvedPrimaryConfig(field);
      if ((field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID') && (!config.maxBoxes || !config.boxSpacing)) {
        issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Char/Grid fields require Max Boxes and Box Spacing.' });
      }
      if (field.fieldType === 'DATE_GRID' && !config.dateFormat) {
        issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Date Grid requires Date Format.' });
      }
      if (field.fieldType === 'OPTION_GROUP') {
        const activeOptions = field.configs.filter((option) => option.optionValue && option.optionLabel);
        const uniqueValues = new Set(activeOptions.map((option) => option.optionValue?.trim().toUpperCase()));
        if (activeOptions.length < 2) {
          issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Option Group requires at least two options.' });
        }
        if (uniqueValues.size !== activeOptions.length) {
          issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Option Group option values must be unique.' });
        }
      }
      if (field.fieldType === 'COMPUTED_FIELD' && !config.computedExpression?.trim()) {
        issues.push({ fieldUid: field.fieldUid, pageNo: field.pageNo, message: 'Computed Field requires an expression.' });
      }
    }
    this.validationIssues.set(issues);
    this.activeDock.set(issues.length ? 'issues' : 'review');
  }

  submit(): void {
    this.validateAll();
    if (this.validationIssues().length) return;
    this.saving.set(true);
    this.errorMessage.set('');
    this.lastMessage.set('');
    this.mappingApi.saveDraft(this.buildPayload()).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (result) => {
        this.lastMessage.set(result.message);
        this.snackBar.open(result.message, 'Close', { duration: 5000 });
        this.back();
      },
      error: (error: Error) => this.errorMessage.set(error.message)
    });
  }

  back(): void {
    this.router.navigateByUrl('/pdf-coordinate-mapper/template-mapping');
  }

  private loadSelectedTemplatePdf(): void {
    const template = this.selectedTemplate();
    this.pdfDocument = null;
    this.pdfError.set('');
    if (!template) return;

    this.pdfLoading.set(true);
    this.http.get(this.templateApi.previewUrl(template), { responseType: 'arraybuffer' })
      .pipe(finalize(() => this.pdfLoading.set(false)))
      .subscribe({
        next: async (bytes) => {
          try {
            this.pdfDocument = await pdfjsLib.getDocument({ data: bytes }).promise;
            this.renderSelectedPage();
          } catch (error) {
            this.pdfError.set(error instanceof Error ? error.message : 'Unable to render PDF.');
          }
        },
        error: (error: Error) => this.pdfError.set(error.message || 'Unable to load PDF.')
      });
  }

  private async ensurePdfDocument(): Promise<PDFDocumentProxy> {
    if (this.pdfDocument) return this.pdfDocument;
    const template = this.selectedTemplate();
    if (!template) throw new Error('Template is required for print preview.');
    const bytes = await firstValueFrom(this.http.get(this.templateApi.previewUrl(template), { responseType: 'arraybuffer' }));
    this.pdfDocument = await pdfjsLib.getDocument({ data: bytes }).promise;
    return this.pdfDocument;
  }

  private async renderPreviewPage(document: PDFDocumentProxy, pageNo: number): Promise<PrintPreviewPage> {
    const page = await document.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering context is not available.');

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    return {
      pageNo,
      width: canvas.width,
      height: canvas.height,
      imageUrl: canvas.toDataURL('image/png'),
      fields: this.fields()
        .filter((field) => field.pageNo === pageNo)
        .map((field) => ({ ...field, printValue: this.previewValue(field) }))
    };
  }

  private buildPrintPreviewHtml(pages: PrintPreviewPage[]): string {
    const title = escapeHtml(this.mappingName() || this.selectedTemplate()?.templateName || 'Template Mapping Preview');
    const body = pages.map((page) => `
      <section class="preview-page" style="width:${page.width}px;height:${page.height}px">
        <img src="${page.imageUrl}" alt="PDF page ${page.pageNo}" />
        ${page.fields.map((field) => this.buildPreviewFieldHtml(field)).join('')}
      </section>
    `).join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { margin: 0; background: #e5e7eb; color: #111827; font-family: Arial, sans-serif; }
    .preview-toolbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: #ffffff; border-bottom: 1px solid #cbd5e1; }
    .preview-toolbar strong { font-size: 15px; }
    .preview-toolbar button { border: 0; border-radius: 4px; background: #00539f; color: #ffffff; padding: 8px 14px; font-weight: 700; cursor: pointer; }
    .preview-page { position: relative; margin: 18px auto; background: #ffffff; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2); page-break-after: always; overflow: hidden; }
    .preview-page img { display: block; width: 100%; height: 100%; }
    .prefill { position: absolute; display: flex; align-items: center; box-sizing: border-box; overflow: hidden; padding: 1px 3px; color: #111827; font-size: 13px; font-weight: 700; line-height: 1.15; white-space: nowrap; }
    .char-box { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; border: 1px solid transparent; color: #111827; font-size: 13px; font-weight: 700; }
    .option-mark { position: absolute; display: flex; align-items: center; justify-content: center; box-sizing: border-box; color: #111827; font-size: 14px; font-weight: 800; }
    @media print {
      body { background: #ffffff; }
      .preview-toolbar { display: none; }
      .preview-page { margin: 0 auto; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="preview-toolbar">
    <strong>${title}</strong>
    <button type="button" onclick="window.print()">Print</button>
  </div>
  ${body || '<p style="padding:16px">No mapped pages available for preview.</p>'}
</body>
</html>`;
  }

  private previewValue(field: MappingFieldDraft): string {
    const sampleValue = field.sampleValue?.trim();
    return sampleValue || field.fieldName || field.fieldCode;
  }

  private buildPreviewFieldHtml(field: MappingFieldDraft & { printValue: string }): string {
    const config = resolvedPrimaryConfig(field);
    if (field.fieldType === 'CHAR_GRID' || field.fieldType === 'DATE_GRID') {
      return this.gridCanvasBoxes(field).map((box) => `
        <span class="char-box" style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%">
          ${escapeHtml(box.value)}
        </span>
      `).join('');
    }

    if (field.fieldType === 'OPTION_GROUP') {
      const selectedValues = field.printValue.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
      return field.configs
        .filter((option) => selectedValues.includes(String(option.optionValue || '').trim().toUpperCase()))
        .map((option) => `
          <span class="option-mark" style="left:${option.optionXCoordinate ?? field.xCoordinate}%;top:${option.optionYCoordinate ?? field.yCoordinate}%;width:${option.optionWidth ?? 3}%;height:${option.optionHeight ?? 2}%">
            ${escapeHtml(option.markValue || config.markValue || 'X')}
          </span>
        `).join('');
    }

    const justifyContent = (config.textAlignment || 'LEFT') === 'CENTER'
      ? 'center'
      : (config.textAlignment || 'LEFT') === 'RIGHT'
        ? 'flex-end'
        : 'flex-start';
    const value = config.maxCharacters ? field.printValue.slice(0, config.maxCharacters) : field.printValue;
    return `
      <span class="prefill" style="left:${field.xCoordinate}%;top:${field.yCoordinate}%;width:${field.fieldWidth}%;height:${field.fieldHeight}%;justify-content:${justifyContent};font-family:${escapeHtml(config.fontName || 'Arial')};font-size:${config.fontSize || 11}px;color:${escapeHtml(config.fontColor || '#111827')}">
        ${escapeHtml(value)}
      </span>
    `;
  }

  private loadExistingMappingIfNeeded(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.errorMessage.set('');
    this.mappingApi.loadMappingById(id).subscribe({
      next: (detail) => {
        if (!detail.main) {
          this.errorMessage.set('Template Mapping record was not found.');
          return;
        }

        this.currentAutoId.set(detail.main.autoId);
        this.currentMstColId.set(detail.main.mstColId);
        this.selectedTemplateId.set(detail.main.templateId);
        this.mappingCode.set(detail.main.mappingCode);
        this.mappingName.set(detail.main.mappingName);
        this.fields.set(detail.fields.map(ensureFieldConfigs));
        this.selectedFieldUid.set('');
        this.fieldNameInput.set('');
        this.selectedPageNo.set(detail.fields[0]?.pageNo ?? this.mappingPages()[0] ?? null);
        this.activeDock.set(this.isViewMode() ? 'review' : 'pages');
        this.loadSelectedTemplatePdf();
      },
      error: (error: Error) => this.errorMessage.set(error.message)
    });
  }

  private renderSelectedPage(): void {
    const document = this.pdfDocument;
    const pageNo = this.selectedPageNo();
    const canvas = this.pdfCanvas?.nativeElement;
    if (!document || !pageNo || !canvas) return;

    const renderId = ++this.renderVersion;
    this.pdfLoading.set(true);
    this.pdfError.set('');

    document.getPage(pageNo)
      .then((page) => {
        if (renderId !== this.renderVersion) return null;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = 780 / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering context is not available.');

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        this.pageSize.set({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });
        context.clearRect(0, 0, canvas.width, canvas.height);
        return page.render({ canvas, canvasContext: context, viewport }).promise;
      })
      .then(() => {
        if (renderId === this.renderVersion) this.pdfLoading.set(false);
      })
      .catch((error: Error) => {
        if (renderId !== this.renderVersion) return;
        this.pdfLoading.set(false);
        this.pdfError.set(error.message || 'Unable to render selected PDF page.');
      });
  }

  private buildPayload(): Record<string, unknown> {
    return {
      flag: this.isEditMode() ? 'UPDATE' : 'INSERT',
      auto_Id: this.currentAutoId(),
      mst_Col_Id: this.currentMstColId() || this.currentAutoId(),
      template_Id: this.selectedTemplateId(),
      mapping_Code: this.mappingCode().trim(),
      mapping_Name: this.mappingName().trim(),
      page_Width: String(this.pageSize().width),
      page_Height: String(this.pageSize().height),
      coordinate_Origin: 'TOP_LEFT',
      fields: this.fields().map(ensureFieldConfigs),
      currentUserId: this.currentUser()
    };
  }

  private currentUser(): string {
    const user = this.authStore.user();
    return user?.userName || user?.userId || 'angular-ui';
  }
}

function parsePages(value: string): number[] {
  return value
    .split(',')
    .map((page) => Number(page.trim()))
    .filter((page) => Number.isFinite(page) && page > 0);
}

function normalizeCode(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface CoordinatePoint {
  x: number;
  y: number;
}

interface CoordinateRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PrintPreviewPage {
  pageNo: number;
  width: number;
  height: number;
  imageUrl: string;
  fields: Array<MappingFieldDraft & { printValue: string }>;
}

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

type PointerAction =
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'move'; fieldUid: string; startX: number; startY: number; original: CoordinateRect }
  | { kind: 'optionMove'; fieldUid: string; configSequence: number; startX: number; startY: number; originalX: number; originalY: number; width: number; height: number }
  | { kind: 'resize'; fieldUid: string; corner: ResizeCorner; startX: number; startY: number; original: CoordinateRect };

function toRect(field: MappingFieldDraft): CoordinateRect {
  return {
    x: field.xCoordinate,
    y: field.yCoordinate,
    width: field.fieldWidth,
    height: field.fieldHeight
  };
}

function ensureFieldConfigs(field: MappingFieldDraft): MappingFieldDraft {
  if (field.configs?.length) return field;
  return { ...field, configs: defaultConfigForField(field) };
}

function resetFieldConfigs(field: MappingFieldDraft): MappingFieldDraft {
  return { ...field, configs: defaultConfigForField({ ...field, configs: [] }) };
}

function resolvedPrimaryConfig(field: MappingFieldDraft): TemplateMappingFieldConfigDraft {
  const defaults = defaultConfigForField(field);
  return { ...defaults[0], ...(field.configs?.[0] || {}) };
}

function defaultConfigForField(field: MappingFieldDraft): TemplateMappingFieldConfigDraft[] {
  if (field.fieldType === 'OPTION_GROUP') {
    return [
      { ...defaultOptionConfig(field, 1), optionValue: 'YES', optionLabel: 'Yes' },
      { ...defaultOptionConfig(field, 2), optionValue: 'NO', optionLabel: 'No', optionYCoordinate: round2(field.yCoordinate + field.fieldHeight + 1) }
    ];
  }

  const gridBoxCount = field.fieldType === 'DATE_GRID'
    ? 8
    : Math.max(1, Math.min(40, Number(field.sampleValue?.trim().length || 10)));
  const gridStep = round2(field.fieldWidth / gridBoxCount);
  const gridBoxWidth = round2(Math.max(0.25, gridStep * 0.78));

  const base: TemplateMappingFieldConfigDraft = {
    configSequence: 1,
    fontName: 'Arial',
    fontSize: 13,
    minFontSize: 8,
    fontStyle: 'NORMAL',
    fontColor: '#111827',
    textAlignment: 'LEFT',
    verticalAlignment: 'MIDDLE',
    isMultiline: false,
    maxLines: 1,
    lineHeight: 1.15,
    maxCharacters: undefined,
    wrapText: false,
    overflowAction: 'SHRINK',
    boxWidth: gridBoxWidth,
    boxHeight: round2(field.fieldHeight),
    boxSpacing: gridStep,
    maxBoxes: gridBoxCount,
    dateFormat: 'DDMMYYYY',
    dateSeparator: '/',
    ignoreDateSeparator: true,
    selectionMode: 'SINGLE',
    markValue: 'X',
    outputFormat: '',
    isActive: true
  };

  if (field.fieldType === 'DATE_GRID') {
    return [{ ...base, maxBoxes: 8 }];
  }

  if (field.fieldType === 'CHAR_GRID') {
    return [base];
  }

  if (field.fieldType === 'COMPUTED_FIELD') {
    return [{ ...base, computedExpression: field.excelHeaderName || field.fieldCode, outputFormat: 'TEXT' }];
  }

  return [base];
}

function defaultOptionConfig(field: MappingFieldDraft, sequence: number): TemplateMappingFieldConfigDraft {
  return {
    configSequence: sequence,
    selectionMode: 'SINGLE',
    optionXCoordinate: round2(field.xCoordinate),
    optionYCoordinate: round2(field.yCoordinate),
    optionWidth: round2(Math.max(2, Math.min(field.fieldWidth, 5))),
    optionHeight: round2(Math.max(1.2, Math.min(field.fieldHeight, 3))),
    markValue: 'X',
    isActive: true
  };
}

function normalizeRect(startX: number, startY: number, endX: number, endY: number): CoordinateRect {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  return {
    x: round2(left),
    y: round2(top),
    width: round2(Math.abs(endX - startX)),
    height: round2(Math.abs(endY - startY))
  };
}

function resizeRect(original: CoordinateRect, corner: ResizeCorner, point: CoordinatePoint): CoordinateRect {
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  const minWidth = 2;
  const minHeight = 1.2;

  if (corner === 'nw') {
    const x = clamp(point.x, 0, right - minWidth);
    const y = clamp(point.y, 0, bottom - minHeight);
    return { x, y, width: right - x, height: bottom - y };
  }

  if (corner === 'ne') {
    const y = clamp(point.y, 0, bottom - minHeight);
    const width = clamp(point.x - original.x, minWidth, 100 - original.x);
    return { x: original.x, y, width, height: bottom - y };
  }

  if (corner === 'sw') {
    const x = clamp(point.x, 0, right - minWidth);
    const height = clamp(point.y - original.y, minHeight, 100 - original.y);
    return { x, y: original.y, width: right - x, height };
  }

  return {
    x: original.x,
    y: original.y,
    width: clamp(point.x - original.x, minWidth, 100 - original.x),
    height: clamp(point.y - original.y, minHeight, 100 - original.y)
  };
}

function defaultRectAt(x: number, y: number): CoordinateRect {
  const width = 18;
  const height = 4;
  return {
    x: round2(clamp(x - width / 2, 0, 100 - width)),
    y: round2(clamp(y - height / 2, 0, 100 - height)),
    width,
    height
  };
}

function isOverlayFieldTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('.field-box'));
}

function uniqueFieldNames(fields: MappingFieldDraft[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    const name = field.fieldName.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
