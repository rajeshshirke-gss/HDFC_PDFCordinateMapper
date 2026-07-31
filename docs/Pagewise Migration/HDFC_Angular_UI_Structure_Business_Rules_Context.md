# HDFC Angular UI Structure + Business Rules Context

## Purpose

Use this context before creating or implementing the Angular UI for the current `HDFC.PDFCoordinateMapper.Api` project.

This file takes UI structure and discipline from:

```text
Migrated_Equilization_ProjectV1-angular-ui-structure-business-rules-context.md
```

but adapts it to the HDFC API and Oracle DB that are actually completed and verified.

Do not implement Equalization-only pages, endpoints, tables, or stored procedures in this HDFC Angular UI unless they are later added to the HDFC API/DB and verified.

## Verification Summary

| Area | Verified Result |
| --- | --- |
| API source | Verified from `HDFC.PDFCoordinateMapper.Api\Controllers`, `Services`, and `Models`. |
| API architecture | Classic ASP.NET Web API 2, .NET Framework 4.7.2, controller -> service -> `DbHelper` -> Oracle stored procedure. |
| DB connection | SQLcl MCP connected to `HDFCPDFMAP`. |
| DB version | Oracle `19.3.0.0.0`, read-write, `AL32UTF8`. |
| Valid DB procedures | Login, logout, module/menu, user, role, and common approval procedures are `VALID`. |
| Valid DB tables | User, role, menu, role-menu mapping, common approval, and session tables exist. |

Verified DB procedures:

```text
USP_ADMIN_LOGIN
LDAP_LOGIN_FAILED
USP_USER_LOGOUT
USP_GETALLMODULE_MASTER_ACCESS
USP_GETMENU
USP_DDP_USERMASTER_IUDS
USP_DDP_ROLEMASTER_IUDS
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
USP_GETROLES
USP_GETROLENAME
USP_CCIL_MODULEMASTER_IUDS
```

Verified DB tables:

```text
USER_MASTER
USER_MASTER_APPROVAL
ROLE_MASTER
ROLE_MASTER_APPROVAL
ROLE_MODULEMAPPING
MENU_MASTER
MST_MODULE_MASTER_ACCESS
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
USER_SESSION
```

## Important Scope Decision

The reference context contains Equalization terms:

```text
Groups
Application Groups
Group Permissions
Equilization Master
Mutual Fund Master
Scheme Type Master
Scheme Master
Plan Master
OTP
Change Password
GET /api/auth/menu
GET /api/auth/session
```

For the current HDFC project, implement only what the HDFC API/DB supports:

```text
Login
Current user
Logout
Module access
Dynamic menu
User Master
Role Master
Role menu access
Common Approval for User Master and Role Master
Locked/dormant user actions
```

HDFC equivalent mapping:

| Reference Context Term | HDFC Implementation Term |
| --- | --- |
| Group | Role |
| Group permission | Role menu access |
| Module permission | Role to menu mapping |
| Authorize Group | Approve Role Master |
| Authorize User | Approve User Master |
| Application menu | `USP_GETALLMODULE_MASTER_ACCESS` + `USP_GETMENU` |
| `/api/auth/menu` | Not available; use `/api/welcome/GetData` and `/api/Menu/getmenu` |
| `/api/auth/session` | Not available; use `/api/auth/me` |

## Angular Technology Rules

Use modern Angular patterns similar to the reference context:

```text
Angular standalone components
Angular Material for forms, dialogs, buttons, menus, tabs
AG Grid or a reusable data grid for dense list screens
Feature-based folders
AuthStore / Signal Store style state
Typed API service layer
HTTP interceptors
Route guards
Permission guard
Reusable page header and state components
Reactive forms
Confirm dialogs for destructive and approval actions
Snackbar/toast notification service
```

Do not create a marketing page. Authenticated users should land directly in the application shell/dashboard.

## HDFC-Inspired Theme Context

### Theme Source

The UI theme should be inspired by the current HDFC Bank personal banking and NetBanking visual language:

```text
Official HDFC Bank personal banking site:
https://www.hdfc.bank.in/

Observed brand/UI patterns:
  strong HDFC blue navigation
  white content surfaces
  red action/accent color
  light blue panels and selection states
  tabbed personal/NRI/HNI/wholesale-style navigation
  product/service category navigation
  compact CTAs such as Apply Now, Know More, Login
  financial-product tile/card structure
  simple, direct banking language
```

Use these references as visual guidance only. Do not copy HDFC website assets, images, or logo files unless the project has approved brand assets.

### Theme Personality

The Angular app is an internal/admin banking application, so the theme must feel:

```text
trustworthy
secure
quiet
professional
operational
easy to scan
close to HDFC visual identity
```

It should not feel like a public marketing landing page. Use the HDFC color language, but keep layouts dense and work-focused for repeated admin use.

### Color Tokens

Recommended HDFC-inspired palette:

```css
:root {
  --hdfc-blue-900: #003c78;
  --hdfc-blue-800: #004b8d;
  --hdfc-blue-700: #005ca8;
  --hdfc-blue-600: #006fc9;
  --hdfc-blue-100: #e8f2fb;
  --hdfc-blue-050: #f4f9fd;

  --hdfc-red-700: #d71920;
  --hdfc-red-600: #ed1c24;
  --hdfc-red-050: #fff1f2;

  --hdfc-ink-900: #172033;
  --hdfc-ink-700: #334155;
  --hdfc-ink-500: #64748b;
  --hdfc-border: #d8e0ea;
  --hdfc-surface: #ffffff;
  --hdfc-page: #f5f7fa;

  --hdfc-success: #16833a;
  --hdfc-warning: #b7791f;
  --hdfc-danger: #d71920;
  --hdfc-info: #005ca8;
}
```

Usage rules:

| Token | Usage |
| --- | --- |
| `--hdfc-blue-900` | Top bar, primary navigation background. |
| `--hdfc-blue-800` | Active side-nav rail, selected tabs, primary outlines. |
| `--hdfc-blue-100` | Selected row, menu hover, info panels. |
| `--hdfc-red-600` | Primary destructive/action emphasis, required alert accent, critical badges. |
| `--hdfc-page` | Application page background. |
| `--hdfc-surface` | Forms, grids, dialogs, panels. |
| `--hdfc-border` | Field, grid, panel, and divider borders. |

Avoid one-color screens. The UI should be mostly white/light gray with blue navigation and red accents.

### Typography

Recommended font stack:

```css
font-family: "Inter", "Roboto", "Segoe UI", Arial, sans-serif;
```

Rules:

```text
Use 14px as the default application text size.
Use 12px to 13px for dense grid metadata only.
Use 16px to 18px for page titles inside admin screens.
Use 20px to 24px only for dashboard/module headings.
Use font-weight 600 for page titles, tab labels, and selected menu text.
Do not use negative letter spacing.
Do not scale font size with viewport width.
```

### Layout Shell Theme

Top bar:

```text
height: 56px
background: HDFC blue
text: white
left: app name / module name
center/left: selected module dropdown when needed
right: user name, profile menu, logout
```

Side navigation:

```text
width: 248px desktop
background: white
border-right: 1px solid border token
active item: blue-tinted background with blue left border
hover item: light blue background
parent item: medium weight
child item: indented, compact
icons: simple line icons
```

Main content:

```text
background: light page gray
content max width: none for grid-heavy pages
padding: 16px to 20px desktop
padding: 12px mobile
```

### Component Texture

Use banking-style restrained components:

```text
border radius: 4px to 6px
borders: visible but light
shadows: minimal, only dialogs/popovers/dropdowns
surfaces: white with clear separators
grid headers: pale blue/gray background
row hover: very light blue
selected row: light blue with blue left indicator
```

Do not use:

```text
large rounded cards
gradient-orb backgrounds
decorative blobs
marketing hero sections
oversized illustration panels
purple-heavy palettes
```

### Buttons

Button style should mirror banking CTAs: compact, clear, and strongly color-coded.

Primary button:

```text
background: HDFC blue
text: white
height: 36px
border-radius: 4px
font-weight: 600
```

Primary actions:

```text
Save
Submit
Login
Search
Apply filter
Approve when approve is the primary screen intent
```

Red action button:

```text
background: HDFC red
text: white
```

Use for:

```text
Delete
Reject
Logout confirmation
Critical irreversible actions
```

Secondary button:

```text
background: white
border: 1px solid HDFC blue
text: HDFC blue
```

Use for:

```text
Cancel
Back
Reset
View details
Know more style secondary action
```

Icon buttons:

```text
Use icons for edit, delete, approve, reject, view, refresh, export.
Always provide tooltip text.
Keep row action buttons 32px x 32px.
```

### Forms

Form rules:

```text
Use Angular Material form fields.
Use two-column layout on desktop.
Use single-column layout on mobile.
Required field marker should use red.
Validation text should be short and direct.
Disable submit while saving.
Show DB result message through snackbar and inline summary when needed.
```

Field density:

```text
Use compact form field appearance for admin screens.
Keep labels concise: User ID, Role Name, Department, Branch, Active.
Do not expose DB flags such as INSERT, UPDATE, S, FM in visible labels.
```

### Grids

AG Grid or the reusable table must use HDFC-inspired density:

```text
header height: 40px
row height: 38px to 42px
header background: light blue/gray
header text: dark ink, 600 weight
row border: light border token
hover: light blue
selected: stronger light blue
actions pinned right
status badges colored and compact
```

Grid toolbars:

```text
left: page title/search/filter summary
right: Add, Refresh, Export when available
```

### Status Badges

Use consistent badges:

| Status | Style |
| --- | --- |
| Approved | Green text on pale green. |
| Pending | Blue text on pale blue. |
| Rejected | Red text on pale red. |
| Deleted | Red outline or pale red. |
| Locked | Amber text on pale amber. |
| Dormant | Gray text on pale gray. |
| Active | Green. |
| Inactive | Gray or red depending business meaning. |

### Dialogs

Dialogs should be simple:

```text
Title: 18px, 600
Body: direct business confirmation
Primary action: blue for submit/approve
Danger action: red for delete/reject
Cancel: secondary
No nested cards inside dialogs
```

### Accessibility And Responsive Rules

```text
All controls must be keyboard reachable.
Do not rely only on color for status.
All icon buttons need aria-label and tooltip.
Text must not overlap at mobile widths.
Side nav collapses to drawer on tablet/mobile.
Tables should use horizontal scroll or responsive column hiding.
Color contrast must be readable on blue/red buttons.
```

### Example Theme SCSS Skeleton

```scss
:root {
  --app-primary: var(--hdfc-blue-800);
  --app-primary-hover: var(--hdfc-blue-900);
  --app-accent: var(--hdfc-red-600);
  --app-bg: var(--hdfc-page);
  --app-surface: var(--hdfc-surface);
  --app-border: var(--hdfc-border);
  --app-text: var(--hdfc-ink-900);
  --app-muted: var(--hdfc-ink-500);
}

.app-shell {
  min-height: 100vh;
  background: var(--app-bg);
  color: var(--app-text);
  font-family: "Inter", "Roboto", "Segoe UI", Arial, sans-serif;
}

.app-topbar {
  height: 56px;
  background: var(--hdfc-blue-900);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.primary-button {
  background: var(--hdfc-blue-800);
  color: #fff;
  border-radius: 4px;
  min-height: 36px;
  font-weight: 600;
}

.danger-button {
  background: var(--hdfc-red-600);
  color: #fff;
  border-radius: 4px;
  min-height: 36px;
  font-weight: 600;
}
```

## High-Level User Flow

```text
1. User opens /login.
2. User enters user id and password.
3. Angular calls POST /api/auth/login.
4. API authenticates through USP_ADMIN_LOGIN.
5. API returns user/token/session DataSet information.
6. Angular stores authenticated state in AuthStore.
7. Angular opens ApplicationShellComponent.
8. Shell calls /api/auth/me on refresh.
9. Shell loads modules through /api/welcome/GetData.
10. Shell loads menu through /api/Menu/getmenu for selected role/module.
11. Menu renders from DB-backed rows.
12. User clicks menu item.
13. Angular router opens page.
14. Page actions call HDFC APIs.
15. API and DB enforce maker/checker and business rules.
```

Menu click must only navigate. Business operations must happen inside routed pages.

## Required Angular Project Structure

Recommended structure:

```text
HDFC.PDFCoordinateMapper.Angular/
  src/
    app/
      app.config.ts
      app.routes.ts
      core/
        api/
          hdfc-api.service.ts
          api-response.models.ts
          dataset.adapter.ts
          api-error.interceptor.ts
          auth-token.interceptor.ts
        auth/
          auth.store.ts
          auth.service.ts
          auth.guard.ts
          login.page.ts
        layout/
          application-shell.component.ts
          top-bar.component.ts
          side-nav.component.ts
          menu.models.ts
          menu.service.ts
          menu.store.ts
        security/
          permission.guard.ts
          has-permission.directive.ts
          permission.service.ts
      features/
        dashboard/
          dashboard.page.ts
        access-admin/
          access-admin.routes.ts
          users/
            user-list.page.ts
            user-form.page.ts
            user-master.service.ts
            user-master.models.ts
          roles/
            role-list.page.ts
            role-form.page.ts
            menu-access-tree.component.ts
            role-master.service.ts
            role-master.models.ts
          approvals/
            approval-list.page.ts
            approval-detail.page.ts
            common-approval.service.ts
            common-approval.models.ts
          locked-users/
            locked-users.page.ts
          dormant-users/
            dormant-users.page.ts
      shared/
        ui/
          page-header.component.ts
          state-page.component.ts
          confirm-dialog.component.ts
          status-badge.component.ts
          notification.service.ts
        utils/
          date-format.util.ts
          string-normalizer.util.ts
```

## Core API Contract

### Auth APIs

| Method | Endpoint | Angular Method |
| --- | --- | --- |
| `POST` | `/api/auth/login` | `authService.login()` |
| `GET` | `/api/auth/me` | `authService.getCurrentUser()` |
| `POST` | `/api/auth/logout` | `authService.logout()` |

### Layout/Menu APIs

| Method | Endpoint | Angular Method |
| --- | --- | --- |
| `POST` | `/api/welcome/GetData` | `menuService.getModules(userId)` |
| `POST` | `/api/Menu/getmenu` | `menuService.getMenu(roleId, moduleId)` |

### User Master APIs

| Method | Endpoint | Angular Method |
| --- | --- | --- |
| `GET` | `/api/UserMaster/GetUserMaster` | `userMasterService.getUsers()` |
| `GET` | `/api/UserMaster/GetAllRecordForDDL` | `userMasterService.getDropdowns()` |
| `POST` | `/api/UserMaster/SaveUserMaster` | `userMasterService.createOrUpdateUser()` |
| `POST` | `/api/UserMaster/Delete_UserMaster` | `userMasterService.deleteUser()` |
| `POST` | `/api/UserMaster/UserMaster_IUDS` | `userMasterService.executeUserProcess()` |
| `POST` | `/api/UserMaster/UnlockUser` | `userMasterService.unlockUser()` |

### Role Master APIs

| Method | Endpoint | Angular Method |
| --- | --- | --- |
| `GET` | `/api/RoleMaster/GetRoleMaster` | `roleMasterService.getRoleMaster()` |
| `GET` | `/api/RoleMaster/GetRoles` | `roleMasterService.getRoles()` |
| `POST` | `/api/RoleMaster/GetRoleName` | `roleMasterService.getRoleName(userId)` |
| `POST` | `/api/RoleMaster/SaveRoleMaster` | `roleMasterService.createOrUpdateRole()` |
| `POST` | `/api/RoleMaster/Delete_RoleMaster` | `roleMasterService.deleteRole()` |
| `POST` | `/api/RoleMaster/ModuleMaster_IUDS` | `roleMasterService.moduleMasterIuds()` |

### Common Approval APIs

| Method | Endpoint | Angular Method |
| --- | --- | --- |
| `POST` | `/api/CommonApproval/GetAllMasterForDDL` | `approvalService.getMasters()` |
| `POST` | `/api/CommonApproval/GetAllUser` | `approvalService.getPending()` |
| `POST` | `/api/CommonApproval/GetData_CommonApproval` | `approvalService.getDetails()` |
| `POST` | `/api/CommonApproval/CommonApproval_AR` | `approvalService.approveOrReject()` |

## Response Handling Rules

The API returns two response styles:

```text
Auth APIs -> ApiResponse<T>
Most DB APIs -> raw DataSet JSON
```

Angular must normalize both.

Required models:

```ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  correlationId?: string;
}

export interface DataSetResponse {
  Table?: unknown[];
  Table1?: unknown[];
  Table2?: unknown[];
  table?: unknown[];
  table1?: unknown[];
  table2?: unknown[];
}
```

Required adapter:

```ts
export function getTable<T>(response: DataSetResponse, index = 0): T[] {
  const pascal = index === 0 ? 'Table' : `Table${index}`;
  const camel = index === 0 ? 'table' : `table${index}`;
  return ((response as any)?.[pascal] ?? (response as any)?.[camel] ?? []) as T[];
}
```

Components must not directly parse `Table`, `Table1`, or raw stored-procedure rows. Services/facades must map those rows into UI models.

## Layout And Menu Rules

The layout should be an operational admin shell:

```text
Top bar:
  application name
  selected module
  signed-in user
  profile menu

Left navigation:
  DB-driven parent/child menu
  active route state
  collapsible sections

Main area:
  router-outlet
```

Menu source of truth:

```text
/api/welcome/GetData
/api/Menu/getmenu
MENU_MASTER
MST_MODULE_MASTER_ACCESS
ROLE_MODULEMAPPING
```

Do not hardcode role-only menu visibility. A temporary mock menu may be used only behind a development flag until live menu rows are captured.

Menu item mapping:

| DB/API Column | Angular Field |
| --- | --- |
| `ID` / `MENU_ID` | `id` |
| `CAPTION` / `VALUE` | `label` |
| `URL` / `URL_UPGRADE` | `route` |
| `PARENT_ID` | `parentId` |
| `HAS_CHILD` | `hasChildren` |
| `MENU_SEQUENCE` | `sequence` |
| `HIDE` | `enabled` inverse |
| `ICON` | `icon` |
| `MODULEID` | `moduleId` |
| `RIGHTS` | `rights` |
| `ACTIONNAME` | `actionName` |
| `CONTROLLERNAME` | `controllerName` |

Recommended routes:

```text
/login
/dashboard
/access-admin/users
/access-admin/users/new
/access-admin/users/:autoId/edit
/access-admin/roles
/access-admin/roles/new
/access-admin/roles/:autoId/edit
/access-admin/approvals
/access-admin/approvals/:masterName/:tblAutoId
/access-admin/locked-users
/access-admin/dormant-users
/unauthorized
/not-implemented
```

Unknown legacy DB URLs must route to `/not-implemented`, not a broken page.

## Administration Page Rules

### Users

Rules:

```text
User create/update/delete uses maker/checker.
Create sends flag INSERT.
Update sends flag UPDATE.
Delete uses Delete_UserMaster, DB flag D.
Unlock uses Unlock_A.
Dormant unlock uses Unlock_IsDomant.
Passwords must not be stored or displayed in Angular.
```

List/grid should include:

```text
User ID
User Name
Role/Group
Email
Department
Branch
Active
Dormant
Status
Action Remark
Created By/Date
Modified By/Date
Approved By/Date
Actions
```

### Roles

Rules:

```text
Role create/update/delete uses maker/checker.
Create sends flag INSERT.
Update sends flag UPDATE.
Delete sends flag DELETE.
Role menu access is saved as comma-delimited menuAccess.
Role form should include active toggle and menu access tree.
```

List/grid should include:

```text
Role Code
Role Name
Description
Active
Status
Action Remark
Created By/Date
Modified By/Date
Approved By/Date
Actions
```

### Role Menu Access

Rules:

```text
Render MENU_MASTER as tree.
Use checkbox selection.
Persist selected menu ids as comma-delimited menuAccess.
Do not invent a separate group-permission model for HDFC.
```

### Common Approval

Rules:

```text
Approval master dropdown comes from GetAllMasterForDDL.
Supported HDFC masters are User Master and Role Master.
Pending list uses GetAllUser with flag S.
Detail uses GetData_CommonApproval.
Approve uses CommonApproval_AR with qflag A.
Reject uses CommonApproval_AR with qflag R.
Maker cannot approve/reject own record.
```

Approval grid should support:

```text
Master filter
Pending rows
View details
Approve
Reject
Confirmation dialog
Business message display
Grid refresh after action
```

## Auth And Security Rules

Use:

```text
auth-token.interceptor.ts
api-error.interceptor.ts
auth.guard.ts
permission.guard.ts
has-permission.directive.ts
```

Rules:

```text
JWT token is sent as Authorization: Bearer {token} when present.
/api/auth/me is used to restore user after refresh.
When EnableJwtAuthorization=false, local testing can use swagger-test-user.
Frontend menu hiding is not security.
API and DB remain final enforcement.
No password or sensitive token debug output in console.
```

Profile menu:

```text
Current user
Change Password - keep disabled/hidden until API contract exists
Logout
```

## UI Design Rules

Follow the reference style, adapted for HDFC:

```text
Quiet enterprise admin layout
Compact header
Dense searchable grids
Angular Material form controls
AG Grid or reusable table for list pages
Icon buttons with tooltips for row actions
Confirmation dialogs for delete/approve/reject
Snackbars/toasts for DB messages
Status badges for pending/approved/rejected/deleted/locked/dormant
No nested cards
No marketing hero pages
No overlapping mobile text
```

Use page titles that match HDFC module naming:

```text
Dashboard
User Master
Role Master
Common Approval
Locked Users
Dormant Users
```

## Validation Rules

### User Form

| Field | Rule |
| --- | --- |
| User ID | Required. |
| User Name | Required. |
| Email | Required, email format. |
| Role/Group | Required. |
| Department | Required when returned by dropdown/business data. |
| Branch | Required when returned by dropdown/business data. |
| Active | Map to DB value, usually `Y`/`N`/`D`/`U`. |

### Role Form

| Field | Rule |
| --- | --- |
| Role Code | Required. |
| Role Name | Required. |
| Description | Max 50 chars based on DB column. |
| Active | Required. |
| Menu Access | Required unless business allows empty role. |

### Approval Action

| Field | Rule |
| --- | --- |
| Master Name | Required. |
| Table Auto ID | Required. |
| Checker User | Required. |
| Reject Remark | Recommended; make mandatory only after backend persistence is confirmed. |

## Implementation Order

1. Create Angular project and base layout shell.
2. Add shared API client, interceptors, DataSet adapter, and notification service.
3. Add AuthStore, login page, logout, auth guard, and refresh using `/api/auth/me`.
4. Add module/menu store using `/api/welcome/GetData` and `/api/Menu/getmenu`.
5. Add dashboard and route placeholders for unknown menu links.
6. Add User Master list and dropdown loading.
7. Add User Master add/edit/delete/unlock flows.
8. Add Role Master list and add/edit/delete flows.
9. Add menu access tree for roles.
10. Add Common Approval list/detail/approve/reject.
11. Add permission guard and action directive after live menu/action columns are captured.
12. Add integration tests and response catalogue.

## Testing Checklist

```text
Login stores user/token/session.
Refresh restores user through /api/auth/me.
Logout clears token/user/menu.
Module list loads from /api/welcome/GetData.
Menu loads from /api/Menu/getmenu.
Menu renders from DB response, not hardcoded role checks.
Menu click routes to implemented pages.
Unknown DB route opens /not-implemented.
User list loads.
User add/update/delete requests show DB messages.
Role list loads.
Role add/update/delete requests show DB messages.
Role menu access tree saves comma-delimited menuAccess.
Common approval master dropdown loads.
Pending approval list loads for User Master and Role Master.
Approve and reject use different checker from maker.
Unauthorized manual route goes to /unauthorized.
No password is stored in localStorage/sessionStorage.
Responsive shell does not overlap menu text.
```

## Out Of Scope Until API/DB Contract Exists

Do not implement these as working HDFC screens yet:

```text
OTP
Change Password
Equalization Mutual Fund/Scheme/Plan pages
Group Master as separate concept from Role Master
Group Permission workspace as separate concept from Role menu access
/api/auth/menu
/api/auth/session
```

If these are needed later, create API/DB PBIs first.

## Final Rule

Use the referenced Equalization context for Angular style and discipline only. For this HDFC project, the implementation source of truth is the verified HDFC API and Oracle DB contract:

```text
Auth -> Module/Menu -> User Master -> Role Master -> Common Approval
```

Build the Angular UI around those completed APIs before adding any unsupported workflow.
