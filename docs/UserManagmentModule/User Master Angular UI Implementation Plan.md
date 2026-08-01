# User Master Angular UI Implementation Plan

## Purpose

Use this plan before implementing User Master in `HDFC.PDFCoordinateMapper.WebV1`.

This is Angular UI only. Do not change API, Oracle stored procedures, or DB tables during this phase unless the user separately approves backend changes.

Source contexts reviewed:

- `docs/basic-master-development-standard (1) 1.md`
- `docs/HDFC Angular Pagewise API DB Context.md`
- `docs/Angular UI Context.md`
- Current completed login/dashboard Angular V1 project structure

## Scope

Implement only User Master UI functionality in the new Angular V1 project.

Target project:

```text
HDFC.PDFCoordinateMapper.WebV1
```

Target route:

```text
/administration/users
```

Do not implement Role Master, Common Approval UI changes, PDF coordinate pages, upload, export, or other masters in this task.

## Current Backend Contract

| Function | API | HTTP | Stored Procedure | Notes |
| --- | --- | --- | --- | --- |
| User list | `/api/UserMaster/GetUserMaster` | GET | `USP_DDP_USERMASTER_IUDS` with flag `S` | Returns DataSet tables. |
| User create/update | `/api/UserMaster/SaveUserMaster` | POST | `USP_DDP_USERMASTER_IUDS` with request `flag` | Use `INSERT` for add and `UPDATE` for edit. |
| User delete/deactivate | `/api/UserMaster/Delete_UserMaster` | POST | `USP_DDP_USERMASTER_IUDS` with flag `D` | Approval-based delete/deactivate. |
| Dropdowns | `/api/UserMaster/GetAllRecordForDDL` | GET | `USP_DDP_USERMASTER_IUDS` with flag `DropDown` | Role dropdown comes from this endpoint. |
| Generic user operation | `/api/UserMaster/UserMaster_IUDS` | POST | `USP_DDP_USERMASTER_IUDS` with request `processName` | Not needed for first User Master list/add/edit/delete. |
| Unlock/dormant | `/api/UserMaster/UnlockUser` | POST | `USP_DDP_USERMASTER_IUDS` with request `processName` | Separate page, not part of User Master first pass. |

API response shape:

```text
Raw DataSet JSON:
{
  "Table": [],
  "Table1": [],
  "Table2": []
}
```

Current verified `GetUserMaster` mapping:

- `Table` contains all records for the All tab.
- `Table1` contains approved records for the Approved tab.
- These arrays are independent. Do not populate Approved by filtering `Table`.
- Generate grid data columns from actual response row fields per active tab.
- Do not show `moduleid`, `moduleaccessid`, or `password` as grid columns.

The Angular feature must reuse the V1 DataSet adapter:

```text
src/app/core/api/dataset.adapter.ts
```

## Important DB/API Rules

- User Master is maker/checker driven by Oracle.
- Maker create/update/delete must not be treated as final approved data in UI messaging.
- Role selection must use the role `AutoId` or DB group id from dropdown, because the user SP validates rights against the selected role id.
- Password is not part of this User Master UI. Current API sends blank password to the stored procedure because of legacy SP behavior.
- Add mode must send `flag = INSERT`.
- Edit mode must send `flag = UPDATE`.
- Delete/deactivate must send `flag = D`.
- Current user should be sent as `currrentUserId` from logged-in `userName` first, then `userId`.
- Do not hardcode role dropdown values.
- Do not use fallback/sample data.

## Basic Master Standard Fit

| Standard Requirement | User Master V1 Decision |
| --- | --- |
| Angular standalone route/component | Yes. |
| Feature service | Yes. |
| Feature store | Yes, signal-based local feature store. |
| All tab | Yes, backed by `/api/UserMaster/GetUserMaster`. |
| Approved tab | Yes, backed by `/api/UserMaster/GetUserMaster` `Table1`. Do not filter `Table` to build Approved rows. |
| Add/Edit/View form | Yes, Material dialog. |
| Delete | Yes, confirmation dialog then `Delete_UserMaster`. |
| Active flag | Yes, required. Values `Y` and `N`. |
| Common Approval | Backend-owned. UI should show maker/checker pending messages returned by API. Approval screen remains separate. |
| Grid search | Yes, AG Grid quick filter plus floating filters. |
| Bulk upload | Not in current User Master API contract. Do not implement in this pass. Add as future PBI only. |

## Required Angular Folder Structure

Create:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/administration/users/
  user-master.models.ts
  user-master-api.service.ts
  user-master.store.ts
  user-master.page.ts
  user-master-form.dialog.ts
  user-master.routes.ts
```

Update:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/app.routes.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/core/layout/application-shell.component.ts
```

Optional shared utilities if needed:

```text
src/app/shared/confirm-dialog/
src/app/shared/status/
```

Keep this first pass small. Do not create unnecessary child components.

## Angular Dependencies

Need AG Grid for User Master list:

```text
ag-grid-angular
ag-grid-community
```

Use Angular Material already installed in V1:

```text
MatTabsModule
MatDialogModule
MatFormFieldModule
MatInputModule
MatSelectModule
MatButtonModule
MatIconModule
MatTooltipModule
MatSnackBarModule
MatSlideToggleModule or MatSelect for Active
```

## Models

Create typed models that reflect the API contract and likely DataSet columns.

```ts
export interface UserMasterRecord {
  raw: Record<string, unknown>;
  autoId: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  email: string;
  departmentCode: string;
  departmentName: string;
  branchCode: string;
  branchName: string;
  active: string;
  dormant: string;
  loginStatus: string;
  status: string;
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
}

export interface UserMasterFormValue {
  userId: string;
  userName: string;
  roleId: string;
  email: string;
  departmentCode: string;
  departmentName: string;
  branchCode: string;
  branchName: string;
  active: string;
}
```

## Service Plan

Create `UserMasterApiService`.

Required methods:

```ts
loadUsers(): Observable<UserMasterRecord[]>
loadRoles(): Observable<UserRoleOption[]>
createUser(value: UserMasterFormValue, currentUserId: string): Observable<ActionResult>
updateUser(autoId: string, value: UserMasterFormValue, currentUserId: string): Observable<ActionResult>
deleteUser(record: UserMasterRecord, currentUserId: string): Observable<ActionResult>
```

Payload mapping for create:

```json
{
  "flag": "INSERT",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "user_Name": "<userName>",
  "email": "<email>",
  "groupId": "<roleId>",
  "group_Id": "<roleId>",
  "groupidcheck": "<roleId>",
  "departmentCode": "<departmentCode>",
  "departmentName": "<departmentName>",
  "branchCode": "<branchCode>",
  "branchName": "<branchName>",
  "active": "Y",
  "isactive": "Y",
  "currrentUserId": "<loggedInUser>"
}
```

Payload mapping for update:

```json
{
  "flag": "UPDATE",
  "auto_Id": "<autoId>",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "user_Name": "<userName>",
  "email": "<email>",
  "groupId": "<roleId>",
  "group_Id": "<roleId>",
  "groupidcheck": "<roleId>",
  "departmentCode": "<departmentCode>",
  "departmentName": "<departmentName>",
  "branchCode": "<branchCode>",
  "branchName": "<branchName>",
  "active": "Y",
  "isactive": "Y",
  "currrentUserId": "<loggedInUser>"
}
```

Payload mapping for delete:

```json
{
  "flag": "D",
  "auto_Id": "<autoId>",
  "user_Id": "<userId>",
  "userId": "<userId>",
  "currrentUserId": "<loggedInUser>"
}
```

Response handling:

- Extract DB success/error message from `message`, `Message`, `Msg`, `MSG`, or any message-like DataSet column.
- Throw error for HTTP failure or `success=false`.
- Return no fake rows.

## Store Plan

Create `UserMasterStore`.

State:

```ts
users: UserMasterRecord[]
roles: UserRoleOption[]
loading: boolean
rolesLoading: boolean
submitting: boolean
errorMessage: string
lastMessage: string
```

Computed:

```ts
allUsers
approvedUsers
```

Tab data mapping:

- All binds directly to `GetUserMaster` `Table`.
- Approved binds directly to `GetUserMaster` `Table1`.
- Do not derive Approved by filtering All.
- Do not add Deleted/Pending tabs until verified API result sets exist.

Methods:

```ts
loadUsers()
loadRoles()
createUser(formValue)
updateUser(record, formValue)
deleteUser(record)
clearMessages()
```

Store should read current user from `AuthStore`.

## UI Page Plan

`UserMasterPage` layout:

- Page header: breadcrumb, `Users` title, and label-sized `All` / `Approved` tabs immediately after the title
- Primary action: Add User
- Refresh icon action
- Single AG Grid below the header; tab selection changes active row array and generated columns

Grid columns:

```text
Actions
Generated response columns for the active tab
```

Action buttons:

- View icon
- Edit icon
- Delete icon

Use Material icon buttons with tooltips.

Grid behavior:

- AG Grid floating filters.
- AG Grid pagination.
- Horizontal scroll only inside grid if needed.
- No custom pagination footer.
- Empty state when no rows.
- Grid fills available page height; no normal outer page vertical scrollbar.
- Hide `moduleid`, `moduleaccessid`, and `password` response fields.

## Form Dialog Plan

`UserMasterFormDialog`.

Modes:

```text
add
edit
view
```

Fields:

| Field | Control | Validation | Source |
| --- | --- | --- | --- |
| User ID | Input | Required | User input/API row |
| User Name | Input | Required | User input/API row |
| Role | Select | Required | `GetAllRecordForDDL` |
| Email | Input | Required + email | User input/API row |
| Department Code | Input | Optional unless DB says required | User input/API row |
| Department Name | Input | Optional unless DB says required | User input/API row |
| Branch Code | Input | Optional unless DB says required | User input/API row |
| Branch Name | Input | Optional unless DB says required | User input/API row |
| Active | Select | Required | `Y` / `N` |

Dialog actions:

- Add mode: Submit button text `Submit for Approval`
- Edit mode: Submit button text `Submit Update for Approval`
- View mode: no submit button
- Close button

Rules:

- Disable submit while invalid/submitting.
- Patch form from selected grid row in edit/view.
- Do not include password field.
- Do not allow Add to send update flag.

## Routing Plan

Add lazy route:

```ts
{
  path: 'administration/users',
  loadChildren: () =>
    import('./features/administration/users/user-master.routes').then((m) => m.userMasterRoutes)
}
```

Add sidebar link in shell for this phase:

```text
User Master -> /administration/users
```

Later, replace static phase link with DB menu adapter once menu routing is finalized.

## Approval Flow Handling

User Master UI does not approve records directly.

Expected flow:

```text
Add/Edit/Delete from User Master
  -> API calls USP_DDP_USERMASTER_IUDS
  -> DB writes USER_MASTER_APPROVAL and DDP_COMMON_APPROVAL_MASTER
  -> User Master grid reloads
  -> Checker uses Common Approval page later
```

Show returned DB message clearly:

```text
Record submitted for approval.
Duplicate exists.
User cannot be created as no rights assigned to selected role.
Maker cannot approve own record.
```

Do not invent custom success text when DB/API returns a message.

## Search And Filtering

Required for this implementation:

- Grid quick search input.
- Floating filters on columns.
- Client-side filtering.

Do not implement API search parameters because current list API has no search contract.

## Bulk Upload

The attached basic master standard says bulk upload should restrict duplicate Excel records.

Decision for User Master V1:

- Not implemented in this phase.
- Current User Master API has no upload endpoint or Excel validation contract.
- Create a future PBI after API/DB contract is approved.

Future PBI summary:

```text
Add User Master bulk upload API and Angular upload UI.
Validate duplicate users within Excel before submit.
Validate duplicates against USER_MASTER and USER_MASTER_APPROVAL through Oracle.
Insert valid rows as pending maker records.
Return row-level validation messages.
```

## Validation Checklist Before Coding

Before implementation starts, verify:

- `HDFC.PDFCoordinateMapper.WebV1` still builds.
- API is running on `http://localhost:50971`.
- Login works with a real user.
- `GET /api/UserMaster/GetUserMaster` returns rows in Swagger/Postman.
- `GET /api/UserMaster/GetAllRecordForDDL` returns role rows with role `AutoId`.
- One valid role has menu rights assigned, otherwise user insert can fail.

## Implementation Steps After Approval

1. Install AG Grid packages in `HDFC.PDFCoordinateMapper.WebV1`.
2. Add User Master models.
3. Add User Master API service.
4. Add User Master signal store.
5. Add User Master lazy routes.
6. Add User Master page with tabs, AG Grid, quick search, and actions.
7. Add User Master Material form dialog.
8. Wire create/update/delete payloads exactly as documented.
9. Add sidebar link.
10. Run `npm run build`.
11. Start/verify UI route `/administration/users`.
12. Test list and dropdown API calls from UI.
13. Test add payload sends `INSERT`.
14. Test edit payload sends `UPDATE`.
15. Test delete payload sends `D`.

## Out Of Scope For This Approval

- Backend changes.
- Oracle stored procedure changes.
- Common Approval page changes.
- Bulk upload implementation.
- Role Master UI.
- Dynamic DB menu routing beyond adding a phase link.
- PDF coordinate mapper page.

## Approval Required

Implementation should start only after user approval of this plan.
