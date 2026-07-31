# Angular Layout / Menu Component Migration Context

## HDFC Verification Addendum

For the current `HDFC.PDFCoordinateMapper.Api` project, read these HDFC-specific verification files before implementation:

```text
docs/Pagewise Migration/hdfc-pagewise-migration-api-db-fit-gap.md
docs/Pagewise Migration/hdfc-angular-layout-menu-deep-implementation.md
docs/Pagewise Migration/hdfc-angular-pagewise-ui-pbis.md
```

Reason:

```text
This original Pagewise Migration context references an Equalization-style target contract with /api/auth/menu, /api/auth/session, group permissions, OTP, and change password flows.
The current HDFC API/DB verification shows the implemented contract is different:
  /api/welcome/GetData
  /api/Menu/getmenu
  /api/UserMaster/*
  /api/RoleMaster/*
  /api/CommonApproval/*
```

Use the HDFC-specific files as the implementation source of truth unless the missing Equalization-style API/DB objects are later added and verified.

## Purpose

Use this context when implementing the Angular application layout that appears after login.

Target user flow:

```text
User logs in.
API returns authenticated user + approved menu.
Angular layout displays menus from the menu response.
User clicks a menu.
Router opens the mapped page.
Page actions are still protected by route/API permissions.
```

This replaces the legacy WinForms MDI behavior from `frmLogin`, where successful login opened a module-specific MDI form.

---

# 1. Existing Target Files

Current migrated Angular/API files already present:

```text
Migrated_Equilization_Project\web\src\app\layout\application-shell.component.ts
Migrated_Equilization_Project\web\src\app\auth\store\auth.store.ts
Migrated_Equilization_Project\web\src\app\auth\login.page.ts
Migrated_Equilization_Project\web\src\app\shared\data-access\equalization-api.service.ts
Migrated_Equilization_Project\web\src\app\shared\models\administration.models.ts
Migrated_Equilization_Project\web\src\app\shared\security\auth.guard.ts
Migrated_Equilization_Project\web\src\app\shared\security\permission.guard.ts or permissionGuard in auth.guard.ts
Migrated_Equilization_Project\web\src\app\shared\security\has-permission.directive.ts
Migrated_Equilization_Project\web\src\app\app.routes.ts
Migrated_Equilization_Project\src\api\Equalization.Api\Program.cs
```

Existing API endpoints:

```text
POST /api/auth/login
GET  /api/auth/menu
GET  /api/auth/me
GET  /api/auth/session
POST /api/auth/logout
```

---

# 2. Menu Source Of Truth

Menus must come from API/user permissions, not hardcoded frontend role checks.

Target `MenuItem` model:

```text
id
label
route
permission
icon
enabled
children[]
```

Menu response is loaded from:

```text
LoginResponse.menu
GET /api/auth/menu
```

API menu generation should use approved DB permission data:

```text
USP_Admin_GetData / "Get User Menu Rights"
USP_AdminModulePermission / "Get Module Permissions"
```

If the current database does not support `Get User Menu Rights`, provider may build equivalent menu data from approved user/group/module permission branches, but controller/application contracts must stay unchanged.

---

# 3. Sample Menu Structure

Use the sample group/module data from:

```text
frmAddNewGroup-angular-api-migration-context.md
frmModuleMaster-angular-api-migration-context.md
frmGrpPermission-angular-api-migration-context.md
```

Expected top-level menu:

```text
Dashboard
Admin Master
Equilization Master
```

Administrator menu:

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

Admin Maker menu:

```text
Admin Master
  Groups
  User
  Module
```

Admin Checker menu:

```text
Admin Master
  Authorize Group
  Authorize User
  Authorize Group Permissions
```

Equilization Maker menu:

```text
Dashboard
Equilization Master
  Mutual Fund Master
  Scheme Type Master
  Scheme Master
  Plan Master
```

---

# 4. Route Mapping

Recommended route mapping:

| Menu | Route |
| --- | --- |
| Dashboard | `/dashboard` |
| Groups | `/administration/groups` |
| Authorize Group | `/administration/approvals/groups` |
| User | `/administration/users` |
| Authorize User | `/administration/approvals/users` |
| Module | `/administration/modules` |
| Module Permissions | `/administration/permissions` |
| Authorize Group Permissions | `/administration/approvals/group-permissions` |
| Mutual Fund Master | `/equilization/mutual-funds` |
| Scheme Type Master | `/equilization/scheme-types` |
| Scheme Master | `/equilization/schemes` |
| Plan Master | `/equilization/plans` |

Routes not yet implemented should show a controlled "coming soon" or `NotFound/Unauthorized` state, not a broken link.

---

# 5. Layout Behavior

`ApplicationShellComponent` should:

```text
load session/menu on init through AuthStore.loadSession()
render top-level enabled menu items
render child menu items under parent menus
hide disabled menu items
use routerLink for navigation
show active route state
show signed-in user name/group/application group
provide Change Password action
provide Logout action
render router-outlet for pages
handle menu loading state
handle empty menu state
```

Menu clicks:

```text
If item has route and no children, navigate to route.
If item has children, expand/show submenu.
If item is disabled, do not navigate.
If route requires permission, permission guard validates before activation.
```

Do not perform business actions directly from menu click. Menu click only navigates to a page where the user performs actions.

---

# 6. AuthStore Requirements

AuthStore should hold:

```text
user
menuItems
isAuthenticated
loginLoading
sessionLoading
errorMessage
requiresPasswordChange
```

AuthStore actions:

```text
login(request)
loadSession()
refreshMenu()
logout()
openChangePassword()
completeForcedPasswordChange()
```

Storage:

```text
store JWT token in the existing token storage mechanism
store non-sensitive user profile if current target pattern already does so
do not store password, OTP, password hash, or password history
menu can be stored in memory and refreshed on page reload
```

---

# 7. API / Permission Enforcement

Frontend menu hiding is not security.

Each route/page/API action must also enforce:

```text
auth guard
permission guard
API authorization policy
application service permission check
stored procedure/business validation
```

If user manually enters a URL:

```text
not authenticated -> redirect to /login
authenticated but not permitted -> /unauthorized
permitted -> page loads
```

---

# 8. Change Password Integration

Profile/user menu should include:

```text
Change Password
Logout
```

Change Password opens the migrated `frmChangePassword` form as:

```text
Angular modal/dialog, or
dedicated account route if target UX prefers
```

Forced password change after login:

```text
LoginResponse.user.requiresPasswordChange = true
AuthStore blocks normal navigation
Layout or login page opens change-password modal
After successful change, AuthStore refreshes session/menu and routes to dashboard
```

---

# 9. Testing Checklist

```text
After login, menu items render from LoginResponse.menu.
Refreshing browser reloads user and menu through /api/auth/me + /api/auth/menu.
Admin sees Admin + Equilization menu per sample permission data.
Admin Maker sees maintenance menus but not authorization menus.
Admin Checker sees authorization menus but not maker maintenance menus.
Equilization Maker sees Equilization master menus.
Clicking a menu navigates to correct route.
Disabled menu item does not navigate.
Unauthorized manual URL goes to /unauthorized.
Logout calls API and clears user/token/menu.
Change Password opens from profile menu.
No password/OTP/hash data is stored in browser storage.
Layout works on desktop and mobile widths without overlapping menu text.
```

---

# 10. Final Rule

The Angular layout is the replacement for legacy MDI navigation. It must display menus from authenticated, approved DB permissions and route users to pages; it must not hardcode role-only access or perform business actions directly from the menu.
