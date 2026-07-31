# Angular UI Theme Revamp Implementation Plan

## Objective

Revamp `HDFC.PDFCoordinateMapper.WebV1` to use the compact enterprise admin theme described in `docs/Generic-UI-Theme.md` without changing business logic, API calls, stores, route behavior, form validation rules, payload mapping, or grid data mapping.

This is a visual/theme-only implementation plan.

## Current Project Reality

Verified local project facts:

```text
Angular app: HDFC.PDFCoordinateMapper.WebV1
Angular version: 18.x
UI stack: Angular Material, AG Grid ag-theme-quartz
Global stylesheet: src/styles.scss
Shell styles: inline styles in core/layout/application-shell.component.ts
Page styles: mostly inline styles in standalone page/dialog components
Current tokens: --hdfc-* variables in src/styles.scss
```

Implementation status:

```text
Started and applied on 2026-07-30.
HDFC light tokens added to src/styles.scss.
Global Material primary button and AG Grid theme overrides added.
Application shell updated to use HDFC header colors and white sidebar.
Login/dashboard/admin page/dialog color pass applied with CSS variables.
Business logic, API calls, stores, forms, and route behavior were not intentionally changed.
npm run build passed after sandbox escalation; remaining output is Angular budget warnings.
Manual browser QA is still required.
```

Pages/components in scope:

```text
src/app/core/layout/application-shell.component.ts
src/app/features/auth/login.page.ts
src/app/features/dashboard/dashboard.page.ts
src/app/features/administration/users/user-master.page.ts
src/app/features/administration/users/user-master-form.dialog.ts
src/app/features/administration/roles/role-master.page.ts
src/app/features/administration/roles/role-master-form.dialog.ts
src/app/features/administration/role-menu-access/role-menu-access.page.ts
src/app/features/administration/common-approval/common-approval.page.ts
src/app/features/administration/common-approval/common-approval-detail.dialog.ts
src/app/features/administration/common-approval/role-module-mapping.dialog.ts
shared confirmation/dialog components if styling is inconsistent
```

## Non-Negotiable Guardrails

Do not change:

```text
API endpoints
API payloads
NgRx Signal Store logic
route definitions or menu route mapping
auth/login/module/menu flow
form controls, validators, or submit behavior
AG Grid rowData/columnDefs business mapping
approval checkbox decision logic
role/menu/user/master save/delete/approve behavior
```

Allowed changes:

```text
CSS variables
global SCSS theme rules
component style blocks
class names used only for styling
Angular Material visual density/theming
AG Grid theme variables
button/icon visual treatment
dialog visual treatment
layout spacing, borders, colors, radius, typography
```

## Target Theme Direction

Apply a light, compact enterprise admin theme:

```text
White topbar
White sidebar
Light gray app background
HDFC red as primary action/accent
HDFC blue as secondary/heading brand color
Compact page headers
Dense grid rows
Clear grid borders
4px to 8px radius
Minimal card usage
No marketing-style authenticated pages
```

Use the supplied HDFC color system for this project. The first implementation should apply the `.light` values. Keep `.dark` documented for future use, but do not add a visible dark-mode toggle unless separately requested.  

## Token Strategy

Update `src/styles.scss` to introduce generic theme variables while preserving HDFC brand values.

Recommended HDFC light token block:

```scss
:root,
.light {
  --hdfc-header-bg: #00539f;
  --hdfc-header-bg-hover: #004785;
  --hdfc-header-text: #ffffff;
  --hdfc-header-outline: rgba(255, 255, 255, 0.55);
  --hdfc-logo-red: #e31837;
  --hdfc-logo-blue: #00539f;

  --mat-sys-primary: #004a8f;
  --mat-sys-surface-tint: #004a8f;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-primary-container: #0072ce;
  --mat-sys-on-primary-container: #ffffff;
  --mat-sys-secondary: #6b7280;
  --mat-sys-on-secondary: #ffffff;
  --mat-sys-secondary-container: #e6f0fa;
  --mat-sys-on-secondary-container: #004a8f;
  --mat-sys-tertiary: #e31837;
  --mat-sys-on-tertiary: #ffffff;
  --mat-sys-tertiary-container: #fde8eb;
  --mat-sys-on-tertiary-container: #9b1220;
  --mat-sys-background: #f5f7fa;
  --mat-sys-on-background: #1a1a1a;
  --mat-sys-surface: #ffffff;
  --mat-sys-on-surface: #1a1a1a;
  --mat-sys-surface-variant: #eef2f7;
  --mat-sys-on-surface-variant: #6b7280;
  --mat-sys-outline: #d1d5db;
  --mat-sys-outline-variant: #e5e7eb;
  --mat-sys-shadow: rgba(0, 0, 0, 0.08);
  --mat-sys-inverse-surface: #1a1a1a;
  --mat-sys-inverse-on-surface: #ffffff;
  --mat-sys-inverse-primary: #0072ce;
  --mat-sys-surface-container: #f1f5f9;
  --mat-sys-surface-container-high: #e2e8f0;
  --mat-sys-surface-container-highest: #cbd5e1;

  --app-primary: var(--mat-sys-primary);
  --app-primary-dark: #003b71;
  --app-primary-soft: var(--mat-sys-secondary-container);
  --app-secondary: var(--mat-sys-tertiary);
  --app-heading: var(--mat-sys-on-background);
  --app-ink: var(--mat-sys-on-surface);
  --app-muted: var(--mat-sys-on-surface-variant);
  --app-surface: var(--mat-sys-surface);
  --app-background: var(--mat-sys-background);
  --app-muted-surface: var(--mat-sys-surface-variant);
  --app-border: var(--mat-sys-outline);
  --app-grid-border: var(--mat-sys-outline-variant);
  --app-grid-border-strong: var(--mat-sys-outline);
  --app-primary-row-hover: #f3f8fd;
}
```

Keep existing `--hdfc-*` tokens during migration or alias them to `--app-*` to avoid a risky big-bang edit:

```scss
:root {
  --hdfc-red-600: var(--app-primary);
  --hdfc-red-700: var(--app-primary-dark);
  --hdfc-red-050: var(--app-primary-soft);
  --hdfc-blue-900: var(--app-secondary);
  --hdfc-ink-900: var(--app-heading);
  --hdfc-ink-700: var(--app-ink);
  --hdfc-ink-500: var(--app-muted);
  --hdfc-border: var(--app-border);
  --hdfc-page: var(--app-background);
  --hdfc-surface: var(--app-surface);
}
```

Optional future dark token block:

```scss
.dark {
  --hdfc-header-bg: #003b71;
  --hdfc-header-bg-hover: #00539f;
  --hdfc-header-text: #ffffff;
  --hdfc-header-outline: rgba(255, 255, 255, 0.5);
  --hdfc-logo-red: #e31837;
  --hdfc-logo-blue: #0072ce;

  --mat-sys-primary: #0072ce;
  --mat-sys-surface-tint: #0072ce;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-primary-container: #004a8f;
  --mat-sys-on-primary-container: #ffffff;
  --mat-sys-secondary: #d1d5db;
  --mat-sys-on-secondary: #111827;
  --mat-sys-secondary-container: #1f2937;
  --mat-sys-on-secondary-container: #e5e7eb;
  --mat-sys-tertiary: #e31837;
  --mat-sys-on-tertiary: #ffffff;
  --mat-sys-background: #0b1220;
  --mat-sys-on-background: #e5e7eb;
  --mat-sys-surface: #111827;
  --mat-sys-on-surface: #e5e7eb;
  --mat-sys-surface-variant: #374151;
  --mat-sys-on-surface-variant: #d1d5db;
  --mat-sys-outline: #6b7280;
  --mat-sys-inverse-surface: #e5e7eb;
  --mat-sys-inverse-on-surface: #111827;
  --mat-sys-inverse-primary: #004a8f;
}
```

## Global Styles Plan

In `src/styles.scss`:

1. Keep Angular Material and AG Grid imports.
2. Add HDFC `.light` tokens and generic `--app-*` aliases.
3. Add/standardize base element rules:

```scss
html,
body {
  height: 100%;
  margin: 0;
}

body {
  background: var(--app-background);
  color: var(--app-ink);
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
  font-size: 14px;
  letter-spacing: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

4. Add shared visual utility classes:

```scss
.app-primary-button
.app-grid
.ag-icon-action
.app-dialog
.page-alert / .alert success/error variants if reused
```

5. Add AG Grid global density/theme overrides.

## Angular Material Theme Plan

Because this project is Angular 18, verify compatibility before using the Angular 20 style `mat.theme` snippet from the context.

Conservative first pass:

```text
Keep current prebuilt indigo-pink import initially.
Use CSS variables and Material CSS custom properties for buttons/snackbars/dialogs.
Only introduce @use '@angular/material' as mat if build confirms compatibility and it does not create churn.
```

Primary buttons should use a shared class:

```scss
.app-primary-button {
  --mdc-filled-button-container-color: var(--app-primary);
  --mdc-filled-button-label-text-color: #ffffff;
  font-weight: 600;
}

.app-primary-button:hover {
  --mdc-filled-button-container-color: var(--app-primary-dark);
}
```

## Shell Revamp Plan

File:

```text
src/app/core/layout/application-shell.component.ts
```

Change styles only:

```text
Topbar background: white
Topbar text: app ink
Topbar height: 56px
Topbar border-bottom: 1px solid app border
Brand mark: primary red background, white text, 4px radius
App title: app heading color
Logout button: compact stroked style with app border/ink
Sidebar: white, 248px current width can remain unless UX asks for 282px
Sidebar border-right: app border
Content background: app background
Content padding: 16px 22px
Active menu: app-primary-soft background, app-primary-dark text, 3px app-primary left border
Hover menu: soft primary hover
Collapsed sidebar behavior unchanged
Parent expand/collapse behavior unchanged
```

Do not change:

```text
hasSidebarMenu()
toggleSidebar()
toggleNode()
onParentMenuClick()
logout()
routerLink/routerLinkActive behavior
menu tree rendering logic
```

## Login Page Plan

File:

```text
src/app/features/auth/login.page.ts
```

Apply stronger but still enterprise visual design:

```text
Full viewport login shell
Left brand/identity panel on desktop
Right login card
Primary red accent strip
HDFC blue/heading background accents
White form card
8px radius
Clear error state
Compact fields/buttons
```

Do not change:

```text
AuthService calls
AuthStore interactions
form controls/validators
login submit flow
redirect/module-load behavior
```

## Page Layout Plan

Apply a common style pattern to:

```text
user-master.page.ts
role-master.page.ts
role-menu-access.page.ts
common-approval.page.ts
dashboard.page.ts where applicable
```

Target pattern:

```text
Page root fills available content height.
Page header is compact, not hero-like.
Breadcrumb text is muted and small.
H1 uses app heading color, 20px-22px.
Header actions use compact icon/primary buttons.
Grid shell fills remaining page height.
No nested cards.
No oversized empty whitespace.
```

Do not change:

```text
row data signals
column definitions
cell click handlers
dialog open logic
tab selection logic
store calls
```

## User Master Specific Plan

Files:

```text
src/app/features/administration/users/user-master.page.ts
src/app/features/administration/users/user-master-form.dialog.ts
```

Visual changes:

```text
Keep tabs directly after "Users" title, as already requested.
Use app-primary for active tab indicator.
Use app-border for tab header line.
Keep grid height fitting page.
Use app-grid global density.
Use app-primary-button for Add User.
Use compact AG Grid action buttons styled by .ag-icon-action or equivalent.
Dialog form sections keep dense grid layout, but use app-heading/app-muted colors.
```

Do not change User Master business rules, especially:

```text
Table and Table1 independent dataset mapping
Active dropdown value/code mapping
Role dropdown source
Save payload
Delete confirmation flow
```

## Role Master And Module/Menu Access Plan

Files:

```text
src/app/features/administration/roles/role-master.page.ts
src/app/features/administration/roles/role-master-form.dialog.ts
src/app/features/administration/role-menu-access/role-menu-access.page.ts
```

Visual changes:

```text
Align headers, actions, grids, dialogs with User Master.
Keep role modal menu grid scroll behavior as currently accepted.
Keep AG Grid search/filter controls styled but behavior unchanged.
Use same grid shell and action button treatment.
```

Do not change:

```text
Role save/update payload
menuaccess comma-separated id handling
role menu store/API call chain
module master grid-only requirement
```

## Master Authentication Plan

Files:

```text
src/app/features/administration/common-approval/common-approval.page.ts
src/app/features/administration/common-approval/common-approval-detail.dialog.ts
src/app/features/administration/common-approval/role-module-mapping.dialog.ts
```

Visual changes:

```text
Use common page header/grid shell.
Style master dropdown and refresh action consistently.
Style approval detail dialog as dense operational dialog.
Keep approve/reject all checkboxes in AG Grid floating filter row.
Center decision column checkboxes.
Use app-primary for approve checkbox accent unless business wants green/red.
```

Do not change:

```text
CommonApprovalStore API flow
approve/reject decision logic
filtered-row bulk checkbox behavior
role module mapping read-only behavior
```

## AG Grid Plan

Global AG Grid style in `src/styles.scss`:

```scss
.ag-theme-quartz {
  --ag-font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
  --ag-font-size: 13px;
  --ag-row-height: 34px;
  --ag-header-height: 36px;
  --ag-floating-filters-height: 34px;
  --ag-pagination-panel-height: 42px;
  --ag-wrapper-border-radius: 0;
  --ag-header-foreground-color: var(--app-ink);
  --ag-border-color: var(--app-grid-border);
  --ag-row-border-color: var(--app-grid-border);
  --ag-cell-horizontal-border: 1px solid var(--app-grid-border);
  --ag-row-hover-color: var(--app-primary-row-hover);
  --ag-selected-row-background-color: var(--app-primary-soft);
}
```

Also add:

```text
Header/cell right borders
Clear pagination top border
Compact square action icons
Consistent checkbox accent color
```

Do not change:

```text
paginationPageSize values unless separately requested
row model
column generation logic
valueGetter behavior
cell click behavior
```

## Dialog Plan

Apply visual consistency to all dialogs:

```text
White surface
8px radius
Soft shadow
Compact title
Dense form grid
Muted section headings
Primary submit button
Consistent error/success strips
No horizontal overflow
```

Prefer adding a global `panelClass: 'app-dialog'` only if it does not require touching many business methods. Otherwise style dialog internals locally first.

## Implementation Phases

### Phase 1 - Theme Foundation

Files:

```text
src/styles.scss
```

Tasks:

```text
Add HDFC light theme tokens and --app-* aliases.
Alias existing --hdfc-* tokens to --app-* where safe.
Add base body/font/button rules.
Add app-primary-button.
Add AG Grid global theme rules.
Add ag-icon-action.
Add snackbar/dialog shared color rules.
Run npm run build.
```

Acceptance:

```text
App builds.
No component logic changed.
Existing screens still render.
Colors begin using generic app tokens.
```

### Phase 2 - Shell

File:

```text
application-shell.component.ts
```

Tasks:

```text
Change topbar to white.
Update brand/app title styling.
Update sidebar active/hover states.
Update content padding/background.
Keep responsive/collapsed behavior unchanged.
Run npm run build.
```

Acceptance:

```text
Module card flow still shows no sidebar before module selection.
Sidebar appears after module selection.
Menu expansion/collapse still works.
Route navigation still works.
```

### Phase 3 - Login And Dashboard

Files:

```text
login.page.ts
dashboard.page.ts
```

Tasks:

```text
Apply login card/brand panel theme.
Make module cards quieter and compact.
Use shared tokens.
Run npm run build.
```

Acceptance:

```text
Login works unchanged.
Module selection still triggers menu API and first known route navigation.
```

### Phase 4 - Master Pages

Files:

```text
user-master.page.ts
role-master.page.ts
role-menu-access.page.ts
common-approval.page.ts
```

Tasks:

```text
Normalize page header styling.
Normalize header action buttons.
Normalize grid shell height/border/radius.
Replace local hardcoded colors with app tokens.
Keep generated columns and store calls untouched.
Run npm run build.
```

Acceptance:

```text
User Master All/Approved tabs remain correct.
Role Master save/menu selection remains correct.
Module/Role Menu Access grid remains correct.
Master Authentication route and grids remain correct.
```

### Phase 5 - Dialogs

Files:

```text
user-master-form.dialog.ts
role-master-form.dialog.ts
common-approval-detail.dialog.ts
role-module-mapping.dialog.ts
confirm dialog component
```

Tasks:

```text
Apply consistent dialog surface/layout.
Use app tokens for headings, alerts, borders.
Keep form controls and submit methods untouched.
Run npm run build.
```

Acceptance:

```text
Create/edit/view dialogs work.
Approval detail decision checkboxes work.
Confirm dialogs still return the same values.
```

### Phase 6 - Visual QA

Manual browser QA:

```text
Login page desktop/mobile.
Authorized module cards before module selection.
Sidebar after module selection.
User Master grid and form.
Role Master grid and role modal menu grid.
Module/Role Menu Access grid.
Master Authentication summary/detail/mapping dialogs.
Responsive width around 760px.
No text overflow in buttons/cards/dialogs.
No unwanted vertical scrollbar on pages where grid should fill.
```

Technical QA:

```text
npm run build
Search for accidental business logic changes in touched files.
Check browser console for styling/runtime errors.
If possible, screenshot before/after critical screens.
```

## Risk Areas

```text
Inline component styles make large visual edits easy to mix with logic; edit styles only.
AG Grid global variables can affect all grids; test every grid after Phase 1.
ApplicationShell component has behavior and style in one file; avoid touching methods.
Dialog layout changes can create overflow; test at modal widths already used.
Material theme API differs between Angular 18 and Angular 20; avoid adopting incompatible Angular 20-only snippets blindly.
```

## Completion Checklist

```text
Global tokens added and used.
Shell updated to white topbar/sidebar theme.
Login page visually aligned.
All admin pages share compact header/grid shell.
AG Grid styling consistent across pages.
Dialogs visually consistent.
No API/store/business logic changed.
npm run build passes.
Context remains valid for future UI-only work.
```
