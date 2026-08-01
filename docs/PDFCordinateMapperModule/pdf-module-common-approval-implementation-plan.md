# PDF Module Common Approval Implementation Plan

## Purpose

Create a dedicated Common Approval feature for `PDFCordinateMapperModule`.

This feature lets checker users review, approve, or reject pending Maker requests raised by PDF module master/configuration features such as AMC Master and Template Master. It must follow the existing Admin Common Approval user experience as a reference, but it must use only the PDF module's separate `MF_` approval tables and stored procedures.

Do not start implementation until this plan is reviewed.

## Scope

- PDF module Common Approval backend API.
- Angular standalone approval page.
- Pending approval list.
- Master filter/dropdown.
- Detail dialog.
- Approve/reject confirmation and remark capture.
- Support for current PDF module masters:
  - `AMC Master`
  - `Template Master`
- Extensible structure for future PDF module masters:
  - Template Mapping Main
  - Template Mapping Field
  - Template Mapping Field Configuration

## Out Of Scope

- Admin Common Approval changes.
- User Management approval changes.
- Row-level operational approvals for Excel/PDF processing.
- New APP/LOG table creation for future masters.
- PDF generation workflow.
- Replacing the existing Admin approval UI.

## Reference Pattern

Use Admin Common Approval as UI/API reference only:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/CommonApprovalController.cs
HDFC.PDFCoordinateMapper.Api/Services/CommonApprovalService.cs
HDFC.PDFCoordinateMapper.Api/Models/CommonApprovalModels.cs
HDFC.PDFCoordinateMapper.WebV1/src/app/features/administration/common-approval/
```

Do not call Admin DB objects:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
```

## Verified Current DB State

MCP verified on `HDFCPDFMAP`:

```text
MF_COMMON_APPROVAL_MASTER             TABLE     VALID
MF_COMMON_APPROVAL_MASTER_LOG         TABLE     VALID
MF_COMMON_APPROVAL_MASTER_SEQ         SEQUENCE  VALID
MF_COMMON_APPROVAL_MASTER_LOG_SEQ     SEQUENCE  VALID
MF_COMMON_APPROVAL_MASTER_SEQ_TR      TRIGGER   VALID
MF_COMMON_APPROVAL_MASTER_LOG_SEQ_TR  TRIGGER   VALID
MF_COMMON_APPROVAL_IUDS               PROCEDURE VALID
MF_GET_COMMON_APPROVAL_DATA           PROCEDURE VALID
MF_AMC_MASTER_IUDS                    PROCEDURE VALID
MF_TEMPLATE_MASTER_IUDS               PROCEDURE VALID
```

Current producer procedures:

```text
MF_AMC_MASTER_IUDS        creates pending AMC Master approval rows
MF_TEMPLATE_MASTER_IUDS   creates pending Template Master approval rows
```

Current checker procedure:

```text
MF_COMMON_APPROVAL_IUDS
```

Current detail procedure:

```text
MF_GET_COMMON_APPROVAL_DATA
```

## DB Objects

Approval queue table:

```text
MF_COMMON_APPROVAL_MASTER
```

Approval history table:

```text
MF_COMMON_APPROVAL_MASTER_LOG
```

Current table shape follows Admin approval table structure:

```text
AUTO_ID
TBL_AUTO_ID
MASTERNAME
DISPLAYFIELD1 ... DISPLAYFIELD70
ACTION
STATUS
CREATEDBY
CREATEDDATE
REMARK
```

Important status convention:

```text
0 = Pending
2 = Approved
3 = Rejected
```

## Required DB Changes

No new table is required for the current Common Approval page.

Required DB validation before/while implementing:

- Confirm `MF_COMMON_APPROVAL_IUDS` returns pending list for flag `S` or `GET`.
- Confirm `MF_COMMON_APPROVAL_IUDS` returns master list for flag `FM`.
- Confirm `MF_COMMON_APPROVAL_IUDS` supports approve/reject for:
  - `AMC Master`
  - `Template Master`
- Confirm `MF_GET_COMMON_APPROVAL_DATA` returns detail rows for:
  - `AMC Master`
  - `Template Master`
- Confirm maker cannot approve/reject own request.
- Confirm approval writes the relevant live and log tables.
- Confirm rejection does not mutate live approved data.

If needed, extend `MF_COMMON_APPROVAL_IUDS` only as a standalone stored procedure. Do not create a package.

## Supported Master Names

Use these exact `MASTERNAME` values:

```text
AMC Master
Template Master
```

Future values:

```text
Template Mapping Main
Template Mapping Field
Template Mapping Field Configuration
```

## DB Procedure Contract

### MF_COMMON_APPROVAL_IUDS

Expected flags:

```text
S / SELECT / GET    - pending approval list
FM                  - master dropdown/list
A / APPROVE         - approve selected request
R / REJECT          - reject selected request
```

Expected input parameters should remain compatible with the existing Admin-style Common Approval service:

```text
p_Qflag
p_Auto_Id
p_tbl_Auto_Id
p_MasterName
p_UserID
p_Value
cur
```

Other legacy parameters may exist for compatibility but should not be used by the PDF Common Approval UI.

Approve/reject required payload values:

```text
p_Qflag       = A or R
p_Auto_Id     = MF_COMMON_APPROVAL_MASTER.AUTO_ID
p_tbl_Auto_Id = pending APP table AUTOID
p_MasterName  = AMC Master / Template Master
p_UserID      = checker user
p_Value       = approval or rejection remark
```

### MF_GET_COMMON_APPROVAL_DATA

Expected input parameters:

```text
p_MASTER_NAME
p_UPDATED_BY
p_CURR_USER
p_AUTO_ID
cur
```

Expected behavior:

- Return pending detail row(s) for selected master/request.
- Join `MF_COMMON_APPROVAL_MASTER` with the correct APP table based on `MASTERNAME`.
- Return business fields needed for checker review.

## Common Approval Behavior

List behavior:

- Show only pending approval rows by default.
- Allow checker to filter by master name.
- Hide internal columns unless needed by row actions.
- Show Maker, Created Date, Action, Status, Master Name, and display fields.

Detail behavior:

- Open a detail dialog from the selected row.
- Display master-specific fields in a readable format.
- For Template Master, show PDF metadata and page selection fields.
- For Template Master, include preview action if enough template id/file information is available.
- For AMC Master, show AMC Code, AMC Name, Description, Active.

Approval behavior:

- Checker clicks Approve.
- Require/allow approval remark as per business rule.
- Call `MF_COMMON_APPROVAL_IUDS` with `A`.
- Refresh pending list after success.
- Display DB/API message.

Rejection behavior:

- Checker clicks Reject.
- Rejection remark should be required.
- Call `MF_COMMON_APPROVAL_IUDS` with `R`.
- Refresh pending list after success.
- Display DB/API message.

Security behavior:

- API must remain authorized with `[ConfigurableAuthorize]`.
- DB procedure must block maker self-approval.
- UI can hide actions for maker-owned rows if current user matches `CREATEDBY`, but DB remains authoritative.

## API Plan

Create backend files:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/MfCommonApprovalController.cs
HDFC.PDFCoordinateMapper.Api/Services/MfCommonApprovalService.cs
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
[RoutePrefix("api/MfCommonApproval")]
```

### API Endpoints

```text
GET  /api/MfCommonApproval/GetPendingSummary
GET  /api/MfCommonApproval/GetMasters
POST /api/MfCommonApproval/GetPendingDetails
POST /api/MfCommonApproval/Approve
POST /api/MfCommonApproval/Reject
```

### API Service Responsibilities

`MfCommonApprovalService` should:

- Call `MF_COMMON_APPROVAL_IUDS` for list, masters, approve, reject.
- Call `MF_GET_COMMON_APPROVAL_DATA` for detail.
- Build Oracle parameters by name.
- Return `DataSet`.
- Preserve DB messages.
- Keep controller thin.
- Decode or pass plain values consistently with current Angular V1 pattern.

### API Models

Create request models:

```csharp
public sealed class MfCommonApprovalRequest
{
    public string Flag { get; set; }
    public string Auto_Id { get; set; }
    public string Tbl_Auto_Id { get; set; }
    public string MasterName { get; set; }
    public string CurrentUserId { get; set; }
    public string Remark { get; set; }
}

public sealed class MfCommonApprovalDetailRequest
{
    public string MasterName { get; set; }
    public string UpdatedBy { get; set; }
    public string CurrentUserId { get; set; }
    public string AutoId { get; set; }
}
```

## Angular UI Structure

Create feature folder:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/pdf-coordinate-mapper/common-approval/
  mf-common-approval.models.ts
  mf-common-approval-api.service.ts
  mf-common-approval.store.ts
  mf-common-approval.page.ts
  mf-common-approval-detail.dialog.ts
  mf-common-approval-action.dialog.ts
  mf-common-approval.routes.ts
```

Update:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/app.routes.ts
```

Add shell navigation only if the route is not dynamic from DB menu.

Target route:

```text
/pdf-coordinate-mapper/common-approval
```

## Angular Models

Recommended model shape:

```ts
export interface MfCommonApprovalRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tblAutoId: string;
  masterName: string;
  action: string;
  status: string;
  createdBy: string;
  createdDate: string;
  remark: string;
  displayFields: string[];
}

export interface MfCommonApprovalDetail {
  raw: Record<string, unknown>;
  masterName: string;
  fields: Array<{ label: string; value: string }>;
}

export interface MfCommonApprovalActionValue {
  remark: string;
}

export interface MfCommonApprovalCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}
```

## Angular API Service

Create `MfCommonApprovalApiService`.

Required methods:

```ts
loadPending(): Observable<MfCommonApprovalRecord[]>
loadMasters(): Observable<string[]>
loadDetails(record: MfCommonApprovalRecord, currentUser: string): Observable<MfCommonApprovalDetail[]>
approve(record: MfCommonApprovalRecord, remark: string, currentUser: string): Observable<MfCommonApprovalCommandResult>
reject(record: MfCommonApprovalRecord, remark: string, currentUser: string): Observable<MfCommonApprovalCommandResult>
```

Service responsibilities:

- Own URLs.
- Parse DataSet tables.
- Normalize DB fields.
- Map `DISPLAYFIELD1...DISPLAYFIELD70` into ordered display fields.
- Extract DB messages.
- Build exact approve/reject payloads.
- Never return fake rows.

## Angular Store

Create signal-based `MfCommonApprovalStore`.

State:

```text
pendingRows
masters
selectedMaster
quickSearch
loading
detailLoading
submitting
errorMessage
lastMessage
```

Methods:

```text
loadPending()
loadMasters()
setSelectedMaster(masterName)
setQuickSearch(value)
loadDetails(record)
approve(record, remark)
reject(record, remark)
clearMessages()
```

Store reads current user from `AuthStore`.

## Angular Page Layout

Follow Admin Common Approval visual structure:

```text
Header
  Title: PDF Module Common Approval
  Master filter
  Refresh

Message strip

AG Grid
  Actions column
  Master Name
  Action
  Maker
  Created Date
  Status
  Display fields
  Remark
```

Grid actions:

```text
View Details
Approve
Reject
```

Action behavior:

- `View Details` opens detail dialog.
- `Approve` opens action dialog with optional remark.
- `Reject` opens action dialog with required remark.
- Disable/hide approve/reject when current user is maker, but rely on DB for final enforcement.

## Detail Dialog Layout

Dialog title:

```text
<MasterName> Approval Details
```

Content:

```text
Request Summary
  Master Name
  Action
  Maker
  Created Date
  Remark

Business Fields
  Master-specific fields from MF_GET_COMMON_APPROVAL_DATA
```

Master-specific display:

AMC Master:

```text
AMC Code
AMC Name
AMC Description
Active
```

Template Master:

```text
Template Code
Template Name
Template Description
Original File Name
PDF Page Count
Mapping Pages
Print Pages
Repeat Rows Per Page
Active
```

Do not show physical file paths.

## Action Dialog Layout

Approve:

```text
Title: Approve Request
Remark
Buttons: Cancel, Approve
```

Reject:

```text
Title: Reject Request
Remark required
Buttons: Cancel, Reject
```

Do not use browser `alert()`.

## API Payload Mapping

Approve payload:

```json
{
  "flag": "A",
  "auto_Id": "<commonApprovalAutoId>",
  "tbl_Auto_Id": "<pendingAppAutoId>",
  "masterName": "<masterName>",
  "currentUserId": "<loggedInUser>",
  "remark": "<remark>"
}
```

Reject payload:

```json
{
  "flag": "R",
  "auto_Id": "<commonApprovalAutoId>",
  "tbl_Auto_Id": "<pendingAppAutoId>",
  "masterName": "<masterName>",
  "currentUserId": "<loggedInUser>",
  "remark": "<remark>"
}
```

Detail payload:

```json
{
  "masterName": "<masterName>",
  "updatedBy": "<maker>",
  "currentUserId": "<loggedInUser>",
  "autoId": "<commonApprovalAutoId>"
}
```

## Implementation Order

1. Verify `MF_COMMON_APPROVAL_*` DB objects are valid.
2. Smoke test list, master dropdown, detail, approve, reject procedures with SQLcl MCP.
3. Add API models/service/controller.
4. Register service in Unity.
5. Update `.csproj` compile includes.
6. Build API.
7. Add Angular feature folder.
8. Add models/API service/store/page/detail dialog/action dialog/routes.
9. Add lazy route in `app.routes.ts`.
10. Build Angular.
11. Create a pending AMC Master request and verify it appears.
12. Create a pending Template Master request and verify it appears.
13. Approve and reject from the PDF Common Approval page.
14. Verify live/log/common approval DB changes.

## Verification Checklist

DB:

- `MF_COMMON_APPROVAL_IUDS` is valid.
- `MF_GET_COMMON_APPROVAL_DATA` is valid.
- Pending list returns rows from `MF_COMMON_APPROVAL_MASTER`.
- Master list returns `AMC Master` and `Template Master` when pending rows exist.
- Detail returns master-specific APP data.
- Maker cannot approve own request.
- Approval updates APP/live/log/common approval objects.
- Rejection updates APP/common approval objects only.

API:

- `dotnet build HDFC.PDFCoordinateMapper.sln` succeeds.
- `GetPendingSummary` returns DataSet JSON.
- `GetMasters` returns DataSet JSON.
- `GetPendingDetails` returns master-specific DataSet JSON.
- `Approve` sends `A`.
- `Reject` sends `R`.
- API surfaces DB validation messages.

Angular:

- `npm run build` succeeds from `HDFC.PDFCoordinateMapper.WebV1`.
- Route `/pdf-coordinate-mapper/common-approval` loads.
- Master filter works.
- Grid binds to real API DataSet tables.
- Detail dialog shows selected request.
- Approve/reject calls API and refreshes rows.
- Rejection remark validation works.

## Open Decisions Before Coding

- Should approval remark be mandatory or optional?
- Should checker see only requests for assigned roles/groups, or all PDF module pending requests?
- Should Template Master detail include PDF preview/download in first pass?
- Should the route be added to static shell navigation or rely on DB menu?

## Final Rule

PDF Module Common Approval must use only:

```text
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Admin Common Approval is a reference pattern only. Do not route PDF module approvals through `DDP_COMMON_APPROVAL_MASTER` or `USP_COMMON_APPROVAL_IUDS`.
