import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api.config';
import { dataSetRows, extractDbMessage, pickString, unwrapApiResponse } from '../../../core/api/dataset.adapter';
import {
  TemplateMasterAmcOption,
  TemplateMasterCommandResult,
  TemplateMasterFormValue,
  TemplateMasterListSnapshot,
  TemplateMasterRecord,
  TemplateUploadResult
} from './template-master.models';

@Injectable({ providedIn: 'root' })
export class TemplateMasterApiService {
  private readonly http = inject(HttpClient);

  loadTemplates(): Observable<TemplateMasterListSnapshot> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/TemplateMaster/GetTemplateMaster`).pipe(
      map((response) => ({
        templates: dataSetRows<Record<string, unknown>>(response, 0).map(toTemplateRecord),
        approvedTemplates: dataSetRows<Record<string, unknown>>(response, 1).map(toTemplateRecord)
      })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load templates.'))))
    );
  }

  getAmcDropdown(): Observable<TemplateMasterAmcOption[]> {
    return this.http.get<unknown>(`${API_BASE_URL}/api/AmcMaster/GetAmcMaster`).pipe(
      map((response) => dataSetRows<Record<string, unknown>>(response, 1).map(toAmcOption).filter((option) => option.amcCode)),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Unable to load AMC dropdown.'))))
    );
  }

  uploadPdf(file: File): Observable<TemplateUploadResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<unknown>(`${API_BASE_URL}/api/TemplateMaster/UploadTemplatePdf`, formData).pipe(
      map((response) => toUploadResult(unwrapApiResponse<Record<string, unknown>>(response))),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'PDF upload failed.'))))
    );
  }

  createTemplate(value: TemplateMasterFormValue, currentUser: string): Observable<TemplateMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/TemplateMaster/SaveTemplateMaster`, buildPayload('INSERT', value, currentUser));
  }

  updateTemplate(record: TemplateMasterRecord, value: TemplateMasterFormValue, currentUser: string): Observable<TemplateMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/TemplateMaster/SaveTemplateMaster`, {
      ...buildPayload('UPDATE', value, currentUser),
      auto_Id: record.autoId,
      mst_Col_Id: record.mstColId || record.autoId
    });
  }

  deleteTemplate(record: TemplateMasterRecord, currentUser: string): Observable<TemplateMasterCommandResult> {
    return this.submit(`${API_BASE_URL}/api/TemplateMaster/Delete_TemplateMaster`, {
      flag: 'D',
      auto_Id: record.autoId,
      mst_Col_Id: record.mstColId || record.autoId,
      currentUserId: currentUser
    });
  }

  previewUrl(record: TemplateMasterRecord): string {
    return `${API_BASE_URL}/api/TemplateMaster/PreviewTemplatePdf?templateId=${encodeURIComponent(record.autoId)}`;
  }

  private submit(url: string, payload: Record<string, string>): Observable<TemplateMasterCommandResult> {
    return this.http.post<unknown>(url, payload).pipe(
      map((response) => ({ success: true, message: extractDbMessage(response) || 'Request completed successfully.', raw: response })),
      catchError((error) => throwError(() => new Error(errorMessage(error, 'Template Master request failed.'))))
    );
  }
}

function buildPayload(flag: 'INSERT' | 'UPDATE', value: TemplateMasterFormValue, currentUser: string): Record<string, string> {
  const templateName = value.templateName.trim();
  const templateCode = value.templateCode?.trim() || templateName;
  const amcName = value.amcCode.trim();

  return {
    flag,
    template_Code: templateCode,
    amc_Code: '',
    amc_Name: amcName,
    Amc_Name: amcName,
    template_Name: templateName,
    template_Description: value.templateDescription.trim(),
    original_File_Name: value.originalFileName.trim(),
    stored_File_Name: value.storedFileName.trim(),
    file_Path: value.filePath.trim(),
    file_Hash: value.fileHash.trim(),
    file_Size_Bytes: value.fileSizeBytes.trim(),
    mime_Type: value.mimeType.trim(),
    pdf_Page_Count: value.pdfPageCount.trim(),
    mapping_Page_Numbers: value.mappingPageNumbers.trim(),
    print_Page_Numbers: value.printPageNumbers.trim(),
    repeat_Rows_Per_Page: value.repeatRowsPerPage.trim(),
    is_Digitally_Signed: value.isDigitallySigned.trim() || 'N',
    digital_Signature_Details: value.digitalSignatureDetails.trim(),
    isActive: value.active.trim(),
    currentUserId: currentUser
  };
}

function toTemplateRecord(row: Record<string, unknown>): TemplateMasterRecord {
  return {
    raw: row,
    autoId: pickString(row, ['AUTOID', 'AutoId', 'autoId', 'auto_Id']),
    mstColId: pickString(row, ['MST_COL_ID', 'MstColId', 'mstColId']),
    templateCode: pickString(row, ['TEMPLATE_CODE', 'TemplateCode', 'templateCode']),
    amcCode: pickString(row, ['AMC_CODE', 'AmcCode', 'amcCode']),
    amcName: pickString(row, ['AMC_NAME', 'AmcName', 'amcName']),
    templateName: pickString(row, ['TEMPLATE_NAME', 'TemplateName', 'templateName']),
    templateDescription: pickString(row, ['TEMPLATE_DESCRIPTION', 'TemplateDescription', 'templateDescription']),
    originalFileName: pickString(row, ['ORIGINAL_FILE_NAME', 'OriginalFileName', 'originalFileName']),
    storedFileName: pickString(row, ['STORED_FILE_NAME', 'StoredFileName', 'storedFileName']),
    filePath: pickString(row, ['FILE_PATH', 'FilePath', 'filePath']),
    fileHash: pickString(row, ['FILE_HASH', 'FileHash', 'fileHash']),
    fileSizeBytes: pickString(row, ['FILE_SIZE_BYTES', 'FileSizeBytes', 'fileSizeBytes']),
    mimeType: pickString(row, ['MIME_TYPE', 'MimeType', 'mimeType']),
    pdfPageCount: pickString(row, ['PDF_PAGE_COUNT', 'PdfPageCount', 'pdfPageCount']),
    mappingPageNumbers: pickString(row, ['MAPPING_PAGE_NUMBERS', 'MappingPageNumbers', 'mappingPageNumbers']),
    printPageNumbers: pickString(row, ['PRINT_PAGE_NUMBERS', 'PrintPageNumbers', 'printPageNumbers']),
    repeatRowsPerPage: pickString(row, ['REPEAT_ROWS_PER_PAGE', 'RepeatRowsPerPage', 'repeatRowsPerPage']),
    isDigitallySigned: pickString(row, ['IS_DIGITALLY_SIGNED', 'IsDigitallySigned', 'isDigitallySigned']),
    digitalSignatureDetails: pickString(row, ['DIGITAL_SIGNATURE_DETAILS', 'DigitalSignatureDetails', 'digitalSignatureDetails']),
    active: pickString(row, ['ISACTIVE', 'IsActive', 'isActive', 'active']),
    status: pickString(row, ['STATUS', 'Status', 'status']),
    action: pickString(row, ['ACTION', 'Action', 'action']),
    actionRemark: pickString(row, ['ACTIONREMARK', 'ActionRemark', 'actionRemark']),
    createdBy: pickString(row, ['CREATEDBY', 'CreatedBy', 'createdBy']),
    createdDate: pickString(row, ['CREATEDDATE', 'CreatedDate', 'createdDate']),
    modifiedBy: pickString(row, ['MODIFIEDBY', 'ModifiedBy', 'modifiedBy']),
    modifiedDate: pickString(row, ['MODIFIEDDATE', 'ModifiedDate', 'modifiedDate']),
    approvedBy: pickString(row, ['APPROVEDBY', 'ApprovedBy', 'approvedBy']),
    approvedDate: pickString(row, ['APPROVEDDATE', 'ApprovedDate', 'approvedDate'])
  };
}

function toAmcOption(row: Record<string, unknown>): TemplateMasterAmcOption {
  return {
    raw: row,
    amcCode: pickString(row, ['AMC_CODE', 'AmcCode', 'amcCode']),
    amcName: pickString(row, ['AMC_NAME', 'AmcName', 'amcName'])
  };
}

function toUploadResult(row: Record<string, unknown>): TemplateUploadResult {
  return {
    originalFileName: pickString(row, ['originalFileName', 'OriginalFileName']),
    storedFileName: pickString(row, ['storedFileName', 'StoredFileName']),
    filePath: pickString(row, ['filePath', 'FilePath']),
    fileHash: pickString(row, ['fileHash', 'FileHash']),
    fileSizeBytes: Number(pickString(row, ['fileSizeBytes', 'FileSizeBytes']) || 0),
    mimeType: pickString(row, ['mimeType', 'MimeType']) || 'application/pdf',
    pdfPageCount: Number(pickString(row, ['pdfPageCount', 'PdfPageCount']) || 0)
  };
}

function errorMessage(error: unknown, fallback: string): string {
  const httpError = error as { error?: unknown; message?: string };
  return extractDbMessage(httpError?.error) || httpError?.message || fallback;
}
