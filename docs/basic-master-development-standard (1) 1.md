# Basic Master Development Standard

## Purpose

Use this standard when creating or changing any basic master in an application built with Angular, ASP.NET API, and Oracle DB.

This document is generic and reusable. It is not tied to any one module, business domain, or master name. Apply it for masters such as configuration master, category master, type master, branch master, document type master, status master, profile master, lookup master, or any similar business master.

The goal is to keep every master consistent across UI, API, database, approval, audit, validation, and testing.

\---

## 1\. Mandatory Architecture Flow

Every master must follow the existing application architecture.

```text
Angular standalone route/component
  -> Angular feature component
  -> Angular feature store
  -> Angular feature service
  -> ASP.NET API controller
  -> API request DTO/model
  -> Existing database procedure helper
  -> Oracle stored procedure
  -> Oracle approved table / app table / log table
  -> Common Approval checker workflow
```

Do not introduce a new architecture unless the project owner explicitly approves it.

Do not add:

```text
1. CQRS
2. MediatR
3. New ORM pattern
4. New repository abstraction when the application already uses procedure helper calls
5. Direct database calls from Angular
6. Direct Oracle calls from controller bypassing the existing procedure helper
7. New response format incompatible with existing application API response handling
```

\---

## 2\. Master Classification

Use this standard for a basic master when it has:

```text
1. Add / edit / delete / view flow
2. Two list tabs: All and Approved
3. One grid under All tab
4. One grid under Approved tab
5. One detail form or dialog
6. Mandatory Active / Inactive flag
7. Mandatory Common Approval maker/checker flow
8. Standard audit columns
9. Duplicate validation
10. Oracle approved / app / log table pattern
```

A master becomes complex when it has one or more of:

```text
1. Child/detail rows
2. Upload/download handling
3. Preview screen
4. Dynamic sections
5. Multiple dependent dropdowns
6. External integration
7. Heavy workflow-specific processing
8. Separate helper procedures for approval details or approve/reject action
```

Even if a master becomes complex, it should still follow the same base rules unless a project-specific standard says otherwise.

\---

## 3\. Angular Folder Structure

Create the feature under the project Angular source path:

```text
<project-name>/src/app/pages/<master-name>/
```

Required files:

```text
<master-name>.routes.ts
<master-name>.component.ts
<master-name>.service.ts
<master-name>.store.ts
<master-name>.ts

<master-name>-list/
  <master-name>-list.component.ts

<master-name>-details/
  <master-name>-details.component.ts
```

Add child components only when the master actually needs them:

```text
<master-name>-preview/
<master-name>-upload/
<master-name>-child-grid/
<master-name>-history/
```

Do not create unnecessary components.

\---

## 4\. Angular Routing Standard

Use standalone feature routes.

```ts
export const masterRoutes: Routes = \[
  {
    path: '',
    loadComponent: () =>
      import('./<master-name>.component').then((m) => m.<MasterName>Component),
    children: \[
      { path: '', pathMatch: 'full', redirectTo: 'list' },
      { path: 'list', component: <MasterName>ListComponent },
    ],
  },
];
```

Add the feature route under the existing layout children in `app.routes.ts`:

```ts
{
  path: '<Master Menu Name>',
  loadChildren: () =>
    import('./pages/<master-name>/<master-name>.routes').then(
      (m) => m.<masterName>Routes
    ),
}
```

Route names should match the application menu naming convention.

\---

## 5\. Angular Shell Component

The shell component should contain only `RouterOutlet`.

```ts
@Component({
  selector: 'app-<master-name>',
  standalone: true,
  imports: \[RouterOutlet],
  providers: \[<MasterName>Store, <MasterName>Service],
  template: `<router-outlet />`,
})
export class <MasterName>Component {}
```

Provide the feature store and feature service at shell level.

\---

## 6\. Mandatory List UI Standard

Every master list screen must have two tabs:

```text
1. All
2. Approved
```

Each tab must have its own grid.

```text
All tab
  -> shows pending, rejected, delete-pending, update-pending, and other maker/checker workflow records returned by SELECT.

Approved tab
  -> shows only approved active/inactive records returned by APPROVED\_RECORDS.
```

Recommended grid library:

```text
Use the existing application grid library.
Do not introduce a new grid library only for one master.
```

Required columns in both grids:

```text
Action
Business key columns
Business display columns
Active
Status
Created By
Created Date
Modified By
Modified Date
Approved By
Approved Date
Remark
Action Remark
```

Action buttons should follow existing application UI pattern:

```text
View
Edit
Delete
Export, only when existing application pattern supports it
```

Rules:

```text
1. Add button should be available from the list screen.
2. Edit should create an update-pending request, not directly update the approved row.
3. Delete should create a delete-pending request, not directly remove the approved row.
4. View mode should be read-only.
5. Approved tab should show approved records only.
6. All tab should show records based on maker/checker workflow status.
```

\---

## 7\. Angular Detail Form Standard

Use a detail dialog or detail page based on existing application style.

Use Reactive Forms.

The detail form must support:

```text
Add mode
Edit mode
View mode
Delete confirmation from list
```

Form mode behavior:

```text
Add mode:
  Empty form.
  Submit uses INSERT.

Edit mode:
  Patch selected row or get-by-id data.
  Submit uses UPDATE.

View mode:
  Patch selected row or get-by-id data.
  Disable all controls.
  Hide submit button.

Delete:
  Trigger from grid action.
  Show confirmation.
  Submit uses DELETE.
```

Mandatory form fields for every master:

```text
Business key field
Business display/name field
Active flag
Remark, when required by existing approval pattern
```

Validation:

```text
1. Required fields must use Validators.required.
2. Length validators must match Oracle column lengths.
3. Numeric fields must use numeric validators.
4. Date fields must use application date format rules.
5. Email fields must use email validation when present.
6. Active flag is mandatory.
7. Submit must be disabled while form is invalid or submitting.
```

\---

## 8\. Angular Model Standard

Create model file:

```text
<master-name>.ts
```

Base model:

```ts
export interface BasicMaster {
  ProcessName: string;
  AutoId?: string;

  Active: string;       // mandatory: Y/N or 1/0 based on application standard
  Status?: string;
  Remark?: string;
  ActionRemark?: string;
  UserId?: string;

  CreatedBy?: string;
  CreatedDate?: string;
  ModifiedBy?: string;
  ModifiedDate?: string;
  ApprovedBy?: string;
  ApprovedDate?: string;
}
```

Each master must extend this with business fields.

Example:

```ts
export interface ExampleMaster extends BasicMaster {
  MasterCode: string;
  MasterName: string;
  Description?: string;
}
```

Naming rules:

```text
1. Model property names should match API DTO fields.
2. API DTO fields should map clearly to Oracle procedure parameters.
3. Avoid unnecessary frontend-only field names when the backend expects a different name.
```

\---

## 9\. Angular Service Standard

The feature service is the only Angular wrapper for master API calls.

Responsibilities:

```text
1. Store API endpoint URL.
2. Build request payloads using ProcessName.
3. Call HttpClient.
4. Map API response tables.
5. Return clean data to store.
6. Keep component free from backend response parsing.
```

Required service methods:

```ts
loadAll(payload)
loadApproved(payload)
getById(payload)
submit(payload)
delete(payload)
getDropdowns(payload) // only when dropdowns are needed
```

Payload examples:

```ts
{ ProcessName: 'SELECT', UserId: userId }
{ ProcessName: 'APPROVED\_RECORDS', UserId: userId }
{ ProcessName: 'GET\_BY\_ID', AutoId: autoId, UserId: userId }
{ ProcessName: 'INSERT', ...formValues, UserId: userId }
{ ProcessName: 'UPDATE', AutoId: autoId, ...formValues, UserId: userId }
{ ProcessName: 'DELETE', AutoId: autoId, UserId: userId }
```

Response mapping:

```text
1. Support the existing API response shape.
2. If the application returns DataSet-style tables, map Table/table/Table1/table1 consistently.
3. Submit/delete must surface status and message from database response.
4. Do not silently treat API errors as success.
```

\---

## 10\. Angular Store Standard

Use the existing application state pattern.

Recommended state:

```ts
interface MasterState<T> {
  allItems: T\[];
  approvedItems: T\[];
  loading: boolean;
  approvedLoading: boolean;
  submitting: boolean;
  errorMessage: string | null;
  selectedItem: T | null;
}
```

Required store methods:

```ts
loadAll()
loadApproved()
getById(autoId)
submitInsert(formValue)
submitUpdate(autoId, formValue)
deleteItem(autoId)
clearError()
resetSelected()
```

Rules:

```text
1. Store should call service.
2. Component should call store.
3. Component should not build Oracle-specific process rules in template.
4. ProcessName should be controlled in service/store, not scattered across components.
5. Store should manage loading/submitting flags.
```

\---

## 11\. ASP.NET API Standard

Create one controller per master or follow the existing application controller grouping pattern.

Recommended route pattern:

```text
api/<MasterName>/<MasterName>\_IUDS
```

Controller responsibilities:

```text
1. Read Authorization header.
2. Validate user/session/token using existing application authorization helper.
3. Resolve UserId from token where supported.
4. Accept request DTO.
5. Build database input parameter table/object.
6. Call existing database procedure helper.
7. Return existing application response shape.
8. Log exceptions using existing application logging pattern.
```

Do not:

```text
1. Add new API response envelope for only one master.
2. Bypass authorization.
3. Trust frontend UserId when token user can be resolved.
4. Put business approval rules only in API.
5. Bypass Oracle stored procedure validation.
```

Controller skeleton:

```csharp
\[Route("api/<MasterName>/<MasterName>\_IUDS")]
\[HttpPost]
public DataSet <MasterName>\_IUDS(<MasterName>Request obj)
{
    try
    {
        // 1. Authorization check
        // 2. Resolve user
        // 3. Build procedure input parameters
        // 4. Call existing database procedure helper
        // 5. Return DataSet or existing application response
    }
    catch (Exception ex)
    {
        // Log exception using existing logging pattern
        throw;
    }
}
``` 

\---

## 12\. API Request DTO Standard

Create request DTO/model matching frontend payload and Oracle procedure parameters.

```csharp
public class MasterRequest
{
    public string ProcessName { get; set; }
    public string AutoId { get; set; }
    public string UserId { get; set; }

    public string Active { get; set; }
    public string Remark { get; set; }

    // Business fields
    public string MasterCode { get; set; }
    public string MasterName { get; set; }
    public string Description { get; set; }
}
```

Rules:

```text
1. DTO must include all fields required by Oracle SP.
2. DTO field names should be stable.
3. Controller must map every required DTO field to the correct SP parameter.
4. Do not add unused fields unless future requirement is confirmed.
5. Active must be included because it is mandatory.
```

\---

## 13\. Oracle Object Naming Standard

Use a consistent object naming pattern. Replace `<MASTER>` with the master name and `<PROJECT\_PREFIX>` with the application/project prefix when your database standard requires it.

Approved table:

```text
<PROJECT\_PREFIX>\_<MASTER>\_MASTER
```

App/pending table:

```text
<PROJECT\_PREFIX>\_<MASTER>\_MASTER\_APP
```

Log table:

```text
<PROJECT\_PREFIX>\_<MASTER>\_MASTER\_LOG
```

Stored procedure:

```text
USP\_<PROJECT\_PREFIX>\_<MASTER>\_MASTER
```

Common approval tables:

```text
<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_MASTER
<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_MASTER\_LOG
```

If the project does not use a prefix, omit `<PROJECT\_PREFIX>`.

\---

## 14\. Oracle Table Column Standard

Every approved table must include:

```text
AUTOID
BUSINESS\_CODE / MASTER\_CODE
BUSINESS\_NAME / MASTER\_NAME
DESCRIPTION, when needed
ACTIVE
STATUS
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
REMARK
ACTIONREMARK
```

Every app/pending table must include:

```text
APP\_AUTOID
AUTOID
BUSINESS\_CODE / MASTER\_CODE
BUSINESS\_NAME / MASTER\_NAME
DESCRIPTION, when needed
ACTIVE
STATUS
ACTION\_TYPE
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
REMARK
ACTIONREMARK
```

Every log table must include:

```text
LOGID
APP\_AUTOID
AUTOID
BUSINESS\_CODE / MASTER\_CODE
BUSINESS\_NAME / MASTER\_NAME
DESCRIPTION, when needed
ACTIVE
STATUS
ACTION\_TYPE
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
REMARK
ACTIONREMARK
LOG\_ACTION
LOGDATE
LOGBY
```

Rules:

```text
1. Active is mandatory in main, app, and log tables.
2. Approved main row must not be overwritten before checker approval.
3. App table stores maker pending changes.
4. Log table stores snapshots after approval/rejection.
```

\---

## 15\. Oracle Stored Procedure Standard

Every basic master SP must support these process names:

```text
SELECT
APPROVED\_RECORDS
GET\_BY\_ID
INSERT
UPDATE
DELETE
```

Optional process names only when needed:

```text
DROPDOWN
EXPORT
```

Required parameters:

```text
p\_PROCESSNAME
p\_AUTOID
p\_BUSINESS\_CODE / p\_MASTER\_CODE
p\_BUSINESS\_NAME / p\_MASTER\_NAME
p\_DESCRIPTION
p\_ACTIVE
p\_REMARK
p\_USERID
cur
cur1, only when multiple result sets are required
```

Rules:

```text
1. ProcessName casing must match frontend payload.
2. Required validations must be repeated in Oracle.
3. Duplicate validations must be in Oracle.
4. Insert/update/delete should return clear Status and Msg.
5. Business validation failures should return through cursor response, not unhandled exception.
```

\---

## 16\. Mandatory Duplicate Validation

Duplicate validation is mandatory.

Duplicate check must be performed against both:

```text
1. Approved/main table
2. App/pending table
```

Recommended duplicate keys:

```text
1. Business Code / Master Code
2. Business Name / Master Name, when name should be unique
```

### INSERT duplicate rule

During INSERT, block the request if the same business code or unique business name exists in:

```text
1. Approved table with active record
2. App table with pending status
```

### UPDATE duplicate rule

During UPDATE, block the request if the same business code or unique business name exists in another record.

The duplicate check must exclude current `AutoId`.

### Generic SQL pattern for INSERT

```sql
SELECT COUNT(1)
INTO v\_count
FROM <PROJECT\_PREFIX>\_<MASTER>\_MASTER
WHERE UPPER(TRIM(MASTER\_CODE)) = UPPER(TRIM(p\_MASTER\_CODE))
  AND NVL(ACTIVE, 'Y') = 'Y';

IF v\_count > 0 THEN
    OPEN cur FOR
        SELECT '1' AS Status,
               'Code already exists in approved records.' AS Msg
        FROM dual;
    RETURN;
END IF;

SELECT COUNT(1)
INTO v\_count
FROM <PROJECT\_PREFIX>\_<MASTER>\_MASTER\_APP
WHERE UPPER(TRIM(MASTER\_CODE)) = UPPER(TRIM(p\_MASTER\_CODE))
  AND STATUS IN ('PENDING', 'PENDING\_INSERT', 'PENDING\_UPDATE', 'PENDING\_DELETE');

IF v\_count > 0 THEN
    OPEN cur FOR
        SELECT '1' AS Status,
               'Code already exists in pending records.' AS Msg
        FROM dual;
    RETURN;
END IF;
```

### Generic SQL pattern for UPDATE

```sql
SELECT COUNT(1)
INTO v\_count
FROM <PROJECT\_PREFIX>\_<MASTER>\_MASTER
WHERE UPPER(TRIM(MASTER\_CODE)) = UPPER(TRIM(p\_MASTER\_CODE))
  AND AUTOID <> p\_AUTOID
  AND NVL(ACTIVE, 'Y') = 'Y';

IF v\_count > 0 THEN
    OPEN cur FOR
        SELECT '1' AS Status,
               'Code already exists in approved records.' AS Msg
        FROM dual;
    RETURN;
END IF;

SELECT COUNT(1)
INTO v\_count
FROM <PROJECT\_PREFIX>\_<MASTER>\_MASTER\_APP
WHERE UPPER(TRIM(MASTER\_CODE)) = UPPER(TRIM(p\_MASTER\_CODE))
  AND NVL(AUTOID, APP\_AUTOID) <> p\_AUTOID
  AND STATUS IN ('PENDING', 'PENDING\_INSERT', 'PENDING\_UPDATE', 'PENDING\_DELETE');

IF v\_count > 0 THEN
    OPEN cur FOR
        SELECT '1' AS Status,
               'Code already exists in pending records.' AS Msg
        FROM dual;
    RETURN;
END IF;
```

Add similar duplicate checks for name when the business requires unique names.

Recommended DB-level safety:

```sql
CREATE UNIQUE INDEX UX\_<MASTER>\_CODE\_ACTIVE
ON <PROJECT\_PREFIX>\_<MASTER>\_MASTER
(
  CASE WHEN NVL(ACTIVE, 'Y') = 'Y' THEN UPPER(TRIM(MASTER\_CODE)) END
);
```

Use DB-level unique index only after confirming inactive duplicate behavior.

\---

## 17\. Mandatory Active / Inactive Rule

Active flag is mandatory for every master.

Rules:

```text
1. Active field must be present in Angular model.
2. Active control must be present in form.
3. Active column must be shown in All and Approved grids.
4. Active must be stored in approved, app, and log tables.
5. Active must be included in insert/update approval flow.
6. Inactive records should not appear in dropdowns unless specifically required.
7. Delete should normally be approval-based and should not physically delete approved records unless project standard requires it.
```

Recommended values:

```text
Y / N
```

or

```text
1 / 0
```

Use whichever value is already standard in the application.

\---

## 18\. Mandatory Common Approval Rule

Common Approval is mandatory for every master.

Maker actions must not directly change approved data.

Maker actions:

```text
INSERT
UPDATE
DELETE
```

must create:

```text
1. App/pending table row
2. Common approval queue row
```

Checker actions:

```text
APPROVE
REJECT
```

must update:

```text
1. Approved/main table
2. App/pending table
3. Log table
4. Common approval queue table
5. Common approval log table
```

Rules:

```text
1. Maker cannot approve own record.
2. Approved/main row must not be overwritten before approval.
3. Rejection remark is mandatory during rejection.
4. Every approve/reject must create log snapshot.
5. Master name must match exactly across maker SP, common approval detail SP, and common approval action SP.
```

\---

## 19\. Common Approval Stored Procedure Approach

Use the existing common approval entry points of the application.

For simple masters, common approval logic may be added inside existing common approval SP branches.

For heavier masters, use helper SP delegation to reduce regression risk.

Recommended helper SP names:

```text
USP\_GET\_<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_<MASTER>
USP\_<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_<MASTER>
```

Existing common approval detail SP should only route to helper SP:

```sql
IF p\_MASTERNAME = '<Master Display Name>' THEN
   USP\_GET\_<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_<MASTER>(
      p\_AUTOID,
      p\_MASTERNAME,
      p\_CREATEDBY,
      p\_USERID,
      cur,
      cur1
   );
   RETURN;
END IF;
```

Existing common approval action SP should only route to helper SP:

```sql
IF p\_MASTERNAME = '<Master Display Name>' THEN
   USP\_<PROJECT\_PREFIX>\_COMMON\_APPROVAL\_<MASTER>(
      p\_QFLAG,
      p\_AUTOID,
      p\_TBL\_AUTOID,
      p\_MASTERNAME,
      p\_REJECT\_REMARK,
      p\_USERID,
      cur
   );
   RETURN;
END IF;
```

This keeps the common approval workflow consistent while isolating master-specific approval logic.

\---

## 20\. Insert Flow

```text
Angular Add Form
  -> Store submitInsert
  -> Service POST with ProcessName INSERT
  -> ASP.NET API controller
  -> Existing DB procedure helper
  -> Oracle master SP
  -> Validate required fields
  -> Validate duplicate against approved table
  -> Validate duplicate against app/pending table
  -> Insert pending row into APP table
  -> Insert row into COMMON\_APPROVAL table
  -> Return success message
  -> Angular reloads All grid
```

Rules:

```text
1. Approved table is not updated during maker insert.
2. Record appears in All tab as pending.
3. Record appears in Approved tab only after checker approval.
```

\---

## 21\. Update Flow

```text
Angular Edit Form
  -> Store submitUpdate
  -> Service POST with ProcessName UPDATE
  -> ASP.NET API controller
  -> Existing DB procedure helper
  -> Oracle master SP
  -> Validate AutoId
  -> Validate required fields
  -> Validate duplicate excluding current AutoId
  -> Insert/update pending row into APP table
  -> Insert/update row into COMMON\_APPROVAL table
  -> Return success message
  -> Angular reloads All grid
```

Rules:

```text
1. Approved row remains unchanged until checker approval.
2. Pending update must be visible in All tab.
3. Approved tab should continue showing last approved version until approval.
```

\---

## 22\. Delete Flow

```text
Angular Delete Action
  -> Confirmation dialog
  -> Store deleteItem
  -> Service POST with ProcessName DELETE
  -> ASP.NET API controller
  -> Existing DB procedure helper
  -> Oracle master SP
  -> Validate AutoId
  -> Validate record exists
  -> Create delete-pending APP row/status
  -> Insert/update row into COMMON\_APPROVAL table
  -> Return success message
  -> Angular reloads All grid
```

Rules:

```text
1. Approved row should not be physically deleted during maker delete.
2. Delete should be completed only after checker approval.
3. Approved delete may mark Active = N or deleted status based on project standard.
```

\---

## 23\. Approve Flow

```text
Checker opens Common Approval
  -> Opens selected master detail
  -> Common approval detail SP returns pending record
  -> Checker approves
  -> Common approval action SP or helper SP runs
  -> APP row is applied to approved table
  -> APP row status updated
  -> COMMON\_APPROVAL row status updated
  -> Master LOG row inserted
  -> COMMON\_APPROVAL\_LOG row inserted
  -> Success returned
```

Approval rules:

```text
INSERT approval:
  Insert new row into approved table.

UPDATE approval:
  Update existing approved row from app row.

DELETE approval:
  Mark approved row inactive/deleted as per project standard.
```

\---

## 24\. Reject Flow

```text
Checker opens Common Approval
  -> Enters rejection remark
  -> Common approval action SP or helper SP runs
  -> APP row marked rejected
  -> COMMON\_APPROVAL row marked rejected
  -> Master LOG row inserted
  -> COMMON\_APPROVAL\_LOG row inserted
  -> Success returned
```

Rules:

```text
1. Rejection remark is mandatory.
2. Approved table should not be changed during rejection.
3. Rejected record should remain traceable through All tab and log tables.
```

\---

## 25\. Dropdown Rules

If the master is used as a dropdown source elsewhere:

```text
1. Dropdown should use approved records only.
2. Dropdown should use Active = Y only unless business requires inactive values.
3. Dropdown should not show pending records.
4. Dropdown process should be separate, usually DROPDOWN.
```

Example:

```text
ProcessName = 'DROPDOWN'
```

\---

## 26\. Audit Rules

Audit fields are mandatory.

Maker insert:

```text
CREATEDBY
CREATEDDATE
```

Maker update/delete:

```text
MODIFIEDBY
MODIFIEDDATE
```

Checker approve/reject:

```text
APPROVEDBY
APPROVEDDATE
ACTIONREMARK / REJECTION\_REMARK
```

Log rules:

```text
1. Insert snapshot into master log table after approve/reject.
2. Insert snapshot into common approval log table after approve/reject.
3. Do not overwrite historical log snapshots.
4. Keep log columns aligned with app/main columns.
```

\---

## 27\. Error Handling Rules

Frontend:

```text
1. Use existing application message/dialog pattern.
2. Show database validation messages returned by API.
3. Show fallback error for API/network failure.
4. Do not silently ignore submit/delete errors.
5. Disable submit button while submitting.
```

API:

```text
1. Use try/catch.
2. Log exception using existing application logging helper.
3. Do not log sensitive data unnecessarily.
4. Return existing application error behavior.
```

Oracle:

```text
1. Return business validation errors through cursor/result response.
2. Use clear Status and Msg columns.
3. Raise exception only for technical failures.
4. Do not commit partial approval changes if any approval step fails.
```

\---

## 28\. Security Rules

```text
1. API authorization is mandatory.
2. UserId should come from token/session when available.
3. Do not trust frontend UserId if backend can resolve authenticated user.
4. Validate all required fields in API/Oracle, not only Angular.
5. Do not expose internal DB errors directly to user.
6. Do not allow maker to approve own record.
```

\---

## 29\. Testing Checklist

### Angular

```text
Route loads correctly.
All tab grid loads.
Approved tab grid loads.
Add dialog/page opens.
Edit dialog/page opens.
View mode disables form.
Required validation works.
Active flag is mandatory.
Submit button disables while invalid/submitting.
Insert success reloads All tab.
Update success reloads All tab.
Delete confirmation appears.
Delete success reloads All tab.
Approved tab shows only approved records.
Error messages display correctly.
```

### API

```text
Authorization header is required.
Token/session user is resolved correctly.
Controller maps every DTO field to correct SP parameter.
ProcessName is passed correctly.
Stored procedure name is correct.
Existing database procedure helper executes successfully.
Response maps correctly to Angular service.
API logs exceptions.
```

### Oracle

```text
INSERT validates required fields.
INSERT validates duplicate in approved table.
INSERT validates duplicate in app table.
INSERT creates pending app row.
INSERT creates common approval row.
UPDATE validates AutoId.
UPDATE validates duplicate excluding current AutoId.
UPDATE creates pending update row.
DELETE creates pending delete row.
APPROVED\_RECORDS returns approved rows.
SELECT returns All tab rows.
DROPDOWN returns approved active rows only.
Approve insert copies app row to approved table.
Approve update updates approved table.
Approve delete marks approved row inactive/deleted.
Reject marks app/common approval rows rejected.
Logs are inserted after approve/reject.
Maker cannot approve own record.
```

### Regression

```text
Existing masters still load.
Existing common approval list still loads.
Existing approve/reject actions still work.
Existing dropdown sources still work.
Existing authentication behavior still works.
Existing export behavior still works when shared.
```

\---

## 30\. Code Review Checklist

```text
Application architecture is followed.
Feature is under <project-name>/src/app/pages/<master-name>/.
Two tabs exist: All and Approved.
Each tab has its own grid.
Active flag is mandatory in UI, API, and DB.
Common Approval is mandatory.
Angular component does not contain backend process-name clutter.
Store/service responsibilities are separated.
API controller checks authorization.
DTO contains all required fields.
Controller maps DTO to SP parameters correctly.
Oracle SP supports SELECT, APPROVED\_RECORDS, GET\_BY\_ID, INSERT, UPDATE, DELETE.
Duplicate validation checks approved and app tables.
Update duplicate validation excludes current AutoId.
Approved row is not overwritten before checker approval.
Common approval queue row is created for maker actions.
Approve/reject updates app/main/log/common approval tables.
Audit fields are populated.
Error messages are clear.
No unrelated feature code is changed.
```

\---

## 31\. New Master Implementation Steps

### Step 1: Define business fields

Identify:

```text
Business code
Business name
Description
Active flag
Any extra fields
Duplicate keys
Dropdown dependencies
```

### Step 2: Create Angular feature

Create:

```text
<project-name>/src/app/pages/<master-name>/
```

with route, shell component, service, store, model, list component, and detail component.

### Step 3: Build list UI

Create:

```text
All tab grid
Approved tab grid
Add button
Action buttons
```

### Step 4: Build detail form

Create Reactive Form with:

```text
Required business fields
Mandatory Active flag
Validation
Add/edit/view modes
```

### Step 5: Build Angular service/store

Implement:

```text
loadAll
loadApproved
getById
insert
update
delete
```

### Step 6: Build ASP.NET API endpoint

Create:

```text
API request DTO
API controller method
Authorization check
Procedure parameter mapping
Procedure helper call
```

### Step 7: Build Oracle objects

Create:

```text
Approved table
App table
Log table
Stored procedure
Common approval branches or helper procedures
```

### Step 8: Implement Oracle validations

Add:

```text
Required validation
Length validation
Duplicate validation against approved table
Duplicate validation against app table
Status validation
Maker/checker validation
```

### Step 9: Implement Common Approval

Add:

```text
Common approval queue insert from maker SP
Common approval detail fetch
Common approval approve/reject action
Master log insert
Common approval log insert
```

### Step 10: Test end to end

Run:

```text
Add -> pending app row -> common approval queue -> approve -> approved grid
Update -> pending update row -> approve -> approved grid updated
Delete -> pending delete row -> approve -> active/deleted status updated
Reject -> app/common approval rejected -> approved row unchanged
Duplicate insert blocked
Duplicate update blocked
Maker self-approval blocked
```

\---

## Final Rule

Every basic master must be built as a controlled maker/checker master with:

```text
1. All tab grid
2. Approved tab grid
3. Mandatory Active flag
4. Mandatory Common Approval
5. Approved/app/log table pattern
6. Oracle duplicate validation against approved and pending records
7. Consistent Angular -> API -> Oracle flow
8. Complete audit and regression testing




```



Need To Add Search Functionality at the grid level 

Bulk Upload Functionality (Restrict Duplicate Records from Excel)

