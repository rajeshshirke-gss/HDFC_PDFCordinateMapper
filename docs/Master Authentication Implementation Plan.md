# Master Authentication Implementation Plan

## Scope

Implement the WebV1 Master Authentication screen using the existing API and DB contracts verified from `Master-Authentication.docx`, current API controllers/services/models, and pagewise context.

This screen is the checker workflow for approving/rejecting pending master changes. The legacy/menu label may be `Master Authentication`; the backend contract is currently under `CommonApproval`.

Target Angular route:

```text
/administration/common-approval
```

Implementation status:

```text
Implemented in WebV1 on 2026-07-27.
WebV1 build verified with npm run build.
API build verified with dotnet build HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj.
API and DB stored procedure contracts were verified from current API service code and Master-Authentication.docx.
Live DB execution still requires running the application against the configured database.
```

Required Angular call chain:

```text
Component/Page/Dialog -> NgRx Signal Store -> Feature API Service -> backend
```

No component or dialog should inject `HttpClient` or call feature API services directly.

## Verified API And DB Contracts

### Master Dropdown

Endpoint:

```text
POST /api/CommonApproval/GetAllMasterForDDL
```

Service method:

```text
CommonApprovalService.GetAllMasterForDdl()
```

Stored procedure:

```text
usp_Common_Approval_IUDS
```

SP parameters sent by API:

```text
p_Qflag = FM
p_Auto_Id = null
p_tbl_Auto_Id = null
p_MasterName = null
p_User = null
p_Group_Id = null
p_UserName = null
p_Email = null
p_Action = null
p_Status = null
p_UserID = null
p_CreatedDate = null
p_RoleDescription = null
p_RoleName = null
p_ModifiedDate = null
p_Password = null
p_clienttype = null
p_accounttype = null
p_clientname = null
p_clientid = null
p_configuration = null
p_specification = null
p_Value = null
p_isactive = null
cur
```

### Pending Summary

Endpoint:

```text
POST /api/CommonApproval/GetAllUser
```

Request:

```json
{
  "flag": "S",
  "user_Id": "<current user>",
  "User_Id": "<current user>",
  "userId": "<current user>",
  "currrentUserId": "<current user>"
}
```

Stored procedure:

```text
usp_Common_Approval_IUDS
```

Important mapped parameters:

```text
p_Qflag = S
p_UserID = current user
p_MasterName = optional selected master
cur
```

### Detail/View

Endpoint:

```text
POST /api/CommonApproval/GetData_CommonApproval
```

Request shape:

```json
{
  "Auth_MasterName": "ROLE_MASTER_DETAILS",
  "Auth_UpdatedBy": "<maker id>",
  "Auth_CurrUser": "<current checker user>",
  "Auth_AutoId": "<selected auto id>"
}
```

Stored procedure:

```text
USP_GET_COMMAPPROVALDATA_CCIL
```

SP parameters:

```text
p_MASTER_NAME <- Auth_MasterName
p_UPDATED_BY  <- Auth_UpdatedBy
p_CURR_USER   <- Auth_CurrUser
p_AUTO_ID     <- Auth_AutoId
cur
```

Doc sample showed `ROLE_MASTER_DETAILS` returning role rows with values such as auto id, role code/name/description, action, maker/checker/status/date fields, action remark, and active flag.

### Approve / Reject

Endpoint:

```text
POST /api/CommonApproval/CommonApproval_AR
```

Approve request:

```json
{
  "qflag": "A",
  "auto_Id": "",
  "tbl_Auto_Id": "<selected table auto id>",
  "masterName": "Role Master",
  "action": "A",
  "userID": "<current checker user>",
  "roleDescription": "<detail row description>",
  "roleName": "<detail row role name>",
  "modifiedDate": "<detail row modified date>"
}
```

Reject request:

```json
{
  "qflag": "R",
  "auto_Id": "",
  "tbl_Auto_Id": "<selected table auto id>",
  "masterName": "Role Master",
  "action": "R",
  "userID": "<current checker user>",
  "roleDescription": "<detail row description>",
  "roleName": "<detail row role name>",
  "modifiedDate": "<detail row modified date>"
}
```

Stored procedure:

```text
usp_Common_Approval_IUDS
```

Important SP parameters:

```text
p_Qflag <- A or R
p_Auto_Id <- Auto_Id
p_tbl_Auto_Id <- tbl_Auto_Id
p_MasterName <- MasterName
p_User <- User
p_Group_Id <- Group_Id
p_UserName <- UserName
p_Email <- Email
p_Action <- Action
p_Status <- Status
p_UserID <- UserID
p_CreatedDate <- CreatedDate
p_RoleDescription <- RoleDescription
p_RoleName <- RoleName
p_ModifiedDate <- ModifiedDate
p_Password <- Password
p_clienttype <- clienttype
p_accounttype <- accounttype
p_clientname <- clientname
p_clientid <- clientid
p_configuration <- configuration
p_specification <- specification
p_Value <- Value
p_isactive <- isactive
cur
```

Expected DB/API message example from doc:

```text
Role Updated Successfully
```

### Mapping Button

The doc says the Mapping button calls Role Module Mapping to show role menu mapping details.

Endpoint:

```text
POST /api/RoleModuleMapping/RoleModuleMaster_IUDS
```

Request:

```json
{
  "ProcessName": "SELECT",
  "RoleId": "<selected role id>",
  "RoleName": "",
  "MenuAccess": "",
  "Groupid": "",
  "UserId": "<current user>",
  "ApprovedBy": "",
  "AutoId": ""
}
```

Stored procedure:

```text
USP_CCIL_ROLEMODMAPPING_IUDS
```

SP parameters:

```text
p_ProcessName <- ProcessName
p_RoleId <- RoleId
p_RoleName <- RoleName
p_MenuAccess <- MenuAccess
p_Group_Id <- Groupid / GroupId
p_UserId <- UserId
p_CreatedDate <- null timestamp
p_ApproveUserId <- ApprovedBy
p_ApprovedDate <- null timestamp
p_AutoId <- AutoId
cur
cur1
cur2
```

Doc sample mapping response includes menu/module fields such as:

```text
MODULENAME
MainMenu
SubMenunumber
SubMenu
parent_Id
Caption
Url
menu_sequence
Menu_Id
MODULEID
m_menu_sequence
s_menu_sequence
MenuChecked
status
```

## Angular Feature Structure

Create:

```text
src/app/features/administration/common-approval/common-approval.models.ts
src/app/features/administration/common-approval/common-approval-api.service.ts
src/app/features/administration/common-approval/common-approval.store.ts
src/app/features/administration/common-approval/common-approval.page.ts
src/app/features/administration/common-approval/common-approval-detail.dialog.ts
src/app/features/administration/common-approval/role-module-mapping.dialog.ts
src/app/features/administration/common-approval/common-approval.routes.ts
```

Wire in `app.routes.ts`:

```text
path: administration/common-approval
```

Update runtime menu route mapping:

```text
Master Authentication
Common Approval
Authentication
Authorize
Approval leaf caption
```

should resolve to:

```text
/administration/common-approval
```

## Models

Recommended UI models:

```ts
export interface ApprovalMasterOption {
  raw: Record<string, unknown>;
  id: string;
  name: string;
  detailsMasterName: string;
}

export interface ApprovalSummaryRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tableAutoId: string;
  masterName: string;
  detailsMasterName: string;
  referenceNo: string;
  makerId: string;
  description: string;
  action: string;
  status: string;
  count: string;
}

export interface ApprovalDetailRecord {
  raw: Record<string, unknown>;
  autoId: string;
  tableAutoId: string;
  roleName: string;
  roleDescription: string;
  action: string;
  status: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  active: string;
  decision: 'approve' | 'reject' | '';
}

export interface RoleModuleMappingRecord {
  raw: Record<string, unknown>;
  moduleName: string;
  mainMenu: string;
  subMenu: string;
  menuId: string;
  moduleId: string;
  menuChecked: boolean;
  status: string;
}
```

## Store Responsibilities

The NgRx Signal Store owns:

```text
master options
selected master
pending summary rows
selected summary record
detail rows
role module mapping rows
loading flags
submitting flags
error message
last DB/API message
selected approve/reject decisions
```

Store methods:

```text
loadMasters()
setSelectedMaster(master)
loadPending()
loadDetails(summaryRecord)
setDetailDecision(detailRecord, decision)
approveAllFiltered(detailIds)
rejectAllFiltered(detailIds)
clearDecisions()
submitDecisions()
loadRoleModuleMapping(detailRecord)
clearDetail()
clearMessages()
```

The page and dialogs call only store methods/signals.

## API Service Responsibilities

The feature API service owns:

```text
endpoint URLs
request payload construction
DataSet Table/Table1/Table2 parsing
row-to-model mapping
DB/API message extraction
error normalization
```

Methods:

```text
loadMasters()
loadPending(currentUser, selectedMaster?)
loadDetails(record, currentUser)
approve(record, currentUser)
reject(record, currentUser)
loadRoleModuleMapping(roleId, currentUser)
```

## Page Layout

Use an operational admin layout, not a landing page.

Header:

```text
breadcrumb: Administration / Master Authentication
title: Master Authentication
master filter dropdown
refresh icon button
```

Main content:

```text
Pending summary AG Grid
```

Summary grid actions:

```text
View
Mapping
```

Detail dialog:

```text
AG Grid of returned detail rows.
Approve checkbox column.
Reject checkbox column.
Approve/Reject all checkboxes are displayed in the AG Grid floating filter row under the Approve and Reject headers.
Bulk approve/reject checkboxes must be centered and aligned with row-level checkboxes.
Approve/Reject all operate only on filtered rows.
Submit button sends selected decisions only.
Material confirmation dialog before submit.
```

Mapping dialog:

```text
Read-only AG Grid of RoleModuleMaster_IUDS SELECT result.
Show columns returned by API response.
Use check/close or checkbox display for MenuChecked.
No save from this dialog unless backend save flow is separately requested.
```

## Approval Rules

```text
Do not allow approve and reject on the same row.
Approve row unchecks reject.
Reject row unchecks approve.
Approve All checkbox is in the Approve column floating filter row and affects filtered detail rows only.
Reject All checkbox is in the Reject column floating filter row and affects filtered detail rows only.
If no decisions are selected, show visible validation message.
Show confirmation before submitting.
Refresh pending summary and selected details after successful submit.
Display DB/API message exactly where available.
Maker cannot approve/reject own record; show DB/API error/message.
Do not edit business data on Master Authentication.
```

## Data Mapping Rules

Because response column casing varies, use tolerant key mapping in API service only.

Summary likely keys:

```text
autoid / auto_id / AutoId / tbl_Auto_Id
mastername / MasterName / MASTER_NAME / Auth_MasterName
makerid / MakerId / UPDATED_BY / CREATED_BY
referenceNo / REF_NO / DISPLAYFIELD1
description / DISPLAYFIELD2 / ROLE_NAME / USER_NAME
action / ACTION / ACTIONREMARK
status / STATUS / DISPLAYSTATUS
count / COUNT
```

Detail likely keys from doc:

```text
autoid
rolecode
rolename
description
action
createdby
modifiedby
status
createddate
modifieddate
approveddate
actionremark
isactive
```

Role module mapping likely keys:

```text
MODULENAME
MainMenu
SubMenunumber
SubMenu
parent_Id
Caption
Url
menu_sequence
Menu_Id
MODULEID
m_menu_sequence
s_menu_sequence
MenuChecked
status
```

## Implementation Steps

1. Done: Create `common-approval.models.ts` with summary, detail, master option, decision, command result, and role module mapping models.
2. Done: Create `common-approval-api.service.ts`.
3. Done: Implement `loadMasters()` using `POST /api/CommonApproval/GetAllMasterForDDL`.
4. Done: Implement `loadPending()` using `POST /api/CommonApproval/GetAllUser` with `flag: S`.
5. Done: Implement `loadDetails()` using `POST /api/CommonApproval/GetData_CommonApproval`.
6. Done: Implement approve/reject decisions using `POST /api/CommonApproval/CommonApproval_AR`.
7. Done: Implement `loadRoleModuleMapping()` using `POST /api/RoleModuleMapping/RoleModuleMaster_IUDS` with `ProcessName: SELECT`.
8. Done: Create `common-approval.store.ts` and keep all server actions there.
9. Done: Create `common-approval.page.ts` with the pending summary grid.
10. Done: Create detail dialog with approve/reject checkboxes and filtered-row select-all behavior.
11. Done: Create mapping dialog with read-only grid.
12. Done: Add lazy route in `common-approval.routes.ts`.
13. Done: Add route entry in `app.routes.ts`.
14. Done: Update runtime menu route resolver for Master Authentication/Common Approval/Auth labels.
15. Done: Run `npm run build`.
16. Pending live check: Test in browser with live login/module/menu flow. 

## Verification Checklist

API verification:

```text
POST /api/CommonApproval/GetAllMasterForDDL returns master options.
POST /api/CommonApproval/GetAllUser with flag S and current user returns pending summary.
POST /api/CommonApproval/GetData_CommonApproval returns detail rows for selected summary.
POST /api/CommonApproval/CommonApproval_AR with qflag A returns DB success/error message.
POST /api/CommonApproval/CommonApproval_AR with qflag R returns DB success/error message.
POST /api/RoleModuleMapping/RoleModuleMaster_IUDS with ProcessName SELECT returns role menu mapping rows.
```

UI verification:

```text
Route opens from sidebar menu label Master Authentication/Common Approval.
Master dropdown is DB/API driven.
Summary grid renders only API response columns plus UI-owned actions.
View opens details and displays API response columns.
Mapping opens role menu mapping grid.
Approve/reject checkboxes are mutually exclusive.
Approve All / Reject All affect filtered detail rows only.
Submit with no decisions shows validation message.
Submit shows confirmation dialog.
Successful submit shows DB/API message and refreshes data.
Maker/checker validation messages from DB are displayed.
No component/dialog calls HttpClient or feature API service directly.
```

## Open Points To Validate With Live API

```text
Exact master option columns returned by GetAllMasterForDDL.
Whether summary rows return MasterName as "Role Master" or detail names such as "ROLE_MASTER_DETAILS".
Exact AutoId/tbl_Auto_Id field in summary rows.
Whether rejection requires a remark in the current DB contract.
Whether CommonApproval_AR supports bulk decisions or must be called once per selected row.
Exact display columns for User Master, Role Master, and Configuration Master detail rows.
```
