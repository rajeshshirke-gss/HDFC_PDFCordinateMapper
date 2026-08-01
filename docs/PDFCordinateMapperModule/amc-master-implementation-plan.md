# AMC Master Implementation Plan

## Purpose

Create AMC Master functionality for `PDFCordinateMapperModule` using the same structure already used by User Management and the current Template Master implementation.

AMC Master maintains AMC reference data used by Template Master and later PDF mapping/processing flows. It must use Maker-Checker through the PDF module's separate `MF_` Common Approval flow.

Do not start implementation until this plan is reviewed.

## Scope

- Oracle standalone stored procedure for AMC Master.
- ASP.NET Web API controller, service, and model.
- Angular standalone feature page.
- Maker create/update/delete request submission.
- Checker approval through existing PDF module `MF_` Common Approval objects.
- All/Approved tabbed grid view.
- Add/Edit/View dialog.

## Out Of Scope

- Template Master changes.
- Template Mapping.
- PDF upload or PDF preview.
- Excel upload, row validation, and PDF generation.
- New packages or new framework/library setup.
- Admin Common Approval table/procedure changes.

## Verified Current DB State

MCP verified on `HDFCPDFMAP`:

```text
MF_AMC_MASTER                         TABLE     VALID
MF_AMC_MASTER_APP                     TABLE     VALID
MF_AMC_MASTER_LOG                     TABLE     VALID
MF_AMC_MASTER_SEQ                     SEQUENCE  VALID
MF_AMC_MASTER_APP_SEQ                 SEQUENCE  VALID
MF_AMC_MASTER_LOG_SEQ                 SEQUENCE  VALID
MF_AMC_MASTER_SEQ_TR                  TRIGGER   VALID
MF_AMC_MASTER_APP_SEQ_TR              TRIGGER   VALID
MF_AMC_MASTER_LOG_SEQ_TR              TRIGGER   VALID
MF_COMMON_APPROVAL_MASTER             TABLE     VALID
MF_COMMON_APPROVAL_MASTER_LOG         TABLE     VALID
MF_COMMON_APPROVAL_IUDS               PROCEDURE VALID
MF_GET_COMMON_APPROVAL_DATA           PROCEDURE VALID
```

Missing:

```text
MF_AMC_MASTER_IUDS
```

## Existing DB Tables

AMC Master uses:

```text
MF_AMC_MASTER
MF_AMC_MASTER_APP
MF_AMC_MASTER_LOG
```

Approval queue/history uses:

```text
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
```

Do not use Admin approval tables:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
```

## Existing AMC Columns

Live table `MF_AMC_MASTER`:

```text
AUTOID
AMC_CODE
AMC_NAME
AMC_DESCRIPTION
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

APP table `MF_AMC_MASTER_APP` adds:

```text
MST_COL_ID
```

LOG table `MF_AMC_MASTER_LOG` adds:

```text
LOGID
MST_COL_ID
```

## Required DB Changes

### 1. Create Standalone AMC Master SP

Create:

```text
MF_AMC_MASTER_IUDS
```

Do not create a package.

Required flags:

```text
S / SELECT       - return AMC rows
GETBYID          - return one AMC row
INSERT           - create pending AMC in APP table
UPDATE           - create pending update in APP table
D / DELETE       - create pending delete/deactivate request
```

Preferred pattern:

- Maker operations are handled in `MF_AMC_MASTER_IUDS`.
- Checker approval/rejection remains in `MF_COMMON_APPROVAL_IUDS`.
- Approval details remain in `MF_GET_COMMON_APPROVAL_DATA`.

### 2. Extend MF Common Approval Procedure Behavior

Update `MF_COMMON_APPROVAL_IUDS` and `MF_GET_COMMON_APPROVAL_DATA` only if current logic is Template-Master-only.

Required AMC behavior:

- Include pending records where `MASTERNAME = 'AMC Master'`.
- Display AMC Code, AMC Name, Description, Active, Action, Maker, Created Date.
- Prevent maker from approving own request.
- On approve insert/update `MF_AMC_MASTER`.
- On approve insert `MF_AMC_MASTER_LOG`.
- On approve update `MF_AMC_MASTER_APP`.
- On approve update and log `MF_COMMON_APPROVAL_MASTER`.
- On reject update `MF_AMC_MASTER_APP`.
- On reject update and log `MF_COMMON_APPROVAL_MASTER`.
- Rejection must keep live approved AMC unchanged.

Use this `MasterName` exactly:

```text
AMC Master
```

### 3. Validation Rules in SP/API

Validate at API and DB level:

- AMC Code is required.
- AMC Name is required.
- AMC Code is unique against live approved rows and pending APP rows.
- AMC Name is unique as per business rule, preferably unique against live and pending APP rows.
- Description length must fit `AMC_DESCRIPTION`.
- `ISACTIVE` must be `Y` or `N`.
- Update/delete must reference an existing approved live row.
- Do not allow duplicate pending request for the same live AMC.
- Do not allow maker to approve own request in common approval.

## Suggested SP Signature

```sql
CREATE OR REPLACE PROCEDURE MF_AMC_MASTER_IUDS
(
    p_Qflag           IN VARCHAR2,
    p_Auto_Id         IN NUMBER DEFAULT NULL,
    p_Mst_Col_Id      IN NUMBER DEFAULT NULL,
    p_Amc_Code        IN VARCHAR2 DEFAULT NULL,
    p_Amc_Name        IN VARCHAR2 DEFAULT NULL,
    p_Amc_Description IN VARCHAR2 DEFAULT NULL,
    p_IsActive        IN VARCHAR2 DEFAULT NULL,
    p_UserId          IN VARCHAR2 DEFAULT NULL,
    p_Remark          IN VARCHAR2 DEFAULT NULL,
    cur               OUT SYS_REFCURSOR,
    cur1              OUT SYS_REFCURSOR
);
/
```

## SP Response Shape

Follow User Master / Template Master DataSet style.

For list:

```text
Table  = all pending-aware APP rows
Table1 = approved live rows
```

For command:

```text
Table = message row with ERRMSG/MESSAGE
Table1 = affected APP row where useful
```

Do not return fake or sample data.

## API Plan

Create backend files:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/AmcMasterController.cs
HDFC.PDFCoordinateMapper.Api/Services/AmcMasterService.cs
HDFC.PDFCoordinateMapper.Api/Models/AmcMasterModels.cs
```

Update:

```text
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj
```

### API Route Prefix

Use:

```csharp
[RoutePrefix("api/AmcMaster")]
```

### API Endpoints

```text
GET  /api/AmcMaster/GetAmcMaster
GET  /api/AmcMaster/GetAmcMasterById?autoId=
POST /api/AmcMaster/SaveAmcMaster
POST /api/AmcMaster/Delete_AmcMaster
```

Optional if another feature needs an AMC dropdown directly:

```text
GET /api/AmcMaster/GetAllRecordForDDL
```

Template Master already has its own AMC dropdown through `MF_TEMPLATE_MASTER_IUDS`, so avoid duplication unless needed.

### API Service Responsibilities

`AmcMasterService` should:

- Call `MF_AMC_MASTER_IUDS`.
- Build Oracle parameters by name.
- Return `DataSet`.
- Keep controller thin.
- Preserve DB messages.
- Use plain Angular values, matching the current V1 feature style.

### API Model

Create request model:

```csharp
public sealed class AmcMasterRequest
{
    public string Flag { get; set; }
    public string Auto_Id { get; set; }
    public string Mst_Col_Id { get; set; }
    public string Amc_Code { get; set; }
    public string Amc_Name { get; set; }
    public string Amc_Description { get; set; }
    public string IsActive { get; set; }
    public string CurrentUserId { get; set; }
    public string Remark { get; set; }
}
```

## Angular UI Structure

Create feature folder:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/pdf-coordinate-mapper/amc-master/
  amc-master.models.ts
  amc-master-api.service.ts
  amc-master.store.ts
  amc-master.page.ts
  amc-master-form.dialog.ts
  amc-master.routes.ts
```

Update:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/app.routes.ts
```

Add shell navigation only if the module menu source does not already provide it dynamically.

Target route:

```text
/pdf-coordinate-mapper/amc-master
```

## Angular Models

Recommended model shape:

```ts
export type AmcMasterView = 'all' | 'approved';
export type AmcMasterFormMode = 'create' | 'edit' | 'view';

export interface AmcMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  mstColId: string;
  amcCode: string;
  amcName: string;
  amcDescription: string;
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

export interface AmcMasterFormValue {
  amcCode: string;
  amcName: string;
  amcDescription: string;
  active: string;
  remark: string;
}

export interface AmcMasterListSnapshot {
  amcs: AmcMasterRecord[];
  approvedAmcs: AmcMasterRecord[];
}
```

## Angular API Service

Create `AmcMasterApiService`.

Required methods:

```ts
loadAmcs(): Observable<AmcMasterListSnapshot>
createAmc(value: AmcMasterFormValue, currentUser: string): Observable<CommandResult>
updateAmc(record: AmcMasterRecord, value: AmcMasterFormValue, currentUser: string): Observable<CommandResult>
deleteAmc(record: AmcMasterRecord, currentUser: string): Observable<CommandResult>
```

Service responsibilities:

- Own URLs.
- Parse DataSet tables.
- Normalize DB field names.
- Extract DB messages.
- Build exact save/delete payloads.
- Never return fake rows.

## Angular Store

Create signal-based `AmcMasterStore`.

State:

```text
amcs
approvedAmcs
activeView
quickSearch
loading
submitting
errorMessage
lastMessage
```

Methods:

```text
loadAmcs()
createAmc(value)
updateAmc(record, value)
deleteAmc(record)
setActiveView(view)
setQuickSearch(value)
clearMessages()
```

Store reads current user from `AuthStore`.

## Angular Page Layout

Follow User Management and Template Master operational layout:

```text
Header
  Title: AMC Master
  Tabs: All / Approved
  Actions: Refresh, Add AMC

Message strip

AG Grid
  Actions column
  AMC response columns
  Floating filters
  Pagination
```

Grid actions:

```text
View
Edit
Delete
```

Hide internal technical IDs unless needed for operations.

## Form Dialog Layout

Modes:

```text
create
edit
view
```

Fields:

```text
AMC Code
AMC Name
AMC Description
Active
Remark
```

Validation:

| Field | Rule |
| --- | --- |
| AMC Code | Required; max 100; unique |
| AMC Name | Required; max 500; unique as per business rule |
| AMC Description | Optional; max 2000 |
| Active | Required; `Y` or `N` |
| Remark | Optional for create/update; recommended/required for delete if business wants checker context |

Submit labels:

```text
Create: Submit for Approval
Edit: Submit Update for Approval
View: no submit
Delete: Submit Delete
```

## API Payload Mapping

Create payload:

```json
{
  "flag": "INSERT",
  "amc_Code": "<amcCode>",
  "amc_Name": "<amcName>",
  "amc_Description": "<description>",
  "isActive": "Y",
  "currentUserId": "<loggedInUser>",
  "remark": "<remark>"
}
```

Update payload:

```json
{
  "flag": "UPDATE",
  "auto_Id": "<app/live auto id>",
  "mst_Col_Id": "<live auto id>",
  "amc_Code": "<amcCode>",
  "amc_Name": "<amcName>",
  "amc_Description": "<description>",
  "isActive": "Y",
  "currentUserId": "<loggedInUser>",
  "remark": "<remark>"
}
```

Delete payload:

```json
{
  "flag": "D",
  "auto_Id": "<autoId>",
  "mst_Col_Id": "<live auto id>",
  "currentUserId": "<loggedInUser>",
  "remark": "<remark>"
}
```

## Common Approval Display

Pending AMC Master rows should show:

```text
AMC Code
AMC Name
AMC Description
Active
Action
Maker
Created Date
Remark
```

Checker detail must be backed by:

```text
MF_COMMON_APPROVAL_MASTER
MF_GET_COMMON_APPROVAL_DATA
```

Do not use:

```text
DDP_COMMON_APPROVAL_MASTER
USP_GET_COMMAPPROVALDATA_CCIL
```

## Implementation Order

1. Confirm `MF_AMC_MASTER*` tables/sequences/triggers remain valid.
2. Create `MF_AMC_MASTER_IUDS`.
3. Extend `MF_COMMON_APPROVAL_IUDS` for `MASTERNAME = 'AMC Master'` if it is currently Template-Master-only.
4. Extend `MF_GET_COMMON_APPROVAL_DATA` for AMC detail rows.
5. Test SPs in SQLcl MCP.
6. Add API model/service/controller.
7. Register service in Unity.
8. Update `.csproj` compile includes.
9. Build API.
10. Add Angular feature folder.
11. Add Angular models/API service/store/page/dialog/routes.
12. Add lazy route in `app.routes.ts`.
13. Build Angular.
14. Test list/create/update/delete request submission.
15. Test approve/reject flow through MF Common Approval.
16. Confirm approved AMC appears in Template Master AMC dropdown.

## Verification Checklist

DB:

- `MF_AMC_MASTER_IUDS` is valid.
- `MF_COMMON_APPROVAL_IUDS` supports `AMC Master`.
- `MF_GET_COMMON_APPROVAL_DATA` supports `AMC Master`.
- Insert creates `MF_AMC_MASTER_APP` row.
- Insert creates `MF_COMMON_APPROVAL_MASTER` row with `MASTERNAME = 'AMC Master'`.
- Approval inserts/updates `MF_AMC_MASTER`.
- Approval inserts `MF_AMC_MASTER_LOG`.
- Approval inserts `MF_COMMON_APPROVAL_MASTER_LOG`.
- Rejection keeps live AMC unchanged.
- Duplicate AMC Code is blocked.

API:

- `dotnet build HDFC.PDFCoordinateMapper.sln` succeeds.
- `GetAmcMaster` returns DataSet JSON.
- `SaveAmcMaster` sends `INSERT`/`UPDATE`.
- `Delete_AmcMaster` sends `D`.
- API surfaces DB validation messages.

Angular:

- `npm run build` succeeds from `HDFC.PDFCoordinateMapper.WebV1`.
- Route `/pdf-coordinate-mapper/amc-master` loads.
- All/Approved tabs bind to real API DataSet tables.
- Add/edit/view dialog works.
- Create/update/delete submits to API.
- DB/API messages are shown as returned.

## Open Decisions Before Coding

- Whether AMC Name must be globally unique or only AMC Code is unique.
- Whether delete means hard delete after approval or active flag set to `N`; recommended first pass is deactivate.
- Whether delete remark should be mandatory.
- Whether AMC Master route should be added to static shell navigation or rely on dynamic DB menu.

## Final Rule

AMC Master must follow the User Management module structure and use Admin Maker-Checker/Common Approval only as a reference pattern.

For `PDFCordinateMapperModule`, use separate `MF_` Common Approval tables and `MF_` standalone stored procedures. Do not use Admin `DDP_COMMON_APPROVAL_MASTER` or Admin `USP_COMMON_APPROVAL_IUDS` for PDF module approvals.
