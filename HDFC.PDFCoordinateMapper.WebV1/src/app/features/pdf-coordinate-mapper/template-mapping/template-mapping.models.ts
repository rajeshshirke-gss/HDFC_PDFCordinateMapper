import { TemplateMasterRecord } from '../template-master/template-master.models';

export type TemplateMappingView = 'all' | 'approved';
export type TemplateMappingMode = 'create' | 'edit' | 'view';
export type DockPanelId = 'pages' | 'fieldNames' | 'pageFields' | 'inspector' | 'typeConfig' | 'issues' | 'review';
export type FieldType = 'TEXT_FIELD' | 'CHAR_GRID' | 'DATE_GRID' | 'OPTION_GROUP' | 'COMPUTED_FIELD';

export interface TemplateMappingRecord {
  raw: Record<string, unknown>;
  autoId: string;
  mstColId: string;
  mappingCode: string;
  mappingName: string;
  templateId: string;
  templateName: string;
  fieldCount: string;
  status: string;
  action: string;
  createdBy: string;
  createdDate: string;
}

export interface TemplateMappingListSnapshot {
  mappings: TemplateMappingRecord[];
  approvedMappings: TemplateMappingRecord[];
}

export interface TemplateMappingDetail {
  main: TemplateMappingRecord | null;
  fields: MappingFieldDraft[];
}

export interface MappingFieldDraft {
  autoId?: string;
  mstColId?: string;
  fieldUid: string;
  fieldCode: string;
  fieldName: string;
  excelHeaderName: string;
  fieldType: FieldType;
  pageNo: number;
  xCoordinate: number;
  yCoordinate: number;
  fieldWidth: number;
  fieldHeight: number;
  isRequired: boolean;
  sampleValue?: string;
  configs: TemplateMappingFieldConfigDraft[];
}

export interface TemplateMappingFieldConfigDraft {
  autoId?: string;
  mstColId?: string;
  configSequence: number;
  fontName?: string;
  fontSize?: number;
  minFontSize?: number;
  fontStyle?: string;
  fontColor?: string;
  textAlignment?: string;
  verticalAlignment?: string;
  isMultiline?: boolean;
  maxLines?: number;
  lineHeight?: number;
  maxCharacters?: number;
  wrapText?: boolean;
  overflowAction?: string;
  boxWidth?: number;
  boxHeight?: number;
  boxSpacing?: number;
  maxBoxes?: number;
  dateFormat?: string;
  dateSeparator?: string;
  ignoreDateSeparator?: boolean;
  selectionMode?: string;
  optionValue?: string;
  optionLabel?: string;
  optionXCoordinate?: number;
  optionYCoordinate?: number;
  optionWidth?: number;
  optionHeight?: number;
  markValue?: string;
  repeatSlotNo?: number;
  repeatXOffset?: number;
  repeatYOffset?: number;
  computedExpression?: string;
  outputFormat?: string;
  isActive?: boolean;
}

export interface PageStatus {
  pageNo: number;
  fieldCount: number;
  status: 'Not Started' | 'In Progress' | 'Has Issues' | 'Complete';
}

export interface ValidationIssue {
  fieldUid?: string;
  pageNo?: number;
  message: string;
}

export interface TemplateMappingWorkspaceState {
  mode: TemplateMappingMode;
  selectedTemplate: TemplateMasterRecord | null;
  mappingCode: string;
  mappingName: string;
  mappingPages: number[];
  selectedPageNo: number | null;
  fieldNames: string[];
  fields: MappingFieldDraft[];
  fieldNameInput: string;
  selectedFieldUid: string;
  validationIssues: ValidationIssue[];
  activeDock: DockPanelId | null;
  pinnedDock: DockPanelId | null;
}
