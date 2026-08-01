# Migrated_Equilization_ProjectV1 Angular UI Structure + Business Rules Context

## HDFC Project Usage Note

For the current `HDFC.PDFCoordinateMapper.Api` project, use this file as a style and structure reference only.

The HDFC implementation-specific Angular context is:

```text
docs/Pagewise Migration/HDFC_Angular_UI_Structure_Business_Rules_Context.md
```

Reason:

```text
The HDFC API and DB are completed around Auth, Module/Menu, User Master, Role Master, and Common Approval.
This Equalization reference contains additional workflows such as Group Master, Group Permissions, OTP, Change Password, and Equilization master pages that are not currently available in the HDFC API/DB contract.
```

## Purpose

Use this context before creating `Migrated_Equilization_ProjectV1` Angular UI.

The new UI must be based on the finalized Pagewise Migration contexts and should keep the look, feel, structure, and interaction style similar to:

```text
Migrated_Equilization_Project\web
```

Do not start project creation until the user approves this context.

---

# 1. Source Contexts

Angular implementation must follow these pagewise contexts:

```text
frmLogin-angular-api-migration-context.md
frmChangePassword-angular-api-migration-context.md
angular-layout-menu-component-migration-context.md
frmAddNewGroup-angular-api-migration-context.md
frmApproveGroup-angular-api-migration-context.md
frmAddNewUser-angular-api-migration-context.md
frmApproveUser-angular-api-migration-context.md
frmModuleMaster-angular-api-migration-context.md
frmGrpPermission-angular-api-migration-context.md
frmApproveGroupPermissions-angular-api-migration-context.md
```

Existing UI reference:

```text
Migrated_Equilization_Project\web\src\app
```

Current target patterns to preserve:

```text
Angular standalone components
Angular Material
AG Grid where list/grid behavior is required
AuthStore / Signal Store style state
ApplicationShellComponent layout
auth guard
permission guard
auth interceptor
typed API service
shared models
page header/state components
```

---

# 2. High-Level User Flow

The migrated UI must support this flow:

```text
1. User opens /login.
2. User enters application group, user id, password, and OTP if required.
3. API authenticates user.
4. API returns authenticated user, token/session, permissions, and menu.
5. Angular stores session in AuthStore.
6. Angular opens the application layout.
7. Layout displays menu items returned by API.
8. User clicks a menu item.
9. Angular router opens the selected page.
10. Page actions call API endpoints.
11. API enforces permissions and maker/checker rules.
```

Menu click must only navigate. Business actions happen inside the opened page.

---

# 3. Required Angular Project Structure

Recommended structure:

```text
Migrated_Equilization_ProjectV1/
  web/
    src/
      app/
        app.config.ts
        app.routes.ts
        auth/
          login.page.ts
          change-password.dialog.ts
          store/
            auth.store.ts
        layout/
          application-shell.component.ts
        dashboard/
          dashboard.page.ts
        administration/
          groups/
            groups.page.ts
            group-form.page.ts
          users/
            users.page.ts
            user-form.page.ts
          modules/
            modules.page.ts
            module-form.page.ts
          permissions/
            assign-group-permission.page.ts
          approvals/
            approve-groups.page.ts
            approve-users.page.ts
            approve-group-permissions.page.ts
        equilization/
          mutual-funds/
          scheme-types/
          schemes/
          plans/
        shared/
          data-access/
            equalization-api.service.ts
          models/
            administration.models.ts
            auth.models.ts
            menu.models.ts
          security/
            auth.guard.ts
            auth.interceptor.ts
            has-permission.directive.ts
          ui/
            page-header.component.ts
            state.page.ts
            notification.service.ts
            ag-grid-renderers.ts
```

Use the existing `Migrated_Equilization_Project\web` project as the UI design baseline.

---

# 4. Layout And Menu Rules

Layout must follow `angular-layout-menu-component-migration-context.md`.

Required behavior:

```text
ApplicationShellComponent renders after authentication.
Menu comes from LoginResponse.menu or GET /api/auth/menu.
Menu source of truth is API/DB permissions, not hardcoded role checks.
User name, group, and application group are visible in shell/profile area.
Profile menu contains Change Password and Logout.
Logout calls API and clears session/menu.
Refresh reloads session and menu.
Unauthorized route displays unauthorized state.
```

Sample menu groups:

```text
Dashboard
Admin Master
  Groups
  Authorize Group
  User
  Authorize User
  Module
  Module Permissions
  Authorize Group Permissions
Equilization Master
  Mutual Fund Master
  Scheme Type Master
  Scheme Master
  Plan Master
```

Route mapping:

```text
Dashboard -> /dashboard
Groups -> /administration/groups
Authorize Group -> /administration/approvals/groups
User -> /administration/users
Authorize User -> /administration/approvals/users
Module -> /administration/modules
Module Permissions -> /administration/permissions
Authorize Group Permissions -> /administration/approvals/group-permissions
Mutual Fund Master -> /equilization/mutual-funds
Scheme Type Master -> /equilization/scheme-types
Scheme Master -> /equilization/schemes
Plan Master -> /equilization/plans
```

---

# 5. Administration Page Rules

## Groups

Rules:

```text
Group can be associated with multiple application groups.
Add Group uses applicationGroups: string[] in Angular.
Provider maps applicationGroups[] to legacy @AppGroupName.
Group approval is maker/checker.
Maker cannot approve/reject own group.
```

AG Grid list must include group id, group name, description, application groups, status, maker/checker fields, and actions.

## Users

Rules:

```text
One Add User screen creates one user for one selected/current application group context.
Selected group may be associated with multiple application groups.
Passwords are never logged or stored in browser storage.
Standing Instruction access is optional and follows page context.
User approval is maker/checker.
Maker cannot approve/reject own user.
```

## Modules

Rules:

```text
One module belongs to one application group.
Module Belongs To defines hierarchy/category.
Module Master is direct create/list unless user later confirms maker/checker.
```

## Group Permissions

Rules:

```text
Permission assignment workspace is one group + one selected application group + one module type.
Same group can appear under multiple application groups.
Permission assignment and deletion are pending until checker approval.
Do not identify permission rows by group alone.
```

---

# 6. Approval Page Rules

Approval pages:

```text
Approve Group
Approve User
Approve Group Permissions
```

Common behavior:

```text
AG Grid pending list.
Bulk approve/reject where legacy supports it.
Row-level mutually exclusive approve/reject selection where applicable.
Confirmation before submit.
Maker/checker validation in API and mirrored in UI messaging.
Grid refresh after successful decision.
Row-level failure messages for partial failure if API supports it.
```

Do not allow editing from approval pages.

---

# 7. Authentication And Change Password Rules

Login:

```text
Route /login.
API returns user + token + menu.
New user or expired password opens blocking change-password flow.
OTP is supported if API requires it.
Invalid password does not reveal sensitive details.
```

Change Password:

```text
Opened from profile menu for normal change.
Opened as blocking flow for first login / expired password.
Old password, new password, confirm password fields.
Angular validates required/match/length/complexity for UX.
API performs authoritative password validation and history checks.
No password/hash/history is stored in browser.
```

---

# 8. Sample Data Rules

Use sample data from the pagewise contexts:

```text
Admin -> Administrator, Equilization
Admin Maker -> Administrator
Admin Checker -> Administrator
Equilization Maker -> Equilization
Equilization Checker -> Equilization
```

Module/menu sample data:

```text
Dashboard
Admin Master
Groups
Authorize Group
User
Authorize User
Module
Module Permissions
Authorize Group Permissions
Equilization Master
Mutual Fund Master
Scheme Type Master
Scheme Master
Plan Master
```

Keep `Equilization` spelling exactly as supplied by the user unless the actual DB values differ.

---

# 9. UI Design Rules

Keep UI similar to existing migrated project:

```text
quiet enterprise layout
top navigation/menu shell
Angular Material controls
AG Grid for list screens
compact page headers
consistent action buttons
confirmation dialogs for destructive/approval actions
inline validation errors
notification banner/snackbar for outcomes
```

Do not create marketing/landing pages. Authenticated users should land in dashboard/application shell.

Avoid:

```text
hardcoded role-only menu visibility
duplicated auth stores
duplicated API clients
password display/logging
database/SP names inside Angular components
UI-only authorization
unimplemented menu links that break routing
```

---

# 10. Angular Testing Checklist

```text
Login success stores user/menu/token.
Refresh reloads user/menu.
Logout clears state.
Change password validates required/match/complexity.
Menu renders based on API response.
Menu click routes to page.
Unauthorized manual route is blocked.
Group supports multiple application groups.
Admin Maker does not see checker authorization menus.
Admin Checker does not see maker maintenance actions.
Approval grids enforce row selection behavior.
AG Grid columns match pagewise context.
No password/OTP/hash exists in localStorage/sessionStorage.
Responsive layout has no overlapping menu text.
```

---

# 11. Final Rule

`Migrated_Equilization_ProjectV1` Angular UI must reuse the existing migrated UI style and implement the pagewise contexts as a menu-driven authenticated application. Do not create the project until the user approves this context.
