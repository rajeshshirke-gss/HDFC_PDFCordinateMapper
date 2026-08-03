# User Master Standalone Angular Final Implementation Context

## Purpose

This is the final pre-implementation context for building User Master in `HDFC.PDFCoordinateMapper.WebV1`.

It compares and merges:

- `docs/USER_MANAGEMENT_UI_ARCHITECTURE.md`
- `docs/User Master Angular UI Implementation Plan.md`
- `docs/basic-master-development-standard (1) 1.md`
- `docs/HDFC Angular Pagewise API DB Context.md`
- Current `HDFC.PDFCoordinateMapper.Api` controller, service, and request model contracts

Do not update the two reference documents. This file is the new implementation source for the User Master Angular standalone page.

## Decision Summary

The earlier User Master implementation plan had the correct API payload basics, but it missed several AngularJS-era interaction and UX patterns from `USER_MANAGEMENT_UI_ARCHITECTURE.md`.

The completed WebV1 User Master is now the reference pattern for future master screens. Preserve these patterns:

- User editor and user records must feel like one coordinated User Management workspace.
- Record tabs must be driven by the real API response. Current implemented tabs are All and Approved.
- Grid filters, search, page size, and selected tab should be stable during refresh.
- Edit must load the selected row into the form and keep User ID immutable.
- Add must clear form, default status to Active, and never send update payload.
- Save/update/delete must show confirmation dialogs.
- API/DataSet parsing must stay in adapter/service/store, not in components.
- API and DB remain source of truth for validation, duplicate rules, approval state, and permission enforcement.
- Header layout is compact: title first, label-sized tabs immediately after the title, header actions on the right.
- Grid columns are generated from the active tab response fields, with command columns owned by the UI.

## Scope

Implement only User Master Angular UI.

Target project:

```text
HDFC.PDFCoordinateMapper.WebV1
```

Target route:

```text
/administration/users
```

This phase includes:

- User Master route.
- User Master page.
- User Master feature API service.
- User Master feature store/facade.
- User Master models.
- User create/edit/view dialog or editor panel.
- User list grids/tabs.
- Role dropdown loading.
- Add/update/delete submit flow.
- Search/filter/pagination.
- HDFC-style operational layout.

This phase excludes:

- API changes.
- DB/SP changes.
- Bulk upload implementation.
- Common Approval page implementation.
- Role Master implementation.
- Role Menu Mapping implementation.
- PDF Coordinate Mapper implementation.

## Verified Current API Contract

Controller:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/UserMasterController.cs
```

Service:

```text
HDFC.PDFCoordinateMapper.Api/Services/UserMasterService.cs
```

Request DTO:

```text
HDFC.PDFCoordinateMapper.Api/Models/UserMasterModels.cs
```

Stored procedure:

```text
USP_DDP_USERMASTER_IUDS
```

API methods:

| User Flow | API | HTTP | Service Method | SP Flag/Process | Use In UI |
| --- | --- | --- | --- | --- | --- |
| List users | `/api/UserMaster/GetUserMaster` | GET | `GetUserMaster()` | `S` | Yes |
| List users compatibility | `/api/UserMaster/getuser` | GET/POST | `GetUserMaster()` | `S` | No, use canonical route |
| Role/dropdown data | `/api/UserMaster/GetAllRecordForDDL` | GET | `GetAllRecordForDdl()` | `DropDown` | Yes |
| Create/update user | `/api/UserMaster/SaveUserMaster` | POST | `SaveUserMaster(request)` | request `Flag` | Yes |
| Delete/deactivate user | `/api/UserMaster/Delete_UserMaster` | POST | `DeleteUserMaster(request)` | forced `D` | Yes |
| Generic operation | `/api/UserMaster/UserMaster_IUDS` | POST | `UserMasterIuds(request)` | request `ProcessName` | Not first pass |
| Unlock/dormant operation | `/api/UserMaster/UnlockUser` | POST | `UnlockUser(request)` | request `ProcessName` | Not User Master first pass |

API returns raw DataSet JSON:

```json
{
  "Table": [],
  "Table1": [],
  "Table2": []
}
```

For `GET /api/UserMaster/GetUserMaster`, the DataSet tables are independent:

- `Table` contains all user records for the All tab.
- `Table1` contains approved user records for the Approved tab.
- Do not derive the Approved tab by filtering `Table`.
- Generate grid data columns from the actual row keys returned for the active tab.
- Hide `moduleid`, `moduleaccessid`, and `password` from the grid even when present in the response.

The UI must reuse or extend:

```text
src/app/core/api/dataset.adapter.ts
```

## API Parameter Mapping

The API maps `UserMasterRequest` fields to Oracle parameters as follows:

| Angular/API Field | Oracle Parameter | Notes |
| --- | --- | --- |
| `auto_Id` / `Auto_Id` | `p_Auto_Id` | Numeric; update/delete needs this. |
| `userId` or `user_Id` | `p_User_Id` | Business user id. |
| `groupId` or `group_Id` | `p_Group_Id` | Selected role id/group id. |
| `user_Name` | `p_User_Name` | Display name. |
| API internal blank | `p_Password` | Password is intentionally blank in current API. |
| `email` or `emailID` | `p_Email` | Email. |
| `module_Id` | `p_Module_Id` | Usually optional for first pass. |
| `fstlogin` | `p_fstlogin` | Numeric optional. |
| `login_Status` | `p_Login_Status` | Numeric optional. |
| `loginSystem` | `p_Login_System` | Optional. |
| `nooflogintry` | `p_nooflogintry` | Numeric optional. |
| `status` | `p_Status` | Numeric optional. |
| `currrentUserId` or `initiatedBy` | `p_UserID` | Maker/current user. |
| `flag` | `p_Qflag` | `INSERT`, `UPDATE`, `S`, `D`, `DropDown`, etc. |
| `report_GroupId` | `p_ReportGroupId` | Optional. |
| `dept_Id` | `p_Dept_Id` | Optional legacy department id. |
| `rights` | `p_UserRights` | Optional. |
| `module_Access_Id` | `p_Module_Access_Id` | Optional. |
| `groupidcheck` | `p_groupidcheck` | Must match selected role id for insert/update rights check. |
| `active` or `isactive` | `p_isactive` | Save SP lifecycle code, not dropdown description or AUTOID. |
| `dormant` or `isUnterminate` | `p_isdormant` | Not for first add/edit UI unless row already contains it. |
| `departmentCode` | `p_DEPARTMENT_CODE` | Department code. |
| `departmentName` | `p_DEPARTMENT_NAME` | Department name. |
| `branchCode` | `p_BRANCH_CODE` | Branch code. |
| `branchName` | `P_BRANCH_NAME` | Branch name. |

Current API supports plain values and encrypted legacy values. Angular standalone V1 should send plain values and keep any encryption concern inside API/backend.

### Active Dropdown And Save Codes

`GET /api/UserMaster/GetAllRecordForDDL` can return Active/User status values in `Table1`:

```json
[
  { "AUTOID": 15.0, "DESCRIPTION": "Active" },
  { "AUTOID": 16.0, "DESCRIPTION": "InActive" },
  { "AUTOID": 17.0, "DESCRIPTION": "Dormant" },
  { "AUTOID": 20.0, "DESCRIPTION": "Unlock" },
  { "AUTOID": 21.0, "DESCRIPTION": "Revoke" }
]
```

The UI must display `DESCRIPTION`, but insert/update must send the SP code to `active` and `isactive` because the API maps those fields directly to `p_isactive`.

Verified SP display logic:

```sql
CASE
  WHEN uma.isactive = 'Y' THEN 'ACTIVE'
  WHEN uma.isactive = 'DR' THEN 'DORMANT'
  WHEN uma.isactive = 'D' THEN 'DELETE'
  WHEN uma.isactive = 'L' THEN 'LOCKED'
  WHEN uma.isactive = 'U' THEN 'UNLOCK'
  ELSE 'INACTIVE'
END AS isactive
```

Mapping rule:

```text
Active   -> Y
InActive -> N
Dormant  -> DR
Locked   -> L
Unlock   -> U
Revoke   -> D
Delete   -> D
```

Do not save the `AUTOID` values from `Table1` for `p_isactive`.

## AngularJS Reference Patterns To Preserve

The older AngularJS/MVC reference describes a richer User Management experience than the initial plan. These patterns must be included in the Angular standalone design.

### Workspace Pattern

Use a single User Management workspace:

```text
User Management
  Header
  Editor area or dialog
  Records tabs
  Grid actions
  Global feedback
```

For V1, use a Material dialog for add/edit/view to match the generic Angular standard. The page must still behave like a coordinated workspace: submit success refreshes the active grid and messages are shown on the page/snackbar.

### Header Pattern

Page header:

```text
Breadcrumb: Administration / User Management
Title row: Users + label-sized tabs immediately after title
Actions:
  Add user
  Refresh
```

Do not add Export in this phase because the current User Master API has no export endpoint.

### User Tabs Pattern

The AngularJS reference included:

```text
All records
Approved records
Deleted records
Pending approval
```

WebV1 currently implements tabs supported by actual API data:

| Tab | Data Source | Filtering Rule |
| --- | --- | --- |
| All | `GetUserMaster` `Table` | Bind directly to `Table`; it contains all records. |
| Approved | `GetUserMaster` `Table1` | Bind directly to `Table1`; it contains approved records and is independent from `Table`. |

Do not invent rows for any tab.
Do not add Deleted or Pending tabs until the API response contract for those views is verified.

Tab behavior:

- Preserve quick search when switching tabs.
- Preserve grid page size where possible.
- Refresh should reload API data and keep selected tab.

### Search And Filter Pattern

User table must support:

- Quick search across User ID, User Name, and Email.
- AG Grid floating filters.
- Role filter.
- Status/active filter.
- Branch/department filter when columns are present.
- Sorting by User ID, User Name, Status, Created Date, Modified Date.
- Page size options: `10`, `25`, `50`, `100`.

If using AG Grid client-side row model, filtering/sorting/pagination are UI-owned because the API exposes no server-side search contract.

### Form Pattern

Modes:

```text
create
edit
view
```

Add user:

- Opens empty form/dialog.
- Sets default `active = Y`.
- Focuses User ID.
- Submit sends `flag = INSERT`.

Edit user:

- Patches selected row into the form.
- Disables User ID.
- Submit sends `flag = UPDATE`.
- Show changed-fields confirmation when practical.

View user:

- Patches selected row into form.
- Disables all fields.
- No submit button.

Delete/deactivate:

- Trigger from grid row action.
- Confirm before submit.
- Submit calls `/api/UserMaster/Delete_UserMaster`.
- Do not physically remove row in UI until API confirms and grid reloads.

Unsaved form handling:

- If dialog/page has dirty changes and user cancels, ask for discard confirmation.
- Do not use browser `alert()`.

## Field Design

### Required Fields

V1 fields:

| Field | Required | Control | Notes |
| --- | --- | --- | --- |
| User ID | Yes | Input | Disabled in edit/view. |
| User Name | Yes | Input | Patch from `user_Name`, `UserName`, `USER_NAME`, etc. |
| Email | Yes | Input | Use Angular email validator plus optional HDFC domain validator. |
| Role | Yes | Searchable select or Material select | Value must be role `AutoId`/group id. |
| Branch Code | Yes in AngularJS reference | Input | Current API accepts it. |
| Branch Name | Yes in AngularJS reference | Input | Current API accepts it. |
| Department Code | Yes in AngularJS reference | Input | Current API accepts it. |
| Department Name | Yes in AngularJS reference | Input | Current API accepts it. |
| Active | Yes | Select | `Y` / `N`. New users default to `Y`. |

Do not include password.

Do not include dormant status in add form. Dormant/locked actions belong to separate flows unless row state requires read-only display.

### Email Rule

Reference architecture says legacy validation accepted these HDFC domains:

```text
hdfcbank.com
in.hdfcbank.com
hdfc.bank.in
```

Implementation rule:

- Add Angular email format validator.
- Add a small configurable allowed-domain validator in the feature form only if it does not block valid DB/API test users unexpectedly.
- API/DB remains authoritative.

### Status And Active Mapping

Transport values:

```text
Y = Active
N = Inactive
L = Locked
U = Unlocked
D = Delete/Delete pending
DR = Dormant
```

UI display must use status text and badge color, not color alone.

## Role Dropdown Rules

Role dropdown source:

```text
GET /api/UserMaster/GetAllRecordForDDL
```

Expected mapping:

```text
Role id: AutoId / AUTOID / AUTO_ID
Role name: RoleName / ROLENAME / ROLE_NAME
```

Critical insert rule:

- The selected role id must be sent as `groupId`, `group_Id`, and `groupidcheck`.
- If a role has no menu rights assigned, the backend can return: `User cannot be created as no rights assigned to selected role.`
- The UI should show that exact API/DB message.

No hardcoded roles.

## Models

Create:

```text
src/app/features/administration/users/user-master.models.ts
```

Required model shape:

```ts
export type UserMasterView = 'all' | 'approved' | 'deleted' | 'pending';

export interface UserMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  email: string;
  branchCode: string;
  branchName: string;
  departmentCode: string;
  departmentName: string;
  active: string;
  activeLabel: string;
  dormant: string;
  loginStatus: string;
  status: string;
  statusLabel: string;
  approvalState: string;
  actionRemark: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  approvedBy: string;
  approvedDate: string;
}

export interface UserRoleOption {
  id: string;
  name: string;
  raw: Record<string, unknown>;
}

export interface UserMasterFormValue {
  userId: string;
  userName: string;
  email: string;
  roleId: string;
  branchCode: string;
  branchName: string;
  departmentCode: string;
  departmentName: string;
  active: string;
}

export interface UserMasterCommandResult {
  success: boolean;
  message: string;
  raw: unknown;
}
```

## API Service Design

Create:

```text
src/app/features/administration/users/user-master-api.service.ts
```

Methods:

```ts
loadUsers(): Observable<UserMasterRecord[]>;
loadRoleOptions(): Observable<UserRoleOption[]>;
createUser(value: UserMasterFormValue, currentUser: string): Observable<UserMasterCommandResult>;
updateUser(record: UserMasterRecord, value: UserMasterFormValue, currentUser: string): Observable<UserMasterCommandResult>;
deleteUser(record: UserMasterRecord, currentUser: string): Observable<UserMasterCommandResult>;
```

Service responsibilities:

- Own all User Master URLs.
- Normalize form values by trimming strings.
- Build exact API payloads.
- Map DataSet rows to view models.
- Extract DB/API messages.
- Convert business failures in HTTP 200 responses into user-visible errors when message/status indicates failure.
- Never return sample data.

### Create Payload

```json
{
  "flag": "INSERT",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "user_Name": "<userName>",
  "email": "<email>",
  "emailID": "<email>",
  "groupId": "<roleId>",
  "group_Id": "<roleId>",
  "groupidcheck": "<roleId>",
  "departmentCode": "<departmentCode>",
  "departmentName": "<departmentName>",
  "branchCode": "<branchCode>",
  "branchName": "<branchName>",
  "active": "Y",
  "isactive": "Y",
  "currrentUserId": "<currentUser>"
}
```

### Update Payload

```json
{
  "flag": "UPDATE",
  "auto_Id": "<autoId>",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "user_Name": "<userName>",
  "email": "<email>",
  "emailID": "<email>",
  "groupId": "<roleId>",
  "group_Id": "<roleId>",
  "groupidcheck": "<roleId>",
  "departmentCode": "<departmentCode>",
  "departmentName": "<departmentName>",
  "branchCode": "<branchCode>",
  "branchName": "<branchName>",
  "active": "Y",
  "isactive": "Y",
  "currrentUserId": "<currentUser>"
}
```

### Delete Payload

```json
{
  "flag": "D",
  "auto_Id": "<autoId>",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "currrentUserId": "<currentUser>"
}
```

## Store / Facade Design

Create:

```text
src/app/features/administration/users/user-master.store.ts
```

Use signal-based store/facade style.

State:

```ts
interface UserMasterState {
  users: UserMasterRecord[];
  roles: UserRoleOption[];
  activeView: UserMasterView;
  quickSearch: string;
  loading: boolean;
  rolesLoading: boolean;
  submitting: boolean;
  errorMessage: string;
  lastMessage: string;
}
```

Computed:

```ts
allUsers
approvedUsers
deletedUsers
pendingUsers
activeRows
```

Methods:

```ts
loadUsers()
loadRoles()
setActiveView(view)
setQuickSearch(value)
createUser(value)
updateUser(record, value)
deleteUser(record)
clearMessages()
```

Store reads current user from `AuthStore`:

```text
current user = authStore.user()?.userName || authStore.user()?.userId
```

## Page Layout

Create:

```text
src/app/features/administration/users/user-master.page.ts
```

Layout:

```text
Page header
  Breadcrumb
  Title row: Users + All/Approved tabs
  Add User button
  Refresh icon button

AG Grid
  response-driven columns
  floating filters
  pagination
  row actions
```

Do not build a landing page.

Do not create cards around the whole page. Use unframed page layout and grid container.

## Grid Columns

Grid data columns are generated from the active response rows.

Current All response example fields include:

```text
autoid
userid
groupid
rolename
username
email
createdby
createddate
action
isactive
departmentcode
departmentname
branchcode
branchname
```

Never show these fields in the grid even when returned:

```text
password
moduleid
moduleaccessid
```

Action column:

- Stable width.
- Material icon buttons with tooltips:
  - View
  - Edit
  - Delete
- Disable edit/delete or show readonly messaging when approval state indicates pending change.

## Dialog / Form Design

Create:

```text
src/app/features/administration/users/user-master-form.dialog.ts
```

Dialog title:

| Mode | Title |
| --- | --- |
| Create | Create User |
| Edit | Edit User |
| View | View User |

Form layout:

```text
Identity
  User ID
  User Name
  Email

Organization
  Branch Code
  Branch Name
  Department Code
  Department Name

Access
  Role
  Active
```

Controls:

- Use Material form fields.
- Use `mat-select` for role and active.
- Role dropdown should be searchable if practical; if not, Material select is acceptable for first pass.
- No horizontal scroll.
- Submit button bottom right.

Validation:

| Field | Validation |
| --- | --- |
| User ID | Required, max 35. |
| User Name | Required, max 100 unless DB response proves a different limit. |
| Email | Required, email format, optional HDFC domain validation. |
| Role | Required. |
| Branch Code | Required. |
| Branch Name | Required. |
| Department Code | Required. |
| Department Name | Required. |
| Active | Required. |

Submit labels:

| Mode | Button |
| --- | --- |
| Create | Submit for Approval |
| Edit | Submit Update for Approval |
| View | No submit |

Confirm before submit:

- Create confirmation shows User ID, User Name, Role, Active.
- Update confirmation shows changed fields where practical.
- Delete confirmation shows User ID and User Name.

## Deleted And Pending Views

Deleted and Pending views are not part of the current verified WebV1 User Master UI.

Do not create Deleted or Pending tabs by guessing from status/action text. Add those tabs only after the API returns dedicated independent result sets or a verified backend process for those views.

## Runtime Navigation

For this phase, add a sidebar link:

```text
User Master -> /administration/users
```

Later, replace this with DB-driven menu route adapter when runtime menu mapping is complete.

Route:

```ts
{
  path: 'administration/users',
  loadChildren: () =>
    import('./features/administration/users/user-master.routes').then((m) => m.userMasterRoutes)
}
```

Feature route:

```ts
export const userMasterRoutes: Routes = [
  { path: '', component: UserMasterPage }
];
```

## Permissions

V1 can expose actions while API authorization is test-disabled, but code must be permission-ready.

Recommended permission ids:

```text
users.view
users.create
users.update
users.delete
```

Rules:

- UI permission checks are for usability only.
- API/DB remains authoritative.
- Do not infer permission only from role name.

## Error And Message Handling

Use a consistent snackbar and inline page message.

Messages must prefer API/DB text.

Handle:

- HTTP errors.
- DataSet business errors returned with HTTP 200.
- Empty list.
- Empty dropdown.
- User insert failure due selected role having no rights.
- Duplicate user/email messages.
- Pending approval messages.

No browser `alert()`.

## Accessibility

Required:

- Every icon button has tooltip and accessible label.
- Dialog traps focus and returns focus to trigger.
- Required fields have visible labels and errors.
- Status uses text plus color.
- Keyboard tab order works through toolbar, tabs, grid actions, and dialog fields.

## Responsive Rules

Desktop:

- Grid fills available content width.
- Dialog max width around `900px`.

Tablet/mobile:

- Dialog becomes near full width.
- Form fields stack.
- Grid horizontal scroll stays inside AG Grid only.
- Row actions remain reachable.

## Implementation Steps After Approval

1. Install AG Grid packages in `HDFC.PDFCoordinateMapper.WebV1`.
2. Create `features/administration/users` folder.
3. Add `user-master.models.ts`.
4. Add `user-master-api.service.ts`.
5. Add `user-master.store.ts`.
6. Add `user-master-form.dialog.ts`.
7. Add `user-master.page.ts`.
8. Add `user-master.routes.ts`.
9. Add lazy route to `app.routes.ts`.
10. Add User Master sidebar link.
11. Wire `GetUserMaster` list.
12. Wire `GetAllRecordForDDL` role dropdown.
13. Wire create with `flag=INSERT`.
14. Wire update with `flag=UPDATE`.
15. Wire delete with `flag=D`.
16. Add tab classification for All/Approved/Deleted/Pending.
17. Add quick search and AG Grid floating filters.
18. Add confirmation dialogs.
19. Run `npm run build`.
20. Test route `/administration/users`.
21. Test list and role dropdown API calls.
22. Test add payload in browser network tab.
23. Test edit payload in browser network tab.
24. Test delete payload in browser network tab.

## Future PBIs

### PBI - User Master Bulk Upload

Not part of this implementation because current API has no upload endpoint.

Future scope:

- Upload Excel.
- Validate duplicate rows inside Excel.
- Validate duplicates against `USER_MASTER` and `USER_MASTER_APPROVAL`.
- Return row-level validation messages.
- Insert valid rows as pending maker records.

### PBI - Deleted And Pending Records Backend Contract

Future backend option:

- Add dedicated deleted and pending result sets to `GET /api/UserMaster/GetUserMaster`, or
- Expose verified `UserMaster_IUDS` processes for those views.
- Bind tabs directly to those verified result sets; do not derive them by guessing from All rows.

### PBI - Searchable Branch/Department Lookups

AngularJS reference treats branch and department as required organization fields.

Current API accepts free text but no confirmed lookup endpoint exists.

Future backend option:

- Add branch dropdown/search endpoint.
- Add department dropdown/search endpoint.

## Final Rule

Start implementation only after user approves this final context.

During implementation, do not change backend or DB. Keep all User Master API quirks inside the Angular API service/adapter and keep the page component focused on UI state and user interaction.
