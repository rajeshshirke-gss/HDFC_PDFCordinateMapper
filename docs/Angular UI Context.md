# Generic Angular UI Standard Context
This context is reusable for Angular UI migration or new Angular UI development across projects.
It intentionally avoids page-specific business rules. Use it before starting any page or feature.
---
# 1. First Principle
Do not start UI development from screen appearance alone.
Before coding, first understand the backend contract:
```text
1. Identify the API endpoint or stored procedure/table contract.
2. Identify request parameters, required fields, optional fields, and default values.
3. Identify response shape, status fields, DB messages, validation messages, and error format.
4. Identify whether pagination, filtering, sorting, and authorization are handled by DB/API or UI.
5. Identify dropdown/list source data and confirm it comes from DB/API.
6. Identify create/update/delete approval workflow, if any.
7. Identify date, number, boolean, status, and lookup value formats.
8. Only after the contract is understood, design Angular models, services, components, and grid columns.
```
If DB/API pagination is not implemented, use client-side pagination in the grid.
Do not change stored procedures unless explicitly instructed.
Do not hardcode fallback/sample data. If API/DB fails, show the error and keep the UI empty.
---
# 2. Required Discovery Before Development
For each page, gather this information first:
```text
Page name
Route
Legacy screen or existing page reference
User roles/permissions
List/search API or DB contract
Create API or DB contract
Update API or DB contract
Delete/disable API or DB contract
Authorize/approve/reject API or DB contract
Dropdown APIs or DB sources
Request payload examples
Response payload examples
Success message source
Error message source
Pagination owner: DB/API/UI
Filtering owner: DB/API/UI
Sorting owner: DB/API/UI
Date/time format
Required fields
Field length rules
Unique-field rules
Maker/checker approval rules
```
If any required contract is missing, inspect API code, stored procedure branches, tables, or legacy form logic before implementing.
Ask questions only when:
```text
The backend contract cannot be discovered.
There are multiple conflicting backend contracts.
The user asks for theme/branding change.
The change could require DB/SP modification and the user has not approved DB/SP changes.
```
Do not ask routine UI questions when the standard below already defines the answer.
---
# 3. Angular Project Structure
Use a feature-based structure:
```text
src/app/
  auth/
  layout/
  shared/
  administration/
    feature-name/
      feature.models.ts
      feature-api.service.ts
      feature.page.ts
      feature.page.html
      feature.page.scss
      feature-form-dialog.component.ts
      feature-form-dialog.component.html
      feature-form-dialog.component.scss
```
For authorization pages:
```text
feature-approval.page.ts
feature-approval.page.html
feature-approval.page.scss
```
For shared behavior:
```text
shared/notification.service.ts
shared/confirmation-dialog.component.ts
shared/date-format helpers, if already present
```
Keep feature-specific API calls inside that feature's API service.
Keep component files focused on UI state and interaction, not backend parsing.
---
# 4. API Service Rules
Every feature must use an Angular API service.
The API service must:
```text
Own endpoint URLs.
Build HttpParams.
Normalize request payloads before submit.
Map API success response to typed data.
Surface DB/API success messages to top snackbar.
Surface DB/API error messages to top snackbar.
Never return sample/fallback rows.
Never swallow errors silently.
```
Standard response handling:
```text
If response.success is false:
  show response.message from DB/API
  throw an Error for the component
If HTTP request fails:
  show error.error.message if present
  otherwise show a clear feature-specific error
If response.data is null for a required data call:
  treat it as an error unless the endpoint explicitly returns null as valid behavior
```
Example responsibilities:
```text
search(filters): Observable<ListResult>
create(request): Observable<Item>
update(id, request): Observable<Item>
approve(request): Observable<ActionResult>
reject(request): Observable<ActionResult>
dropdowns(): Observable<Lookup[]>
```
---
# 5. Models
Create typed models before implementing UI.
Models must reflect the real API/DB contract:
```text
List item model
Search/filter model
Create request model
Update request model
Approval request model
Dropdown/lookup model
API list result model
```
Rules:
```text
Use string | null for nullable strings returned by API.
Use number | null for nullable numeric fields.
Use boolean only when API truly returns boolean.
Use string for date values returned as ISO/string.
Format dates in UI, not by mutating raw response data.
Do not add fields only because the UI would be convenient; confirm backend supports them.
```
---
# 6. Layout Standard
Use the application shell:
```text
Top toolbar
Left sidebar
Main content area
Top snackbar/notification below navbar
Routed page content
```
Sidebar rules:
```text
Authorized modules come from `POST /api/welcome/GetData` after login/page load.
Before module selection, show authorized modules as cards and do not display the sidebar.
Menus come from `POST /api/Menu/getmenu` only after the user selects an authorized module.
After menu load, show the sidebar and navigate to the first returned menu route that matches an implemented Angular route.
Do not hardcode route/icon/order decisions in API when DB owns menu metadata.
Parent menu order should come from menu/module order metadata.
Child menu order should come from menu/module order metadata.
Parent menu icon should come from menu/module icon metadata.
Child menu icon should come from menu/module icon metadata.
When sidebar is collapsed, clicking a parent icon should expand the sidebar and show submenus.
Parent menu collapse/expand state must work independently.
Sidebar collapse/expand control belongs in the top navbar hamburger icon.
Menu adapter must support legacy API fields such as `menU_ID`, `parenT_ID`, `caption`, `value`, `url`, `menU_SEQUENCE`, `icon`, `actionname`, `controllername`, `moduleid`, `rights`, and `hide`.
```
Page content rules:
```text
Use the actual functional screen as the first view.
Do not create landing/hero pages for operational admin tools.
Keep operational pages dense, clear, and work-focused.
Avoid marketing-style cards, decorative sections, and large empty headers.
Do not nest UI cards inside UI cards.
```
---
# 7. Theme Standard
Default theme should follow the existing Kotak-style operational standard unless user asks for a theme change.
Default visual language:
```text
White page/content backgrounds
Kotak red for primary actions and important active states
Dark navy/ink for headings
Muted grey text for secondary descriptions
Compact Material controls
Small border radius, usually 4px to 8px
AG Grid styled to look clean and readable
No dull unstyled grid look
No excessive gradients
No decorative orbs/blobs
No oversized cards for internal admin pages
```
Questions should be asked only for theme changes:
```text
Different brand colors
Dark mode
Different typography
Different density
Different icon family
Different page layout philosophy
```
Do not ask theme questions when the default project standard is acceptable.
---
# 8. AG Grid Standard
Use AG Grid for list pages.
Required grid behavior:
```text
Use AG Grid floating filters.
Use AG Grid built-in pagination footer.
Do not build separate search bars unless the backend contract explicitly requires global search outside the grid.
Do not build separate filter panels for standard column filters.
Do not build custom pagination footers.
Do not show record count strips unless explicitly required.
Do not show selected count unless selection is part of the workflow.
Grid must fill available page height.
Grid must not leave unnecessary blank space below it.
Grid must not create outer page vertical scroll for normal list pages.
Grid must avoid horizontal scroll where practical by using flex/minWidth carefully.
If horizontal scroll is unavoidable because of many columns, it must be inside the grid only.
```
Default grid settings:
```text
sortable: true
resizable: true
filter: agTextColumnFilter
floatingFilter: true
pagination: true
paginationPageSize: appropriate default such as 10, 20, or 25
suppress extra custom footer UI
```
Grid action columns:
```text
Use Material icons for edit/view/delete/approve/reject actions.
Use icon buttons with tooltips where useful.
Do not use plain text buttons for row actions when a familiar Material icon exists.
Keep action column width stable.
```
Master-list column rules:
```text
For WebV1 master pages, follow the completed User Master pattern.
Generate grid data columns from the actual response row keys for the active tab/view.
Keep command/action columns as UI-owned columns, separate from response fields.
Hide backend-only/sensitive fields such as password, moduleid, moduleaccessid, and equivalent access-mapping columns.
When a DataSet returns Table and Table1 as independent arrays, bind tabs/views directly to those tables; do not derive one tab by filtering another table.
```
Date columns:
```text
Display as dd-MM-yyyy HH:MM:SS.
Do not use ambiguous locale-only date formatting.
Handle null/empty dates as blank.
```
Empty/error states:
```text
If no data is returned, show grid empty state.
If API/DB fails, show snackbar error and keep rows empty.
Never inject sample/fallback data.
```
---
# 9. Form And Modal Standard
Add/Edit forms should be Material dialogs unless the page context explicitly requires a full page.
Dialog rules:
```text
Use white dialog background.
Use compact Kotak-standard Material controls.
Use modal width large enough for controls to align cleanly.
No horizontal scroll inside dialog.
No clipped placeholders or labels.
No oversized controls.
Primary action on bottom right.
Reset and Close secondary actions near primary action.
Disable submit while saving.
Show validation errors before API call if client-side validation blocks submit.
Show API/DB messages through top snackbar or inline form error as appropriate.
```
Form field rules:
```text
Use backend-confirmed required fields.
Use backend-confirmed max lengths.
Use dropdowns only when values come from DB/API.
Do not hardcode dropdown values unless the values are true constants in the business contract.
Use number inputs for numeric fields.
Use date pickers only when user must choose dates.
Use textarea only for descriptions/remarks/comments.
```
Submit rules:
```text
Create button must always either call server or show a visible validation error.
Never allow a click to do nothing silently.
Normalize payload by trimming strings.
Convert empty optional strings to empty string or null based on API contract.
Use DB/API response message for success and failure display.
After successful create/update, close modal and refresh grid unless page requires staying open.
```
---
# 10. Authorization Page Standard
Authorization pages must follow maker/checker behavior from backend/legacy rules.
Approval/rejection controls:
```text
Use row-level approve/reject checkboxes when multiple rows can be authorized.
Approve All checks all row-level approve checkboxes and unchecks all reject checkboxes.
Reject All checks all row-level reject checkboxes and unchecks all approve checkboxes.
Row-level approve unchecks row-level reject for the same row.
Row-level reject unchecks row-level approve for the same row.
Do not allow both approve and reject for the same row.
```
Submit rules:
```text
Show Material confirmation dialog before submit.
Submit only selected approval/rejection decisions.
If nothing is selected, show validation message.
Display DB/API response message in top snackbar.
Refresh grid after successful submit.
```
---
# 11. Notifications
Use one consistent top snackbar/notification below the navbar.
Rules:
```text
Show success message from DB/API.
Show error message from DB/API.
Auto-hide after 5 seconds.
Allow manual close.
Use error tone for HTTP failures and business failures.
Do not show browser alerts.
Do not rely only on console errors.
```
---
# 12. Data Ownership Rules
The UI must not invent business data.
Rules:
```text
Dropdown data must come from DB/API.
Menu data must come from DB/API/session context.
Approval statuses must come from DB/API.
User/group/module IDs must come from DB/API or user input based on contract.
Default values must be confirmed by backend/context or explicitly requested by user.
```
Allowed UI defaults:
```text
Empty string for blank text search/filter fields.
First DB-provided dropdown option only when context says that is acceptable.
Current authenticated application group when backend context owns application group.
Explicit user-requested defaults, such as FA Equalization on login.
```
Not allowed:
```text
Sample fallback rows.
Hardcoded dropdown lists for DB-owned values.
Hardcoded route mappings when DB owns route metadata.
Hardcoded menu icons/order when DB owns menu metadata.
Silent fallback to fake data.
```
---
# 13. API/DB Contract Checklist
Before implementing a feature, fill this checklist:
```text
Feature:
Route:
Primary list endpoint/SP:
List request:
List response:
Create endpoint/SP:
Create request:
Create response:
Update endpoint/SP:
Update request:
Update response:
Delete/disable endpoint/SP:
Approval endpoint/SP:
Dropdown endpoints/SPs:
Pagination owner:
Filtering owner:
Sorting owner:
Date format:
Success message source:
Error message source:
Required fields:
Field max lengths:
Unique validations:
Authorization rules:
```
Do not proceed with UI implementation until the checklist is sufficiently understood.
---
# 14. Build And Verification
After implementation:
```text
Run Angular build.
Run API build if API contracts or backend code changed.
Verify the target API endpoint manually where practical.
Verify the page loads without console-blocking errors.
Verify create/update/submit sends the request to server.
Verify DB/API response messages are displayed.
Verify grid filters and pagination work.
Verify no fallback sample data appears on failures.
Verify modal has no horizontal scroll.
Verify date format is dd-MM-yyyy HH:MM:SS.
Verify sidebar/menu order and icons if the page affects menu metadata.
```
Known acceptable warning:
```text
Existing Angular bundle budget warnings may remain unless the task is specifically performance/bundle optimization.
```
---
# 15. Reuse Instruction
When starting a new project or page:
```text
1. Read this generic Angular UI standard context first.
2. Read the project-specific context.
3. Read the pagewise migration context.
4. Inspect API/DB request and response contracts.
5. Inspect legacy screen behavior if migrating.
6. Implement using the standard structure and UI rules.
7. Ask only theme-change questions unless contract discovery is blocked.
```
This standard should be treated as the baseline unless the user explicitly overrides it.

---
# 16. WebV1 Master Screen Reference Pattern
The completed WebV1 User Master screen is the reference implementation for future masters.

New master pages should use this structure:
```text
feature-name.models.ts
feature-name-api.service.ts
feature-name.store.ts
feature-name.page.ts
feature-name-form.dialog.ts
feature-name.routes.ts
```

Rules:
```text
API service owns endpoint URLs, payload normalization, DataSet table mapping, and DB/API message extraction.
Signal store owns arrays per tab/view, loading/submitting flags, active view, messages, derived values, and refresh after commands.
Page component owns layout, tab selection, grid actions, dialogs, and confirmation flow only.
Components and dialogs must not call APIs directly and must not inject feature API services for server work.
The required call chain is Component/Dialog -> NgRx Signal Store -> Feature API Service -> backend.
Header title and tabs are inline: Title first, label-sized tabs immediately after title.
Grid fills available page height and must not create outer page vertical scroll.
AG Grid columns are generated from active view response fields unless the page contract explicitly defines fixed columns.
Use Material icon buttons for row actions.
Use Material dialogs for create/edit/view.
Show confirmation dialogs before create/update/delete submit.
After successful create/update/delete, show DB/API message and reload list data.
Never place DataSet parsing in page components.
```

Current WebV1 masters:
```text
User Master: /administration/users. This is the approved reference pattern.
Role Master: /administration/roles. Uses RoleMaster APIs and USP_DDP_ROLEMASTER_IUDS.
Module Master / Role Menu Access: /administration/role-menu-access. Uses ModuleMaster_IUDS plus POST /api/Menu/getmenu after module selection.
```

For the next master:
```text
Start by verifying controller, service, model, and SP parameter names.
If an API returns DataSet Table and Table1, treat them as independent collections unless backend confirms otherwise.
Only render columns returned by the active API table, plus UI-owned action columns.
Do not add create/update/delete flows until the exact endpoint and SP payload are verified.
Never put HttpClient, endpoint URLs, or DataSet mapping in page/dialog components; put them in the feature API service.
Never call feature API services directly from components/dialogs; expose an NgRx Signal Store method/signal and let the store call the API service.
```
 
