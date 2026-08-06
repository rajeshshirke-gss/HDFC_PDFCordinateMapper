import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString } from '../../../core/api/dataset.adapter';
import { FieldType, MappingFieldDraft, TemplateMappingDetail, TemplateMappingFieldConfigDraft, TemplateMappingListSnapshot, TemplateMappingRecord } from './template-mapping.models';

@Injectable({ providedIn: 'root' })
export class TemplateMappingApiService {
  private readonly http = inject(HttpClient);

  loadMappings(): Observable<TemplateMappingListSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/TemplateMapping/GetTemplateMapping`).pipe(
      map((response) => ({
        mappings: dataSetRows<Record<string, unknown>>(response, 0).map(toMappingRecord),
        approvedMappings: dataSetRows<Record<string, unknown>>(response, 1).map(toMappingRecord)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load Template Mappings.'))))
    );
  }

  saveDraft(payload: Record<string, unknown>): Observable<{ message: string; raw: unknown }> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/TemplateMapping/SaveTemplateMapping`, payload).pipe(
      map((response) => ({ message: extractDbMessage(response) || 'Template mapping request submitted.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Template Mapping request failed.'))))
    );
  }

  loadMappingById(autoId: string): Observable<TemplateMappingDetail> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/TemplateMapping/GetTemplateMappingById?autoId=${encodeURIComponent(autoId)}`).pipe(
      map((response) => {
        const configs = dataSetRows<Record<string, unknown>>(response, 2).map(toMappingConfig);
        return {
          main: dataSetRows<Record<string, unknown>>(response, 0).map(toMappingRecord)[0] ?? null,
          fields: dataSetRows<Record<string, unknown>>(response, 1).map((row) => toMappingField(row, configs))
        };
      }),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load Template Mapping.'))))
    );
  }

  deleteMapping(record: TemplateMappingRecord, currentUserId: string): Observable<{ message: string; raw: unknown }> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/TemplateMapping/Delete_TemplateMapping`, {
      flag: 'D',
      auto_Id: record.autoId,
      mst_Col_Id: record.mstColId || record.autoId,
      template_Id: record.templateId,
      mapping_Code: record.mappingCode,
      mapping_Name: record.mappingName,
      currentUserId
    }).pipe(
      map((response) => ({ message: extractDbMessage(response) || 'Template mapping delete request submitted.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Template Mapping delete failed.'))))
    );
  }
}

function toMappingRecord(row: Record<string, unknown>): TemplateMappingRecord {
  return {
    raw: row,
    autoId: pickString(row, ['AUTOID', 'AutoId', 'autoId', 'auto_Id']),
    mstColId: pickString(row, ['MST_COL_ID', 'MstColId', 'mstColId']),
    mappingCode: pickString(row, ['MAPPING_CODE', 'MappingCode', 'mappingCode']),
    mappingName: pickString(row, ['MAPPING_NAME', 'MappingName', 'mappingName']),
    amcName: pickString(row, ['AMC_NAME', 'AmcName', 'amcName']),
    templateId: pickString(row, ['TEMPLATE_ID', 'TemplateId', 'templateId']),
    templateCode: pickString(row, ['TEMPLATE_CODE', 'TemplateCode', 'templateCode']),
    templateName: pickString(row, ['TEMPLATE_NAME', 'TemplateName', 'templateName']),
    fieldCount: pickString(row, ['FIELD_COUNT', 'FieldCount', 'fieldCount']),
    status: pickString(row, ['STATUS', 'Status', 'status']),
    action: pickString(row, ['ACTION', 'Action', 'action']),
    createdBy: pickString(row, ['CREATEDBY', 'CreatedBy', 'createdBy']),
    createdDate: pickString(row, ['CREATEDDATE', 'CreatedDate', 'createdDate']),
    modifiedBy: pickString(row, ['MODIFIEDBY', 'ModifiedBy', 'modifiedBy']),
    modifiedDate: pickString(row, ['MODIFIEDDATE', 'ModifiedDate', 'modifiedDate']),
    approvedBy: pickString(row, ['APPROVEDBY', 'ApprovedBy', 'approvedBy']),
    approvedDate: pickString(row, ['APPROVEDDATE', 'ApprovedDate', 'approvedDate'])
  };
}

function toMappingField(row: Record<string, unknown>, configs: Array<TemplateMappingFieldConfigDraft & { mappingFieldId: string }>): MappingFieldDraft {
  const fieldName = pickString(row, ['FIELD_NAME', 'FieldName', 'fieldName']);
  const autoId = pickString(row, ['AUTOID', 'AutoId', 'autoId']);
  return {
    autoId,
    mstColId: pickString(row, ['MST_COL_ID', 'MstColId', 'mstColId']),
    fieldUid: pickString(row, ['FIELD_UID', 'FieldUid', 'fieldUid']) || `loaded_${pickString(row, ['AUTOID', 'AutoId', 'autoId'])}`,
    fieldCode: pickString(row, ['FIELD_CODE', 'FieldCode', 'fieldCode']) || codeFromName(fieldName),
    fieldName,
    excelHeaderName: pickString(row, ['EXCEL_HEADER_NAME', 'ExcelHeaderName', 'excelHeaderName']) || fieldName,
    fieldType: normalizeFieldType(pickString(row, ['FIELD_TYPE', 'FieldType', 'fieldType'])),
    pageNo: numberFrom(row, ['PAGE_NO', 'PageNo', 'pageNo'], 1),
    xCoordinate: numberFrom(row, ['X_COORDINATE', 'XCoordinate', 'xCoordinate'], 0),
    yCoordinate: numberFrom(row, ['Y_COORDINATE', 'YCoordinate', 'yCoordinate'], 0),
    fieldWidth: numberFrom(row, ['FIELD_WIDTH', 'FieldWidth', 'fieldWidth'], 18),
    fieldHeight: numberFrom(row, ['FIELD_HEIGHT', 'FieldHeight', 'fieldHeight'], 4),
    isRequired: yesNoFrom(row, ['IS_REQUIRED', 'IsRequired', 'isRequired'], true),
    sampleValue: pickString(row, ['SAMPLE_VALUE', 'SampleValue', 'sampleValue']),
    configs: configs.filter((config) => config.mappingFieldId === autoId).map(stripMappingFieldId)
  };
}

function stripMappingFieldId(config: TemplateMappingFieldConfigDraft & { mappingFieldId: string }): TemplateMappingFieldConfigDraft {
  return {
    autoId: config.autoId,
    mstColId: config.mstColId,
    configSequence: config.configSequence,
    fontName: config.fontName,
    fontSize: config.fontSize,
    minFontSize: config.minFontSize,
    fontStyle: config.fontStyle,
    fontColor: config.fontColor,
    textAlignment: config.textAlignment,
    verticalAlignment: config.verticalAlignment,
    isMultiline: config.isMultiline,
    maxLines: config.maxLines,
    lineHeight: config.lineHeight,
    maxCharacters: config.maxCharacters,
    wrapText: config.wrapText,
    overflowAction: config.overflowAction,
    boxWidth: config.boxWidth,
    boxHeight: config.boxHeight,
    boxSpacing: config.boxSpacing,
    maxBoxes: config.maxBoxes,
    dateFormat: config.dateFormat,
    dateSeparator: config.dateSeparator,
    ignoreDateSeparator: config.ignoreDateSeparator,
    selectionMode: config.selectionMode,
    optionValue: config.optionValue,
    optionLabel: config.optionLabel,
    optionXCoordinate: config.optionXCoordinate,
    optionYCoordinate: config.optionYCoordinate,
    optionWidth: config.optionWidth,
    optionHeight: config.optionHeight,
    markValue: config.markValue,
    repeatSlotNo: config.repeatSlotNo,
    repeatXOffset: config.repeatXOffset,
    repeatYOffset: config.repeatYOffset,
    computedExpression: config.computedExpression,
    outputFormat: config.outputFormat,
    isActive: config.isActive
  };
}

function toMappingConfig(row: Record<string, unknown>): TemplateMappingFieldConfigDraft & { mappingFieldId: string } {
  return {
    mappingFieldId: pickString(row, ['MAPPING_FIELD_ID', 'MappingFieldId', 'mappingFieldId']),
    autoId: pickString(row, ['AUTOID', 'AutoId', 'autoId']),
    mstColId: pickString(row, ['MST_COL_ID', 'MstColId', 'mstColId']),
    configSequence: numberFrom(row, ['CONFIG_SEQUENCE', 'ConfigSequence', 'configSequence'], 1),
    fontName: pickString(row, ['FONT_NAME', 'FontName', 'fontName']),
    fontSize: optionalNumberFrom(row, ['FONT_SIZE', 'FontSize', 'fontSize']),
    minFontSize: optionalNumberFrom(row, ['MIN_FONT_SIZE', 'MinFontSize', 'minFontSize']),
    fontStyle: pickString(row, ['FONT_STYLE', 'FontStyle', 'fontStyle']),
    fontColor: pickString(row, ['FONT_COLOR', 'FontColor', 'fontColor']),
    textAlignment: pickString(row, ['TEXT_ALIGNMENT', 'TextAlignment', 'textAlignment']),
    verticalAlignment: pickString(row, ['VERTICAL_ALIGNMENT', 'VerticalAlignment', 'verticalAlignment']),
    isMultiline: yesNoFrom(row, ['IS_MULTILINE', 'IsMultiline', 'isMultiline'], false),
    maxLines: optionalNumberFrom(row, ['MAX_LINES', 'MaxLines', 'maxLines']),
    lineHeight: optionalNumberFrom(row, ['LINE_HEIGHT', 'LineHeight', 'lineHeight']),
    maxCharacters: optionalNumberFrom(row, ['MAX_CHARACTERS', 'MaxCharacters', 'maxCharacters']),
    wrapText: yesNoFrom(row, ['WRAP_TEXT', 'WrapText', 'wrapText'], false),
    overflowAction: pickString(row, ['OVERFLOW_ACTION', 'OverflowAction', 'overflowAction']),
    boxWidth: optionalNumberFrom(row, ['BOX_WIDTH', 'BoxWidth', 'boxWidth']),
    boxHeight: optionalNumberFrom(row, ['BOX_HEIGHT', 'BoxHeight', 'boxHeight']),
    boxSpacing: optionalNumberFrom(row, ['BOX_SPACING', 'BoxSpacing', 'boxSpacing']),
    maxBoxes: optionalNumberFrom(row, ['MAX_BOXES', 'MaxBoxes', 'maxBoxes']),
    dateFormat: pickString(row, ['DATE_FORMAT', 'DateFormat', 'dateFormat']),
    dateSeparator: pickString(row, ['DATE_SEPARATOR', 'DateSeparator', 'dateSeparator']),
    ignoreDateSeparator: yesNoFrom(row, ['IGNORE_DATE_SEPARATOR', 'IgnoreDateSeparator', 'ignoreDateSeparator'], false),
    selectionMode: pickString(row, ['SELECTION_MODE', 'SelectionMode', 'selectionMode']),
    optionValue: pickString(row, ['OPTION_VALUE', 'OptionValue', 'optionValue']),
    optionLabel: pickString(row, ['OPTION_LABEL', 'OptionLabel', 'optionLabel']),
    optionXCoordinate: optionalNumberFrom(row, ['OPTION_X_COORDINATE', 'OptionXCoordinate', 'optionXCoordinate']),
    optionYCoordinate: optionalNumberFrom(row, ['OPTION_Y_COORDINATE', 'OptionYCoordinate', 'optionYCoordinate']),
    optionWidth: optionalNumberFrom(row, ['OPTION_WIDTH', 'OptionWidth', 'optionWidth']),
    optionHeight: optionalNumberFrom(row, ['OPTION_HEIGHT', 'OptionHeight', 'optionHeight']),
    markValue: pickString(row, ['MARK_VALUE', 'MarkValue', 'markValue']),
    computedExpression: pickString(row, ['COMPUTED_EXPRESSION', 'ComputedExpression', 'computedExpression']),
    outputFormat: pickString(row, ['OUTPUT_FORMAT', 'OutputFormat', 'outputFormat']),
    isActive: yesNoFrom(row, ['ISACTIVE', 'IsActive', 'isActive'], true)
  };
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}

function numberFrom(row: Record<string, unknown>, keys: string[], fallback: number): number {
  const value = Number(pickString(row, keys));
  return Number.isFinite(value) ? value : fallback;
}

function optionalNumberFrom(row: Record<string, unknown>, keys: string[]): number | undefined {
  const raw = pickString(row, keys);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function yesNoFrom(row: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
  const value = pickString(row, keys).toUpperCase();
  if (!value) return fallback;
  return value === 'Y' || value === '1' || value === 'TRUE';
}

function normalizeFieldType(value: string): FieldType {
  const normalized = value.toUpperCase();
  if (normalized === 'CHAR_GRID' || normalized === 'DATE_GRID' || normalized === 'OPTION_GROUP' || normalized === 'COMPUTED_FIELD') {
    return normalized;
  }
  return 'TEXT_FIELD';
}

function codeFromName(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
}
