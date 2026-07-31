# Generic UI Theme Context

Use this document as the implementation context for applying the same UI theme in another Angular project. The layout, spacing, component structure, and grid treatment should remain the same. Only the brand/theme colors should change per project.

## Current Stack

- Angular 20
- Angular Material
- AG Grid with `ag-theme-quartz`
- Global SCSS theme tokens in `src/styles.scss`
- Page-level SCSS for shell, login, master pages, approval pages, and dialogs

## Theme Goal

Create a compact enterprise admin UI with:

- Light theme only
- White topbar and sidenav
- Subtle light gray app background
- Strong brand primary color for active states and main actions
- Compact page headers
- Dense AG Grid tables with clear borders
- Minimal cards, mostly used for login or dialog surfaces
- Consistent 4px to 8px border radius
- No marketing-style hero sections inside the authenticated app

## Theme Tokens

In the target project, define generic CSS variables first. Keep component SCSS referencing these variables so only this token block needs to change for a new brand.

Add this in `src/styles.scss` or the target app's global stylesheet:

```scss
:root {
  --app-primary: #ed1c24;
  --app-primary-dark: #b5121b;
  --app-primary-soft: #fdedee;
  --app-secondary: #174a8b;
  --app-heading: #0b1f3a;
  --app-ink: #1f2933;
  --app-muted: #5b6673;
  --app-surface: #ffffff;
  --app-background: #f6f7f9;
  --app-muted-surface: #eef1f5;
  --app-border: #d8dee6;
  --app-grid-border: #d9dce1;
  --app-grid-border-strong: #b8bdc7;
  --app-primary-row-hover: #fff1f1;
}
```

Map the existing project colors like this:

| Existing token | Generic token |
| --- | --- |
| `--kotak-red` | `--app-primary` |
| `--kotak-red-dark` | `--app-primary-dark` |
| `--kotak-red-soft` | `--app-primary-soft` |
| `--kotak-blue` | `--app-secondary` |
| `--kotak-navy` | `--app-heading` |
| `--kotak-ink` | `--app-ink` |
| `--kotak-muted` | `--app-muted` |
| `--kotak-surface` | `--app-surface` |
| `--kotak-subtle` | `--app-background` |
| `--kotak-muted-surface` | `--app-muted-surface` |
| `--kotak-border` | `--app-border` |
| `--eq-border` | `--app-grid-border` |
| `--eq-border-strong` | `--app-grid-border-strong` |
| `--eq-primary-soft` | `--app-primary-row-hover` |

## Angular Material Theme

Keep Material density compact and typography consistent.

Add or update this in `src/styles.scss`:

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light;
  @include mat.theme((
    color: (
      primary: mat.$red-palette,
      tertiary: mat.$azure-palette
    ),
    typography: (
      plain-family: ('Inter', 'Segoe UI', Roboto, Arial, sans-serif),
      brand-family: ('Inter', 'Segoe UI', Roboto, Arial, sans-serif)
    ),
    density: -1
  ));
}
```

For another brand, change the Material palette to the closest Angular Material palette, then control exact brand color through CSS variables.

## Global Base Styles

Add these globally:

```scss
* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
}

body {
  font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
  color: var(--app-ink);
  background: var(--app-background);
  letter-spacing: 0;
}

button,
input {
  font: inherit;
}
```

## Primary Button

Use one shared class for primary filled buttons:

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

In templates:

```html
<button mat-flat-button class="app-primary-button" type="button">
  <mat-icon>verified</mat-icon>
  Submit
</button>
```

## Shell Layout

Apply this pattern to the authenticated app shell.

Files in this project:

- `src/app/layout/application-shell.component.html`
- `src/app/layout/application-shell.component.scss`

Theme structure:

- Root shell uses full viewport height.
- Topbar is 56px tall, white, sticky, with bottom border.
- Brand mark uses primary color and white text.
- Sidenav is white with right border.
- Active menu item uses `--app-primary-soft`, `--app-primary-dark`, and a 3px left border using `--app-primary`.
- Main content uses `--app-background` and `padding: 16px 22px`.

Important shell styles:

```scss
.topbar {
  height: 56px;
  min-height: 56px;
  background: #ffffff;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-ink);
}

.brand {
  padding: 4px 12px;
  background: var(--app-primary);
  color: #ffffff;
  border-radius: 4px;
  font-weight: 700;
}

.app-title {
  font-weight: 700;
  color: var(--app-heading);
  white-space: nowrap;
}

.sidenav {
  width: 282px;
  background: #ffffff;
  border-right: 1px solid var(--app-border);
}

.menu a.active,
.group-label.active {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  border-left: 3px solid var(--app-primary);
}

.content {
  height: 100%;
  min-height: 0;
  padding: 16px 22px;
  background: var(--app-background);
  overflow: hidden;
}
```

## Page Layout

Use the same layout for all master, approval, and list pages.

Files in this project:

- `src/app/administration/users/user-master.page.*`
- `src/app/administration/groups/group-master.page.*`
- `src/app/administration/modules/module-master.page.*`
- `src/app/administration/user-approval/user-approval.page.*`
- `src/app/administration/group-approval/group-approval.page.*`
- `src/app/administration/group-permission-approval/group-permission-approval.page.*`
- `src/app/administration/group-permissions/group-permissions.page.*`

Base page pattern:

```html
<header class="page-header">
  <div>
    <h1>Page Title</h1>
    <p>Short page description.</p>
  </div>
  <button mat-flat-button class="app-primary-button" type="button">
    <mat-icon>add</mat-icon>
    Add
  </button>
</header>

<section class="grid-shell">
  <ag-grid-angular
    class="ag-theme-quartz app-grid"
    theme="legacy"
    [rowData]="rows()"
    [columnDefs]="columnDefs"
    [defaultColDef]="defaultColDef"
    [pagination]="true"
    [paginationPageSize]="10"
    [paginationPageSizeSelector]="[10, 25, 50]"
  />
</section>
```

Base page SCSS:

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 10px;
}

h1 {
  margin: 0;
  color: var(--app-heading);
  font-size: 22px;
}

p {
  margin: 4px 0 0;
  color: var(--app-muted);
  font-size: 13px;
}

.grid-shell {
  flex: 1 1 auto;
  min-height: 0;
  border: 1px solid var(--app-border);
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
}

.app-grid {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  --ag-row-height: 34px;
  --ag-header-height: 36px;
  --ag-floating-filters-height: 34px;
  --ag-pagination-panel-height: 42px;
}
```

## Approval Toolbar

For approval pages, place the toolbar between the page header and grid.

```html
<div class="approval-toolbar">
  <mat-checkbox>Approve All</mat-checkbox>
  <mat-checkbox>Reject All</mat-checkbox>
  <span>0 selected</span>
</div>
```

```scss
.approval-toolbar {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 36px;
  margin-bottom: 8px;
  color: var(--app-ink);
  font-size: 13px;
}
```

## All / Approved Tabs Variant

If the target project has tabs named `All` and `Approved`, keep the same page header and grid shell. Add the tab bar between the page header and any toolbar/grid.

Recommended Angular Material structure:

```html
<header class="page-header">
  <div>
    <h1>Authorize Items</h1>
    <p>Review all requests and approved records.</p>
  </div>
</header>

<mat-tab-group class="status-tabs" animationDuration="120ms" mat-stretch-tabs="false">
  <mat-tab label="All">
    <ng-container *ngTemplateOutlet="gridContent"></ng-container>
  </mat-tab>
  <mat-tab label="Approved">
    <ng-container *ngTemplateOutlet="gridContent"></ng-container>
  </mat-tab>
</mat-tab-group>

<ng-template #gridContent>
  <section class="grid-shell tab-grid-shell">
    <ag-grid-angular
      class="ag-theme-quartz app-grid"
      theme="legacy"
      [rowData]="rows()"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [pagination]="true"
    />
  </section>
</ng-template>
```

Recommended tab SCSS:

```scss
.status-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:host ::ng-deep .status-tabs .mat-mdc-tab-header {
  margin-bottom: 8px;
  border-bottom: 1px solid var(--app-border);
}

:host ::ng-deep .status-tabs .mat-mdc-tab {
  min-width: 112px;
  height: 38px;
  padding: 0 18px;
  font-weight: 600;
}

:host ::ng-deep .status-tabs .mdc-tab--active .mdc-tab__text-label {
  color: var(--app-primary-dark);
}

:host ::ng-deep .status-tabs .mat-mdc-tab-group,
:host ::ng-deep .status-tabs .mat-mdc-tab-body-wrapper,
:host ::ng-deep .status-tabs .mat-mdc-tab-body,
:host ::ng-deep .status-tabs .mat-mdc-tab-body-content {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.tab-grid-shell {
  height: 100%;
}
```

Use the same grid columns where possible. Only change data filtering:

- `All`: show all rows returned by the page API.
- `Approved`: show rows where status/decision equals approved.

## AG Grid Theme

Add this globally in `src/styles.scss`:

```scss
@import 'ag-grid-community/styles/ag-grid.css';
@import 'ag-grid-community/styles/ag-theme-quartz.css';

.ag-theme-quartz {
  --ag-font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
  --ag-font-size: 13px;
  --ag-wrapper-border-radius: 0;
  --ag-header-foreground-color: var(--app-ink);
  --ag-border-color: var(--app-grid-border);
  --ag-row-border-color: var(--app-grid-border);
  --ag-cell-horizontal-border: 1px solid var(--app-grid-border);
  --ag-header-column-separator-display: block;
  --ag-header-column-separator-color: var(--app-grid-border);
  --ag-header-column-resize-handle-color: var(--app-grid-border);
  --ag-row-hover-color: var(--app-primary-row-hover);
  --ag-selected-row-background-color: var(--app-primary-soft);
  --ag-odd-row-background-color: #fcfcfd;
  --ag-input-focus-border-color: var(--app-primary);
  --ag-range-selection-border-color: var(--app-primary);
}

.ag-theme-quartz .ag-root-wrapper {
  border: 1px solid var(--app-grid-border);
  background: #ffffff;
}

.ag-theme-quartz .ag-header-cell,
.ag-theme-quartz .ag-cell {
  border-right: 1px solid var(--app-grid-border);
}

.ag-theme-quartz .ag-header-cell-label {
  font-weight: 650;
}

.ag-theme-quartz .ag-row {
  border-bottom: 1px solid var(--app-grid-border);
}

.ag-theme-quartz .ag-paging-panel {
  min-height: 42px;
  border-top: 1px solid var(--app-grid-border);
  color: var(--app-ink);
  font-size: 12px;
}
```

## Grid Icon Actions

Use compact square icon buttons in grid cells.

```scss
.ag-icon-action {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-grid-border);
  border-radius: 4px;
  color: var(--app-primary);
  background: #ffffff;
  cursor: pointer;
  vertical-align: middle;
}

.ag-icon-action:hover {
  border-color: var(--app-primary);
  background: var(--app-primary-row-hover);
}
```

## Login Page

Files in this project:

- `src/app/auth/login.page.html`
- `src/app/auth/login.page.scss`

Keep the login page visually stronger than inner app screens:

- Full viewport layout
- Two-column desktop layout
- Brand panel on the left
- Login card on the right
- Primary color accent strip on the login card
- Dark brand gradient background may use heading/secondary colors

Only change:

- Brand mark text
- Primary color
- Dark gradient colors, if needed

## Dialogs

Files in this project:

- `src/app/administration/users/user-form-dialog.component.*`
- `src/app/administration/groups/group-form-dialog.component.*`
- `src/app/administration/modules/module-form-dialog.component.*`
- Approval confirm/details dialogs under `src/app/administration/*approval/*dialog*.ts`

Dialog rules:

- White dialog surface
- 8px radius
- Soft shadow
- Error/warning blocks use primary-soft and primary-dark where they represent validation or failure
- Dense form layout

Global dialog surface example:

```scss
.app-dialog .mat-mdc-dialog-container,
.app-dialog .mat-mdc-dialog-surface {
  background: #ffffff;
  overflow-x: hidden;
}

.app-dialog .mat-mdc-dialog-surface {
  border-radius: 8px;
  box-shadow: 0 18px 42px rgba(11, 31, 58, 0.22);
}
```

## Where To Add Or Change Theme In Another Project

Add or update these areas:

1. `src/styles.scss`
   - Angular Material theme configuration
   - Generic `:root` CSS variables
   - Body font/background
   - Primary button class
   - AG Grid theme overrides
   - Grid icon action class
   - Global dialog surface classes

2. App shell component SCSS
   - Topbar
   - Brand mark
   - App title
   - Sidenav
   - Profile/avatar block
   - Menu hover and active states
   - Main content background/padding
   - Top notification styles

3. Login page SCSS
   - Full-page background
   - Brand mark
   - Login card radius/shadow
   - Card accent strip
   - Success/error message colors

4. Master/list page SCSS
   - `:host` full-height flex layout
   - `.page-header`
   - `h1` and `p`
   - `.grid-shell`
   - Page-specific AG Grid height variables

5. Approval page SCSS
   - Same master/list styles
   - `.approval-toolbar`
   - `.page-error`
   - Approve/reject button styles if not handled by Material defaults

6. Tabbed pages with `All` and `Approved`
   - Add `.status-tabs`
   - Add tab header border and active label color
   - Ensure tab body and grid shell fill available height
   - Filter data by tab without changing the visual grid structure

7. Dialog component SCSS
   - Header text color
   - Body text color
   - Muted helper text
   - Error/validation blocks
   - Dialog action buttons

8. Renderer components
   - Grid action buttons
   - Radio/checkbox accent color
   - View/details link color

## Color Replacement Checklist

When implementing the same theme with a different color:

- Change `--app-primary`
- Change `--app-primary-dark`
- Change `--app-primary-soft`
- Change `--app-primary-row-hover`
- Change `--app-secondary`, if the login/shell gradient needs a second brand color
- Keep neutral colors unless the other project already has approved neutral tokens
- Keep all spacing, border, density, radius, and grid sizing unchanged

## Implementation Notes

- Prefer generic class names like `.app-primary-button` instead of project-specific names.
- Keep tabs outside the grid shell; the grid shell should frame only the grid.
- Avoid card-heavy layouts for admin pages.
- Keep the authenticated app dense and work-focused.
- Use Material icons inside buttons.
- Keep AG Grid `theme="legacy"` if using the current AG Grid setup from this project.
- Keep `paginationPageSize` at `10` with selector `[10, 25, 50]` unless the target project already has a business rule.
