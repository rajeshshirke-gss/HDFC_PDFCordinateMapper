# Template Master Implementation Plan

## Purpose

Create Template Master functionality for `PDFCordinateMapperModule` using the same structure and conventions already used by the completed User Management module.

Template Master is the PDF Template Registry feature. It maintains PDF templates, PDF metadata, mapping pages, printing pages, repeat rows per page, and active/inactive state through Maker-Checker and the PDF module's separate `MF_` Common Approval flow.

Current rule: Template Master is standalone and must not depend on AMC Master in DB, API, or UI.

Do not start implementation until this plan is reviewed.

## Scope

Build Template Master end to end:

- Oracle standalone stored procedures with `MF_` names.
- Separate PDF module Common Approval integration using `MF_` tables.
- ASP.NET Web API controller, service, and model.
- Angular standalone feature page.
- PDF upload and PDF preview/page-selection workflow.
- Add mode allows uploading only `.pdf` files.
- Once a Template Master record is created, users must not re-upload or replace the template PDF from edit mode.
- Mapping pages and printing pages must use multiple-selection combo boxes, not free text, when page count is known.
- Maker create/update/delete request submission.
- Checker approval through the PDF module's separate `MF_` Common Approval flow.

## Out Of Scope

- Template Mapping Studio.
- Excel upload and row validation.
- Final PDF generation.
- `PKG_PDF_COORDINATE`.
- Scheme Master or ISIN Master.
- Physical file-path exposure to Angular.

## Verified Current DB State

MCP verified on `HDFCPDFMAP`:

```text
MF_TEMPLATE_MASTER       VALID
MF_TEMPLATE_MASTER_APP   VALID
MF_TEMPLATE_MASTER_LOG   VALID
Existing Admin Common Approval procedures are present, but they are reference only for this module:
  USP_COMMON_APPROVAL_IUDS VALID
  USP_GET_COMMAPPROVALDATA_CCIL VALID
```

Missing:

```text
MF_TEMPLATE_MASTER_IUDS
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Already completed:

```text
MF_TEMPLATE_MASTER_SEQ
MF_TEMPLATE_MASTER_APP_SEQ
MF_TEMPLATE_MASTER_LOG_SEQ
MF_TEMPLATE_MASTER_SEQ_TR
MF_TEMPLATE_MASTER_APP_SEQ_TR
MF_TEMPLATE_MASTER_LOG_SEQ_TR
```

## Existing DB Tables

Template Master uses:

```text
MF_TEMPLATE_MASTER
MF_TEMPLATE_MASTER_APP
MF_TEMPLATE_MASTER_LOG
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
```

Key Template columns:

```text
AUTOID
TEMPLATE_CODE
TEMPLATE_NAME
TEMPLATE_DESCRIPTION
ORIGINAL_FILE_NAME
STORED_FILE_NAME
FILE_PATH
FILE_HASH
FILE_SIZE_BYTES
MIME_TYPE
PDF_PAGE_COUNT
MAPPING_PAGE_NUMBERS
PRINT_PAGE_NUMBERS
REPEAT_ROWS_PER_PAGE
IS_DIGITALLY_SIGNED
DIGITAL_SIGNATURE_DETAILS
ISACTIVE
STATUS
ACTION
ACTIONREMARK
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
```

APP and LOG tables follow the same table family pattern.

## Required DB Changes

### 1. Create Separate MF Common Approval Tables

Create PDF module approval tables:

```text
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
```

These tables are separate from:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
```

Use the existing Admin Common Approval table structure as a reference only. Do not insert PDF module approvals into `DDP_COMMON_APPROVAL_MASTER`.

Minimum recommended columns:

```text
AUTOID
TBL_AUTO_ID
MASTER_NAME
DISPLAY_FIELD1
DISPLAY_FIELD2
DISPLAY_FIELD3
DISPLAY_FIELD4
DISPLAY_FIELD5
DISPLAY_FIELD6
DISPLAY_FIELD7
DISPLAY_FIELD8
ACTION
STATUS
ACTION_REMARK
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
REJECTEDBY
REJECTEDDATE
REJECTION_REMARK
```

Create sequence/trigger setup:

```text
MF_COMMON_APPROVAL_MASTER_SEQ
MF_COMMON_APPROVAL_MASTER_LOG_SEQ
MF_COMMON_APPROVAL_MASTER_SEQ_TR
MF_COMMON_APPROVAL_MASTER_LOG_SEQ_TR
```

### 2. Create Standalone Template Master SP

Create:

```text
MF_TEMPLATE_MASTER_IUDS
```

Do not create a package.

Required process flags:

```text
S / SELECT       - return Template Master rows
GETBYID          - return one template
INSERT           - create pending template in APP table
UPDATE           - create pending update in APP table
D / DELETE       - create pending delete/deactivate request
APPROVED         - optional only if approval logic is not kept fully in MF Common Approval
REJECTED         - optional only if approval logic is not kept fully in MF Common Approval
```

Preferred pattern:

- Maker operations are handled in `MF_TEMPLATE_MASTER_IUDS`.
- Checker approval/rejection is handled by `MF_COMMON_APPROVAL_IUDS`.

### 3. Create Separate MF Common Approval SPs

Create:

```text
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Do not extend:

```text
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
```

Required MF Common Approval behavior:

- Include `Template Master` in MF master-name filters.
- Display pending Template Master rows.
- Prevent maker from approving own request.
- On approve:
  - Update `MF_TEMPLATE_MASTER_APP`.
  - Insert or update `MF_TEMPLATE_MASTER`.
  - Insert `MF_TEMPLATE_MASTER_LOG`.
  - Update `MF_COMMON_APPROVAL_MASTER`.
  - Insert `MF_COMMON_APPROVAL_MASTER_LOG`.
- On reject:
  - Update `MF_TEMPLATE_MASTER_APP`.
  - Update `MF_COMMON_APPROVAL_MASTER`.
  - Insert `MF_COMMON_APPROVAL_MASTER_LOG`.
  - Keep existing approved live template unchanged.

Use this `MasterName` exactly:

```text
Template Master
```

### 3. File Storage Rule

DB should store only file metadata and controlled file reference:

```text
ORIGINAL_FILE_NAME
STORED_FILE_NAME
FILE_PATH or document reference
FILE_HASH
FILE_SIZE_BYTES
MIME_TYPE
```

Do not store unrestricted local file-system paths in a value returned directly to Angular.

### 4. Validation Rules in SP/API

Validate:

- Template code is unique against live and pending APP data.
- Template name is unique as required by business rule.
- PDF page count is greater than zero.
- Mapping page numbers are present and within page count.
- Print page numbers are present and within page count.
- Repeat rows per page is greater than zero.
- `ISACTIVE` is `Y` or `N`.
- File metadata is present for insert.
- Update does not overwrite live data before approval.

## Suggested SP Signature

```sql
CREATE OR REPLACE PROCEDURE MF_TEMPLATE_MASTER_IUDS
(
    p_Qflag                     IN VARCHAR2,
    p_Auto_Id                   IN NUMBER DEFAULT NULL,
    p_Mst_Col_Id                IN NUMBER DEFAULT NULL,
    p_Template_Code             IN VARCHAR2 DEFAULT NULL,
    p_Template_Name             IN VARCHAR2 DEFAULT NULL,
    p_Template_Description      IN VARCHAR2 DEFAULT NULL,
    p_Original_File_Name        IN VARCHAR2 DEFAULT NULL,
    p_Stored_File_Name          IN VARCHAR2 DEFAULT NULL,
    p_File_Path                 IN VARCHAR2 DEFAULT NULL,
    p_File_Hash                 IN VARCHAR2 DEFAULT NULL,
    p_File_Size_Bytes           IN NUMBER DEFAULT NULL,
    p_Mime_Type                 IN VARCHAR2 DEFAULT NULL,
    p_Pdf_Page_Count            IN NUMBER DEFAULT NULL,
    p_Mapping_Page_Numbers      IN VARCHAR2 DEFAULT NULL,
    p_Print_Page_Numbers        IN VARCHAR2 DEFAULT NULL,
    p_Repeat_Rows_Per_Page      IN NUMBER DEFAULT NULL,
    p_Is_Digitally_Signed       IN VARCHAR2 DEFAULT NULL,
    p_Digital_Signature_Details IN VARCHAR2 DEFAULT NULL,
    p_IsActive                  IN VARCHAR2 DEFAULT NULL,
    p_UserId                    IN VARCHAR2 DEFAULT NULL,
    p_Remark                    IN VARCHAR2 DEFAULT NULL,
    cur                         OUT SYS_REFCURSOR,
    cur1                        OUT SYS_REFCURSOR
);
/
```

## SP Response Shape

Follow User Master / Role Master DataSet style.

For list:

```text
Table  = all records / pending-aware list
Table1 = approved records
```

For commands:

```text
Table = message row with Status/Msg or msg/errmsg
```

Do not return sample data.

## API Plan

Create backend files:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/TemplateMasterController.cs
HDFC.PDFCoordinateMapper.Api/Controllers/MfCommonApprovalController.cs
HDFC.PDFCoordinateMapper.Api/Services/TemplateMasterService.cs
HDFC.PDFCoordinateMapper.Api/Services/MfCommonApprovalService.cs
HDFC.PDFCoordinateMapper.Api/Models/TemplateMasterModels.cs
HDFC.PDFCoordinateMapper.Api/Models/MfCommonApprovalModels.cs
```

Update:

```text
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj
```

### API Route Prefix

Use:

```csharp
[RoutePrefix("api/TemplateMaster")]
```

### API Endpoints

Template Master:

```text
GET  /api/TemplateMaster/GetTemplateMaster
GET  /api/TemplateMaster/GetTemplateMasterById?autoId=
POST /api/TemplateMaster/SaveTemplateMaster
POST /api/TemplateMaster/Delete_TemplateMaster
POST /api/TemplateMaster/UploadTemplatePdf
GET  /api/TemplateMaster/PreviewTemplatePdf?templateId=
```

MF Common Approval:

```text
GET  /api/MfCommonApproval/GetPendingSummary
GET  /api/MfCommonApproval/GetMasters
POST /api/MfCommonApproval/GetPendingDetails
POST /api/MfCommonApproval/Approve
POST /api/MfCommonApproval/Reject
```

Notes:

- `UploadTemplatePdf` should validate PDF and save it in controlled storage.
- `PreviewTemplatePdf` should stream PDF content through API authorization.
- Save should pass file metadata to `MF_TEMPLATE_MASTER_IUDS`.
- Do not expose physical file paths to Angular.
- MF Common Approval endpoints should call only `MF_COMMON_APPROVAL_IUDS` and `MF_GET_COMMON_APPROVAL_DATA`.

### API Service Responsibilities

`TemplateMasterService` should:

- Call `MF_TEMPLATE_MASTER_IUDS`.
- Build Oracle parameters by name.
- Return `DataSet`.
- Store uploaded PDFs under configured secure upload/template path.
- Calculate file hash.
- Validate file extension, MIME type, size, and PDF header.
- Keep controller thin.

### API Model

Create request model with:

```csharp
public sealed class TemplateMasterRequest
{
    public string Flag { get; set; }
    public string Auto_Id { get; set; }
    public string Mst_Col_Id { get; set; }
    public string Template_Code { get; set; }
    public string Template_Name { get; set; }
    public string Template_Description { get; set; }
    public string Original_File_Name { get; set; }
    public string Stored_File_Name { get; set; }
    public string File_Path { get; set; }
    public string File_Hash { get; set; }
    public string File_Size_Bytes { get; set; }
    public string Mime_Type { get; set; }
    public string Pdf_Page_Count { get; set; }
    public string Mapping_Page_Numbers { get; set; }
    public string Print_Page_Numbers { get; set; }
    public string Repeat_Rows_Per_Page { get; set; }
    public string Is_Digitally_Signed { get; set; }
    public string Digital_Signature_Details { get; set; }
    public string IsActive { get; set; }
    public string CurrentUserId { get; set; }
    public string Remark { get; set; }
}
```

Use plain values from Angular, as done in current V1 pages.

## Angular UI Structure

Create feature folder:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/pdf-coordinate-mapper/template-master/
  template-master.models.ts
  template-master-api.service.ts
  template-master.store.ts
  template-master.page.ts
  template-master-form.dialog.ts
  template-master.routes.ts
```

Optional PDF preview component:

```text
template-pdf-preview.component.ts
```

Update:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/app.routes.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/core/layout/application-shell.component.ts
```

Target route:

```text
/pdf-coordinate-mapper/template-master
```

## Angular Models

Recommended model shape:

```ts
export type TemplateMasterView = 'all' | 'approved';

export interface TemplateMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  mstColId: string;
  templateCode: string;
  templateName: string;
  templateDescription: string;
  originalFileName: string;
  storedFileName: string;
  fileHash: string;
  fileSizeBytes: string;
  mimeType: string;
  pdfPageCount: string;
  mappingPageNumbers: string;
  printPageNumbers: string;
  repeatRowsPerPage: string;
  isDigitallySigned: string;
  digitalSignatureDetails: string;
  active: string;
  status: string;
  action: string;
  actionRemark: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  approvedBy: string;
  approvedDate: string;
}

export interface TemplateMasterFormValue {
  templateCode: string;
  templateName: string;
  templateDescription: string;
  originalFileName: string;
  storedFileName: string;
  fileHash: string;
  fileSizeBytes: string;
  mimeType: string;
  pdfPageCount: string;
  mappingPageNumbers: string;
  printPageNumbers: string;
  repeatRowsPerPage: string;
  isDigitallySigned: string;
  digitalSignatureDetails: string;
  active: string;
}
```

## Angular API Service

Create `TemplateMasterApiService`.

Required methods:

```ts
loadTemplates(): Observable<TemplateMasterListSnapshot>
uploadPdf(file: File): Observable<TemplateUploadResult>
previewPdf(templateId: string): Observable<Blob>
createTemplate(value: TemplateMasterFormValue, currentUser: string): Observable<CommandResult>
updateTemplate(record: TemplateMasterRecord, value: TemplateMasterFormValue, currentUser: string): Observable<CommandResult>
deleteTemplate(record: TemplateMasterRecord, currentUser: string): Observable<CommandResult>
```

Service responsibilities:

- Own URLs.
- Parse DataSet tables.
- Normalize DB field names.
- Extract DB messages.
- Build exact save payloads.
- Never return fake rows.

## Angular Store

Create signal-based `TemplateMasterStore`.

State:

```ts
templates
approvedTemplates
activeView
quickSearch
loading
uploading
submitting
errorMessage
lastMessage
```

Methods:

```ts
loadTemplates()
uploadPdf(file)
createTemplate(value)
updateTemplate(record, value)
deleteTemplate(record)
setActiveView(view)
setQuickSearch(value)
clearMessages()
```

Store reads current user from `AuthStore` like User Master.

## Angular Page Layout

Follow User Management page layout:

```text
Header
  Title: Template Master
  Tabs: All / Approved
  Actions: Refresh, Add Template

Message strip

AG Grid
  Actions column
  Template response columns
  Floating filters
  Pagination
```

Grid actions:

```text
View
Edit
Delete
Preview PDF
```

Do not show internal physical file path in the grid.

## Form Dialog Layout

Modes:

```text
create
edit
view
```

Sections:

```text
Template
  Template Code
  Template Name
  Description
  Active

PDF
  Upload PDF
  Original File Name
  Page Count
  File Size
  Digital Signature flag/details

Page Configuration
  Mapping Page Numbers
  Print Page Numbers
  Repeat Rows Per Page

Preview
  PDF preview/page selector
```

Validation:

| Field | Rule |
| --- | --- |
| Template Code | Required; unique |
| Template Name | Required |
| PDF File | Required on create |
| PDF Re-upload | Not allowed after record creation |
| PDF Page Count | Required; greater than zero |
| Mapping Pages | Required; multi-select combo; all pages within PDF page count |
| Print Pages | Required; multi-select combo; all pages within PDF page count |
| Repeat Rows Per Page | Required; greater than zero |
| Active | Required; `Y` or `N` |

Submit labels:

```text
Create: Submit for Approval
Edit: Submit Update for Approval
View: no submit
Delete: Submit Delete
```

## PDF Preview and Page Selection

Use PDF.js in Angular for preview and page count/page selection if available during implementation.

Rules:

- PDF loaded through API blob endpoint.
- Do not expose physical path.
- Allow selecting mapping pages through a multiple-selection combo box.
- Allow selecting print pages through a multiple-selection combo box.
- Validate selected pages against page count.
- Store selected pages as comma-separated values in:
  - `MAPPING_PAGE_NUMBERS`
  - `PRINT_PAGE_NUMBERS`

First implementation must use multiple-selection combo boxes for page selection. PDF.js preview can be enhanced later if needed, but page selection must not be a plain free-text field.

Upload rules:

- Add mode: allow one PDF upload only.
- Accepted file type: `.pdf` only.
- API must also validate PDF extension and file header.
- Edit/view mode: show existing PDF metadata and preview action, but do not allow re-upload or replacement.
- If a template file must be replaced in the future, create a separate change request flow after approval of a new requirement.

## API Payload Mapping

Create payload:

```json
{
  "flag": "INSERT",
  "template_Code": "<templateCode>",
  "template_Name": "<templateName>",
  "template_Description": "<description>",
  "original_File_Name": "<originalFileName>",
  "stored_File_Name": "<storedFileName>",
  "file_Hash": "<fileHash>",
  "file_Size_Bytes": "<fileSizeBytes>",
  "mime_Type": "<mimeType>",
  "pdf_Page_Count": "<pageCount>",
  "mapping_Page_Numbers": "<mappingPages>",
  "print_Page_Numbers": "<printPages>",
  "repeat_Rows_Per_Page": "<repeatRowsPerPage>",
  "is_Digitally_Signed": "N",
  "digital_Signature_Details": "",
  "isActive": "Y",
  "currentUserId": "<loggedInUser>"
}
```

Update payload adds:

```json
{
  "flag": "UPDATE",
  "auto_Id": "<app/live auto id>",
  "mst_Col_Id": "<live auto id if updating approved record>"
}
```

Delete payload:

```json
{
  "flag": "D",
  "auto_Id": "<autoId>",
  "mst_Col_Id": "<live auto id>",
  "currentUserId": "<loggedInUser>"
}
```

## Common Approval Display

Pending Template Master rows should show enough data for checker review:

```text
Template Code
Template Name
PDF Page Count
Mapping Pages
Print Pages
Repeat Rows Per Page
Action
Maker
Created Date
```

Checker detail should include PDF metadata and preview/download option through API.

This display must be backed by `MF_COMMON_APPROVAL_MASTER` and `MF_GET_COMMON_APPROVAL_DATA`, not the Admin `DDP_COMMON_APPROVAL_MASTER` flow.

## Implementation Order

1. Create `MF_COMMON_APPROVAL_MASTER` and `MF_COMMON_APPROVAL_MASTER_LOG`.
2. Create sequences/triggers for the MF Common Approval tables.
3. Confirm final Template Master SP signature.
4. Create `MF_TEMPLATE_MASTER_IUDS`.
5. Create `MF_COMMON_APPROVAL_IUDS`.
6. Create `MF_GET_COMMON_APPROVAL_DATA`.
7. Test SPs in SQLcl MCP.
8. Add API models/services/controllers.
9. Register services in Unity.
10. Update `.csproj` compile includes.
11. Build API.
12. Add Angular feature folder.
13. Add Angular models/API service/store/page/dialog/routes.
14. Add route and shell navigation.
15. Build Angular.
16. Test list/upload/save/update/delete flows.
17. Test MF Common Approval approve/reject flow.

## Verification Checklist

DB:

- `MF_TEMPLATE_MASTER_IUDS` is valid.
- `MF_COMMON_APPROVAL_IUDS` is valid.
- `MF_GET_COMMON_APPROVAL_DATA` is valid.
- `MF_COMMON_APPROVAL_MASTER` exists.
- `MF_COMMON_APPROVAL_MASTER_LOG` exists.
- Insert creates `MF_TEMPLATE_MASTER_APP` row.
- Insert creates `MF_COMMON_APPROVAL_MASTER` row with `MASTER_NAME = 'Template Master'`.
- Approval inserts/updates `MF_TEMPLATE_MASTER`.
- Approval inserts `MF_TEMPLATE_MASTER_LOG`.
- Approval inserts `MF_COMMON_APPROVAL_MASTER_LOG`.
- Rejection keeps live data unchanged.

API:

- `dotnet build HDFC.PDFCoordinateMapper.sln` succeeds.
- `GetTemplateMaster` returns DataSet JSON.
- `SaveTemplateMaster` sends `INSERT`/`UPDATE`.
- `Delete_TemplateMaster` sends `D`.
- Upload validates PDF and stores metadata.
- Preview streams through authorized API.

Angular:

- `npm run build` succeeds from `HDFC.PDFCoordinateMapper.WebV1`.
- Route `/pdf-coordinate-mapper/template-master` loads.
- All/Approved tabs bind to real API DataSet tables.
- Add/edit/view dialog works.
- Page-number validation works.
- DB/API messages are shown as returned.

## Open Decisions Before Coding

- Final upload storage location under API `UploadPath` or a dedicated `TemplatePath`.
- Maximum PDF file size for Template Master.
- Whether PDF.js preview is mandatory in first pass or can follow after text-based page-number validation.
- Exact MF Common Approval display fields for Template Master.
- Whether `Template Name` must be globally unique.

## Final Rule

Template Master must follow the User Management module structure and use Admin Maker-Checker/Common Approval only as a reference pattern.

For `PDFCordinateMapperModule`, create separate `MF_` Common Approval tables and `MF_` stored procedures. Do not use Admin `DDP_COMMON_APPROVAL_MASTER` for PDF module approvals, and do not create packages or frontend-only validation that bypasses API/DB rules.
