# HDFC Angular Pagewise API + DB Context

## Purpose

Use this document before creating the new Angular project for `HDFC.PDFCoordinateMapper`.

This pagewise context is based on:

- `docs/Angular UI Context.md`
- Current Web API source under `HDFC.PDFCoordinateMapper.Api`
- Existing API/DB verification docs in `docs/login-user-role-module-menu-traceability-matrix.md`
- Current Oracle stored-procedure usage from the API service layer

Do not start Angular implementation from screen appearance alone. Each page must be built from the API and DB contract below.

## Current Verification Notes

| Area | Status |
| --- | --- |
| API source | Verified from controllers, services, models, filters, and config. |
| API architecture | Classic ASP.NET Web API 2 on .NET Framework 4.7.2. |
| API DB gateway | `DbHelper` executes stored procedures only with `CommandType.StoredProcedure` and `BindByName=true`. |
| DB connection | Current SQLcl MCP session is closed with `ORA-17008`; this pass used API source plus existing DB verification docs. |
| Prior DB verification docs | Core user, role, menu, module, login, and approval procedures were verified as valid in existing docs. |
| Auth test mode | `EnableJwtAuthorization=false` in `Web.config`; UI must still support bearer token for non-test mode. |
| CORS | `AllowedCorsOrigins` contains `http://localhost:4200` and `http://127.0.0.1:4200`. |

Re-run DB verification when SQLcl is reconnected:

```sql
select object_name, object_type, status
from user_objects
where object_name in (
  'USP_ADMIN_LOGIN',
  'USP_USER_LOGOUT',
  'USP_GETALLMODULE_MASTER_ACCESS',
  'USP_GETMENU',
  'USP_DDP_USERMASTER_IUDS',
  'USP_DDP_ROLEMASTER_IUDS',
  'USP_COMMON_APPROVAL_IUDS',
  'USP_GET_COMMAPPROVALDATA_CCIL',
  'USP_CCIL_MODULEMASTER_IUDS',
  'USP_GETROLES',
  'USP_GETROLENAME'
)
order by object_name;
```

## Angular Project Rules

Follow `docs/Angular UI Context.md`.

Required Angular stack:

```text
Angular standalone components
Angular Material
AG Grid for all dense list screens
Reactive forms
Feature-based folders
Typed API services
Signal-based AuthStore or equivalent
HTTP interceptor for bearer token
Auth guard
Permission guard
Top snackbar notification service
Confirmation dialog service
HDFC-inspired internal banking theme
```

No fallback/sample rows are allowed. If API/DB returns no rows, show empty grid. If API/DB fails, show the DB/API error message and keep rows empty.

## WebV1 Master Screen Reference

The completed `HDFC.PDFCoordinateMapper.WebV1` User Master implementation is the approved reference structure for new masters.

Future master pages must follow this pattern unless the user explicitly overrides it:

```text
feature-name.models.ts
feature-name-api.service.ts
feature-name.store.ts
feature-name.page.ts
feature-name-form.dialog.ts
feature-name.routes.ts
```

Required behavior:

- Keep API/DataSet parsing in the feature API service/adapter, not in page components.
- Use a signal-based feature store for list snapshots, active view, loading, submitting, messages, and refresh flows.
- Use header layout with title first and label-sized tabs immediately after the title.
- Use AG Grid with floating filters and pagination.
- Let the grid fill available page height; avoid outer page vertical scrolling for normal list screens.
- Generate grid data columns from active response row fields when the API shape is table-driven.
- Keep UI command columns separate from response fields.
- Use Material icon buttons for row actions.
- Use Material dialogs for create/edit/view and confirmation dialogs before submit/delete.
- Show DB/API messages after commands and reload list data after successful commands.
- Hide backend-only or sensitive fields such as `password`, module/access mapping ids, and equivalent internal access fields.
- If a DataSet returns independent tables for different tabs, bind each tab directly to its table.

Recommended target folder:

```text
HDFC.PDFCoordinateMapper.Angular/
  src/app/
    core/
      api/
      auth/
      layout/
      menu/
      permissions/
    shared/
      grid/
      dialogs/
      notifications/
      status/
    features/
      auth/
      dashboard/
      administration/
        users/
        roles/
        role-menu-access/
        common-approval/
        locked-users/
        dormant-users/
      pdf-coordinate-mapper/
```

## API Response Handling

Two response styles exist:

1. Wrapped response:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

2. Raw DataSet response:

```json
{
  "Table": [],
  "Table1": [],
  "Table2": []
}
```

Angular must implement one reusable adapter:

```text
unwrapApiResponse(response)
dataSetRows(response, tableIndex = 0)
pickString(row, candidateKeys)
pickNumber(row, candidateKeys)
extractDbMessage(response)
```

Do not parse DataSet response inside page components. Components should receive typed models only.

## Menu And Navigation Contract

Menu data is DB-owned.

| Operation | API | SP | Request | Notes |
| --- | --- | --- | --- | --- |
| Load module access | `POST /api/welcome/GetData` | `usp_getAllModule_Master_access` | `{ "UserId": "..." }` | Use after login/page load to display authorized modules. |
| Load menu | `POST /api/Menu/getmenu` | `usp_getmenu` | `{ "roleid": "...", "Moduleid": "..." }` | Call only after the user selects an authorized module. API decrypts legacy values before Oracle call. |

Known DB tables from prior verification:

```text
MST_MODULE_MASTER_ACCESS
MENU_ACCESS
MENU_MASTER
ROLE_MODULEMAPPING
USER_MASTER
ROLE_MASTER
```

Expected menu fields may include:

```text
id
MENU_ID
menU_ID
HAS_CHILD
haS_CHILD
PARENT_ID
parenT_ID
value
caption
MODULEID
moduleid
URL
url
ICON
icon
MENU_SEQUENCE
menU_SEQUENCE
HAS_CHILD
RIGHTS
rights
ACTIONNAME
actionname
CONTROLLERNAME
controllername
submenunumber
description
hide
```

Angular rules:

- Sidebar menu must come from API/DB response, not hardcoded role checks.
- Parent/child order must use DB ordering where present.
- Icon should use DB icon metadata where present; fallback only to a neutral icon if DB icon is blank.
- Route mapping can be maintained in Angular as a UI adapter when DB returns legacy URLs/forms.
- Permission guard must use menu/action metadata, not local hardcoded roles.

Recommended route mapping adapter:

| DB/Legacy Intent | Angular Route |
| --- | --- |
| Dashboard / Welcome | `/dashboard` |
| User Master | `/administration/users` |
| Role Master | `/administration/roles` |
| Module/Menu Access | `/administration/role-menu-access` |
| Common Approval | `/administration/common-approval` |
| Locked User | `/administration/locked-users` |
| Dormant User | `/administration/dormant-users` |
| PDF Coordinate Mapper | `/pdf-coordinate-mapper` |

## Page 1 - Login

| Item | Contract |
| --- | --- |
| Route | `/login` |
| API | `POST /api/auth/login` |
| Controller | `AuthController.Login` |
| Service | `AuthService.ValidateCredentials` |
| SP | `USP_ADMIN_LOGIN` |
| Tables | `USER_MASTER`, `ROLE_MASTER`, `USER_LOG`, `USER_SESSION`, `USER_MASTER_APPROVAL`, `DDP_CONFIGURATION_MASTER` |
| Auth | `AllowAnonymous` |

Request:

```json
{
  "userName": "Super Admin",
  "userId": "Super Admin",
  "user_Id": "Super Admin",
  "password": "password",
  "flag": "LOGIN"
}
```

API normalizes `UserName` from `UserId` or `User_Id` when blank. API adds `GUID` and `SystemIP`.

UI fields:

- User ID / User Name
- Password
- Optional application/module selection only if returned by DB context; do not hardcode.

UI behavior:

- Submit with `flag='LOGIN'`.
- On success, store token, expiry, user identity, roles, raw login DataSet, module/menu bootstrap fields.
- Then call module access API (`POST /api/welcome/GetData`) and display authorized modules as selectable cards.
- Do not call menu API during login. Call `POST /api/Menu/getmenu` only after the user selects a module.
- On failure, show API/DB message.
- Never store password.
- Do not implement OTP/change-password unless API endpoints are added.

## Page 2 - Application Shell And Dashboard

| Item | Contract |
| --- | --- |
| Route | `/dashboard` |
| API | `GET /api/auth/me`, `POST /api/welcome/GetData`, `POST /api/Menu/getmenu` |
| SPs | `USP_GETALLMODULE_MASTER_ACCESS`, `USP_GETMENU` |

Shell layout:

- HDFC blue top bar.
- User name/profile/logout on right.
- Do not display the left sidebar before module selection.
- After module selection, display the left sidebar from DB menu for the selected module.
- Sidebar collapse/expand must be controlled from the top navbar hamburger icon, not a chevron button inside the sidebar.
- After `getmenu` returns, navigate to the first returned menu route that matches an implemented Angular route.
- Main content routed area.
- Top snackbar below nav.

Dashboard behavior:

- Show authorized modules as cards immediately after successful login.
- Selecting a module calls `POST /api/Menu/getmenu`.
- No marketing hero page.
- No fake summary cards unless API provides counts.

Logout:

| API | SP |
| --- | --- |
| `POST /api/auth/logout` | `USP_USER_LOGOUT` |

When auth is disabled and no user exists, API returns a test-mode logout message. UI should clear local session in both cases.

## Page 3 - User Master

| Item | Contract |
| --- | --- |
| Route | `/administration/users` |
| List API | `GET /api/UserMaster/GetUserMaster` |
| Save API | `POST /api/UserMaster/SaveUserMaster` |
| Delete API | `POST /api/UserMaster/Delete_UserMaster` |
| Dropdown API | `GET /api/UserMaster/GetAllRecordForDDL` |
| Generic API | `POST /api/UserMaster/UserMaster_IUDS` |
| SP | `USP_DDP_USERMASTER_IUDS` |
| Cursors | `cur`, `cur1`, `cur2` |
| Tables | `USER_MASTER`, `USER_MASTER_APPROVAL`, `USER_MASTER_LOG`, `DDP_COMMON_APPROVAL_MASTER` |

List behavior:

- AG Grid with floating filters and pagination.
- Use only business fields needed by user admin.
- Client owns pagination/filtering/sorting unless API adds server-side support.
- `GET /api/UserMaster/GetUserMaster` returns a DataSet with independent arrays:
  `Table` contains all user records and `Table1` contains approved user records.
- The All tab must bind to `Table`. The Approved tab must bind directly to `Table1`.
- Do not derive the Approved tab by filtering `Table`; the two result sets are independent.
- User Master grid data columns must be generated from the actual response fields for the active tab.
- Hide response fields `moduleid`, `moduleaccessid`, and `password` from the grid.

Recommended grid columns:

```text
User ID
User Name
Role
Email
Department Code
Department Name
Branch Code
Branch Name
Active
Dormant
Login Status
Status
Created By
Created Date
Modified By
Modified Date
Actions
```

Form fields:

```text
User ID
User Name
Role dropdown
Email
Department Code
Department Name
Branch Code
Branch Name
Active
```

Dropdowns:

- Role dropdown must come from `GET /api/UserMaster/GetAllRecordForDDL`.
- User Master Active dropdown values can come from `GetAllRecordForDDL` `Table1`; display `DESCRIPTION`, but save SP codes to `active/isactive`: Active `Y`, InActive `N`, Dormant `DR`, Locked `L`, Unlock `U`, Revoke/Delete `D`.
- Role selected value must be role `AutoId`/group id because user SP checks rights through selected role id.

Create payload:

```json
{
  "flag": "INSERT",
  "user_Id": "user1",
  "userId": "user1",
  "user_Name": "User One",
  "email": "user1@hdfc.com",
  "groupId": "1",
  "group_Id": "1",
  "groupidcheck": "1",
  "departmentCode": "D01",
  "departmentName": "Operations",
  "branchCode": "B01",
  "branchName": "Mumbai",
  "active": "Y",
  "currrentUserId": "Super Admin"
}
```

Update payload:

```json
{
  "flag": "UPDATE",
  "auto_Id": "123",
  "user_Id": "user1",
  "userId": "user1",
  "user_Name": "User One Updated",
  "groupId": "1",
  "group_Id": "1",
  "groupidcheck": "1",
  "active": "Y",
  "currrentUserId": "Super Admin"
}
```

Delete/deactivate payload:

```json
{
  "auto_Id": "123",
  "user_Id": "user1",
  "flag": "D",
  "currrentUserId": "Super Admin"
}
```

Rules:

- Create must send `INSERT`; update must send `UPDATE`.
- Do not send update flag for Add New.
- Password is not managed by the UI here; API sends blank password due legacy SP behavior.
- Maker/checker approval is DB-driven through approval tables and common approval.
- Show DB messages from returned DataSet.

## Page 4 - Role Master

| Item | Contract |
| --- | --- |
| Route | `/administration/roles` |
| List API | `GET /api/RoleMaster/GetRoleMaster` |
| Save API | `POST /api/RoleMaster/SaveRoleMaster` |
| Delete API | `POST /api/RoleMaster/Delete_RoleMaster` |
| Roles API | `GET /api/RoleMaster/GetRoles` |
| Role-by-user API | `POST /api/RoleMaster/GetRoleName` |
| SP | `USP_DDP_ROLEMASTER_IUDS` |
| Tables | `ROLE_MASTER`, `ROLE_MASTER_APPROVAL`, `ROLE_MASTER_LOG`, `ROLE_MODULEMAPPING`, `DDP_COMMON_APPROVAL_MASTER` |

List uses flag `SELECT`.

Recommended grid columns:

```text
Role Code
Role Name
Description
Active
Menu Access
Status
Created By
Created Date
Modified By
Modified Date
Actions
```

Form fields:

```text
Role Code
Role Name
Description
Active
Menu Access
```

Create payload:

```json
{
  "flag": "INSERT",
  "role_Code": "ADMIN_MAKER",
  "role_Name": "Admin Maker",
  "description": "Can create admin records",
  "active": "Y",
  "menuAccess": "1,2,3",
  "user_Id": "Super Admin"
}
```

Update payload:

```json
{
  "flag": "UPDATE",
  "auto_Id": "10",
  "role_Code": "ADMIN_MAKER",
  "role_Name": "Admin Maker",
  "description": "Updated description",
  "active": "Y",
  "menuAccess": "1,2,3,4",
  "user_Id": "Super Admin"
}
```

Delete/deactivate payload:

```json
{
  "flag": "DELETE",
  "auto_Id": "10",
  "user_Id": "Super Admin"
}
```

Rules:

- `menuAccess` is a legacy comma-delimited string expected by the role SP.
- UI can display a role form and separate menu access selector.
- Role insert/update/delete is maker/checker through common approval.
- Do not hardcode menu ids; load from module/menu APIs.

## Page 5 - Role Menu Access / Module Master

| Item | Contract |
| --- | --- |
| Route | `/administration/role-menu-access` |
| Module API | `POST /api/RoleMaster/ModuleMaster_IUDS` |
| Menu API | `POST /api/Menu/getmenu` |
| Save path | `POST /api/RoleMaster/SaveRoleMaster` with `menuAccess` |
| SPs | `USP_CCIL_MODULEMASTER_IUDS`, `USP_GETMENU`, `USP_DDP_ROLEMASTER_IUDS` |

Module request:

```json
{
  "processName": "SELECT",
  "userId": "Super Admin",
  "autoId": ""
}
```

Menu request:

```json
{
  "roleid": "1",
  "Moduleid": "1"
}
```

UI behavior:

- Select role from DB/API role list.
- Select module from DB/API module list.
- Load menu tree from `getmenu`.
- Show menu/action tree with checkboxes.
- Save selected menu ids as comma-delimited `menuAccess` through role save/update contract.

Rules:

- Do not invent module/menu values.
- Do not save permissions directly to DB from UI.
- If menu API returns encrypted/legacy fields, map them in service adapter.
- Approval for menu access changes follows role/common approval path.

## Page 6 - Common Approval

| Item | Contract |
| --- | --- |
| Route | `/administration/common-approval` |
| Summary API | `POST /api/CommonApproval/GetAllUser` |
| Master dropdown API | `POST /api/CommonApproval/GetAllMasterForDDL` |
| Detail API | `POST /api/CommonApproval/GetData_CommonApproval` |
| Approve/reject API | `POST /api/CommonApproval/CommonApproval_AR` |
| Summary/action SP | `USP_COMMON_APPROVAL_IUDS` |
| Detail SP | `USP_GET_COMMAPPROVALDATA_CCIL` |
| Tables | `DDP_COMMON_APPROVAL_MASTER`, `DDP_COMMON_APPROVAL_MASTER_LOG`, user/role/config approval tables |

Summary request must match the manually verified SP call:

```json
{
  "flag": "S",
  "user_Id": "Super Admin",
  "User_Id": "Super Admin",
  "userId": "Super Admin",
  "currrentUserId": "Super Admin"
}
```

This maps to:

```text
P_QFLAG = S
P_USERID = Super Admin
```

Detail request:

```json
{
  "Auth_MasterName": "Role Master",
  "Auth_UpdatedBy": "",
  "Auth_CurrUser": "Super Admin",
  "Auth_AutoId": ""
}
```

Supported master names from detail SP source:

```text
Role Master
ROLE_MASTER_DETAILS
User Master
USER_MASTER_DETAILS
Configuration Master
CONFIGURATION_MASTER_DETAILS
```

Approve payload:

```json
{
  "qflag": "A",
  "auto_Id": "704",
  "tbl_Auto_Id": "704",
  "masterName": "Role Master",
  "action": "A",
  "userID": "Super Admin"
}
```

Reject payload:

```json
{
  "qflag": "R",
  "auto_Id": "704",
  "tbl_Auto_Id": "704",
  "masterName": "Role Master",
  "action": "R",
  "userID": "Super Admin"
}
```

UI layout:

- Top grid: pending master summary.
- Row action: load details.
- Detail grid: approval rows for selected master.
- Approval controls: row-level approve/reject checkboxes or icon actions.
- Use Material confirmation dialog before submit.

Rules:

- Maker cannot approve/reject own record; DB enforces this. UI should show the DB message.
- Do not edit rows on approval page.
- Refresh summary and details after approval/rejection.
- Do not call inline SQL or any non-SP backend path.

## Page 7 - Locked Users

| Item | Contract |
| --- | --- |
| Route | `/administration/locked-users` |
| API | `POST /api/UserMaster/UnlockUser` |
| SP | `USP_DDP_USERMASTER_IUDS` |

List locked users if a process name is available:

```json
{
  "processName": "S_UNLOCK"
}
```

Unlock request:

```json
{
  "processName": "Unlock_A",
  "user_Id": "user1",
  "userId": "user1",
  "currrentUserId": "Super Admin"
}
```

UI behavior:

- If list returns rows, show AG Grid with User ID, User Name, Login Status, Attempts, Locked status, action.
- If list process returns no rows/unsupported, show manual User ID unlock form.
- Confirm before unlock.
- Show DB/API message.

## Page 8 - Dormant Users

| Item | Contract |
| --- | --- |
| Route | `/administration/dormant-users` |
| API | `POST /api/UserMaster/UnlockUser` |
| SP | `USP_DDP_USERMASTER_IUDS` |

List dormant users if a process name is available:

```json
{
  "processName": "S_ISDORMANT"
}
```

Activate/un-dormant request:

```json
{
  "processName": "Unlock_IsDomant",
  "user_Id": "user1",
  "userId": "user1",
  "currrentUserId": "Super Admin"
}
```

UI behavior:

- AG Grid when list data exists.
- Manual user id action fallback only as a real API submit, never sample data.
- Confirm before submit.
- Show DB/API message.

## Page 9 - PDF Coordinate Mapper

| Item | Contract |
| --- | --- |
| Route | `/pdf-coordinate-mapper` |
| List API | `GET /api/pdf-coordinates?templateName=...` |
| Save API | `POST /api/pdf-coordinates` |
| CSV Export | `GET /api/pdf-coordinates/export/csv?templateName=...` |
| Excel Export | `GET /api/pdf-coordinates/export/excel?templateName=...` |
| SP Get | `PKG_PDF_COORDINATE.SP_GET_COORDINATES` from `Web.config` |
| SP Save | `PKG_PDF_COORDINATE.SP_SAVE_COORDINATE` from `Web.config` |

List request:

```text
templateName is required.
```

Save payload:

```json
{
  "id": 0,
  "fieldName": "CustomerName",
  "x": 120.5,
  "y": 310.75,
  "pageNumber": 1,
  "templateName": "HDFC_FORM_A"
}
```

Validation:

- `fieldName` required, max 200.
- `templateName` required, max 200.
- `x` and `y` must be `>= 0`.
- `pageNumber` must be `>= 1`.

UI behavior:

- Template name input/search.
- Load coordinates grid.
- Add/edit coordinate dialog.
- Export CSV and Excel actions.
- Optional PDF preview only if file source/API is confirmed later.

Grid columns:

```text
Field Name
X
Y
Page Number
Template Name
Actions
```

## Cross-Cutting Angular Services

### ApiClientService

Responsibilities:

- Base URL configuration.
- JSON headers.
- Error normalization.
- DataSet unwrap helpers.
- File download helpers for CSV/Excel.

### AuthStore

State:

```text
token
expiresAt
userName
userId
roles
selectedRoleId
selectedModuleId
modules
menuTree
permissions
```

Rules:

- Store token/session only.
- Do not store password.
- Persist only what is needed for refresh.

### NotificationService

Rules:

- Top snackbar below navbar.
- Success and failure messages must come from API/DB when available.
- Auto-hide after 5 seconds.
- Manual close allowed.

### ConfirmationDialogService

Use for:

- Delete/deactivate.
- Unlock/dormant activation.
- Approval/rejection.
- Logout if product owner wants confirmation.

## Implementation Readiness Checklist

Before creating the Angular project:

- Confirm target folder name.
- Confirm whether to replace current `HDFC.PDFCoordinateMapper.Web` or create a new clean folder.
- Confirm DB connection is available if live payload verification is required.
- Confirm initial login test credential.
- Confirm whether `Super Admin` should be treated as `userName` or `userId` in UI state.

Before implementing each page:

- Read this page section.
- Read the controller/service/model for that page.
- Capture one real API response from Swagger/Postman where possible.
- Define typed models before UI.
- Build service adapter before component.
- Use AG Grid for list pages.
- Use Material dialogs for add/edit.
- Run `ng build` after implementation.

## WebV1 Role Master Contract

Status: verified from `RoleMasterController`, `RoleMasterService`, and `RoleMasterModels`.

Angular route:

```text
/administration/roles
```

API endpoints:

```text
GET  /api/RoleMaster/GetRoleMaster
POST /api/RoleMaster/SaveRoleMaster
POST /api/RoleMaster/Delete_RoleMaster
GET  /api/RoleMaster/GetRoles
```

List behavior:

```text
GetRoleMaster uses USP_DDP_ROLEMASTER_IUDS with p_PROCESS_NAME = SELECT.
DataSet Table is the all/pending list.
DataSet Table1 is the approved list.
The two tables are independent and must not be filtered from each other in Angular.
```

Save/delete SP:

```text
USP_DDP_ROLEMASTER_IUDS
p_PROCESS_NAME  <- Flag
p_AUTO_ID       <- Auto_Id
p_ROLECODE      <- Role_Code
p_ROLENAME      <- Role_Name
p_ROLEDESC      <- Description
p_CURR_USER     <- User_Id
p_groupidcheck  <- groupidcheck
p_isactive      <- Active
p_MenuAccess    <- MenuAccess
cur
cur1
```

Implementation rules:

```text
Follow User Master feature structure and header/grid/dialog behavior.
Generate grid columns from returned response fields.
Use Material icon action buttons for view/edit/delete.
Use DB/API messages from response cursors/envelope.
Do not hardcode fallback role rows.
Role Master add/edit menu picker must load menu rows through POST /api/RoleModuleMapping/RoleModuleMaster_IUDS with ProcessName SELECT.
The menu picker must follow Component/Dialog -> NgRx Signal Store -> Feature API Service -> backend.
```

## WebV1 Module Master / Role Menu Access Contract

Status: verified from `RoleMasterController`, `RoleMasterService`, `RoleMasterModels`, `MenuService`, and `MenuModels`.

Angular route:

```text
/administration/role-menu-access
```

API endpoints:

```text
POST /api/RoleMaster/ModuleMaster_IUDS
GET  /api/RoleMaster/GetRoles
POST /api/Menu/getmenu
```

Module list SP:

```text
USP_CCIL_ModuleMaster_IUDS
p_ProcessName <- ProcessName
p_UserId      <- UserId
p_AutoId      <- AutoId
cur
```

Current WebV1 list payload:

```json
{
  "ProcessName": "SELECT",
  "UserId": "<logged-in user>",
  "AutoId": ""
}
```

Role dropdown SP:

```text
usp_GetRoles
cur
```

Menu load SP:

```text
usp_getmenu
p_Roleid  <- roleid
p_Moduleid <- Moduleid
cur
```

Menu request:

```json
{
  "roleid": "<selected role id>",
  "Moduleid": "<selected module id>"
}
```

Implementation rules:

```text
Module grid columns are generated from the ModuleMaster_IUDS response fields.
Selecting a module calls POST /api/Menu/getmenu for selected role and module.
Menu rows must support DB fields such as menU_ID, parenT_ID, caption/value, url, menU_SEQUENCE, hide, icon, actionname, controllername, moduleid.
FontAwesome menu icon classes from DB must be rendered as FontAwesome, not Material icons.
Route matching recognizes /dashboard, /administration/users, /administration/roles, and /administration/role-menu-access.
Do not implement save/update for module/menu access until the save SP payload is verified.
```

## API Role Module Mapping Contract

Status: verified from `RoleModuleMAppingall.txt` and implemented in the current API style.

API route:

```text
POST /api/RoleModuleMapping/RoleModuleMaster_IUDS
POST /api/RoleModuleMapping/rolemodulemaster_iuds
```

Controller/service/model files:

```text
Controllers/RoleModuleMappingController.cs
Services/RoleModuleMappingService.cs
Models/RoleModuleMappingModels.cs
```

Request model:

```text
ProcessName
UserId
AutoId
RoleId
RoleName
MenuAccess
Groupid
GroupId
CreatedDate
ApprovedBy
ApprovedDate
```

Stored procedure:

```text
USP_CCIL_ROLEMODMAPPING_IUDS
p_ProcessName    <- ProcessName
p_RoleId         <- RoleId
p_RoleName       <- RoleName
p_MenuAccess     <- MenuAccess
p_Group_Id       <- Groupid / GroupId
p_UserId         <- UserId
p_CreatedDate    <- null timestamp
p_ApproveUserId  <- ApprovedBy
p_ApprovedDate   <- null timestamp
p_AutoId         <- AutoId
cur
cur1
cur2
```

Known `ProcessName` values from SP:

```text
INSERT
SELECT
APPROVAL_GRID
UPDATE
SELECTA
SELECTP
```

Rules:

```text
The API service must use IDbHelper and OracleParameter like the other controllers.
Register the service in UnityConfig.
Include controller/model/service files in HDFC.PDFCoordinateMapper.Api.csproj.
Return Ok(DataSet), not serialized JSON strings.
Do not swallow Oracle or mapping exceptions; controller returns InternalServerError.
Angular usage must follow Component/Dialog -> NgRx Signal Store -> Feature API Service -> backend.
```
