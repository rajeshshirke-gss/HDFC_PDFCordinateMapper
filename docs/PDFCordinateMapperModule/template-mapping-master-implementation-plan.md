# Template Mapping Master Implementation Plan

## Purpose

Create Template Mapping Master for `PDFCordinateMapperModule` as a full-screen mapping workspace, not a modal-based CRUD form.

Template Mapping Master defines where Excel data fields render on an approved Template Master PDF. It maintains one logical mapping aggregate:

```text
MF_TEMPLATE_MAPPING_MAIN
  MF_TEMPLATE_MAPPING_FIELD
    MF_TEMPLATE_MAPPING_FIELD_CONFIG
```

The screen is complex and visual, so create/edit/view must use dedicated routes with a persistent workspace layout.

## Solution Architect Decision

Do not create mapping through a modal.

Use route-based navigation:

```text
/pdf-coordinate-mapper/template-mapping
/pdf-coordinate-mapper/template-mapping/create
/pdf-coordinate-mapper/template-mapping/:id/view
/pdf-coordinate-mapper/template-mapping/:id/edit
```

Reason:

- The user must inspect PDF pages while editing many fields.
- Mapping has nested data: header, fields, and field-type configuration.
- Users need enough space for PDF canvas, field list, properties, validation, and preview.
- A modal would hide context, constrain the canvas, and make repeatable mapping difficult.

## Current Architecture Rules

- Template Mapping depends on approved active Template Master only.
- Template Mapping must not depend on AMC Master.
- Template Mapping must use the PDF module's separate `MF_` Common Approval flow.
- Mapping Main, Fields, and Configurations must be saved and approved as one aggregate.
- Pending APP data must not be used for Excel validation or final PDF generation.
- Coordinates must be stored in canonical PDF coordinate space, not DOM/canvas pixels.
- PDF must load through an authorized API endpoint; do not expose physical file paths.

## Verified Existing DB State

MCP verified on `HDFCPDFMAP`:

```text
MF_TEMPLATE_MAPPING_MAIN                 TABLE    VALID
MF_TEMPLATE_MAPPING_MAIN_APP             TABLE    VALID
MF_TEMPLATE_MAPPING_MAIN_LOG             TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD                TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD_APP            TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD_LOG            TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD_CONFIG         TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP     TABLE    VALID
MF_TEMPLATE_MAPPING_FIELD_CONFIG_LOG     TABLE    VALID
```

Sequences and triggers for these tables are also valid.

Current DB/API implementation status:

```text
MF_TEMPLATE_MAPPING_MASTER_IUDS          PROCEDURE VALID
TemplateMappingController                IMPLEMENTED
TemplateMappingService                   IMPLEMENTED
Template Mapping Angular routes           IMPLEMENTED
Template Mapping PDF.js workspace         IMPLEMENTED
```

`MF_TEMPLATE_MAPPING_MASTER_IUDS` currently supports:

```text
S / SELECT / GET       List pending APP rows and approved live rows
GETBYID               Load pending APP row or approved live row
INSERT                Submit create request into APP tables
UPDATE                Submit/update maker edit request into APP tables
D / DELETE            Submit delete request into APP tables
```

Still required:

```text
MF_TEMPLATE_MAPPING_LOOKUP_DATA
Full field-type configuration save/load/render
```

`MF_COMMON_APPROVAL_IUDS` and `MF_GET_COMMON_APPROVAL_DATA` must be verified/extended for:

```text
Template Mapping Master
```

## Implementation Changes Completed So Far

The current implementation has moved beyond planning. Keep this section as the working context for future Codex work.

### Backend/API

- Added `TemplateMappingController` with:
  - `GET api/TemplateMapping/GetTemplateMapping`
  - `GET api/TemplateMapping/GetTemplateMappingById?autoId=...`
  - `POST api/TemplateMapping/SaveTemplateMapping`
  - `POST api/TemplateMapping/Delete_TemplateMapping`
- Added `TemplateMappingService`.
- Added `TemplateMappingModels`.
- Registered `ITemplateMappingService` in `UnityConfig`.
- `dotnet build HDFC.PDFCoordinateMapper.sln` passes.
- Field type normalization is enforced in API for:
  - `TEXT_FIELD`
  - `CHAR_GRID`
  - `DATE_GRID`
  - `OPTION_GROUP`
  - `COMPUTED_FIELD`

### Database

- Created standalone procedure `MF_TEMPLATE_MAPPING_MASTER_IUDS`.
- No Oracle package is used.
- Procedure is valid in `HDFCPDFMAP`.
- Listing and detail smoke checks were run through SQLcl MCP.
- Current procedure saves main, field, and field config rows into APP tables.

### Angular UI

- Added route-based Template Mapping Master:
  - list route
  - create route
  - view route
  - edit route
- Mapping creation/editing uses full workspace, not modal.
- PDF loads into PDF.js canvas using Template Master preview API.
- User maps fields directly on selected mapping pages.
- Pages are selected first, then fields are drawn or placed.
- Field name is entered by user; field/header pre-selection is not mandatory.
- Left/right panels follow dock-tab behavior like Visual Studio panels to conserve screen space.
- Header/template information remains a top-right modal.
- Clicking a mapped field always opens Field Inspector, regardless of pin/unpin state.
- Added Print Preview button at the top-right.
- Print Preview opens a print-ready tab with mapped values overlaid on the PDF.
- Current Print Preview is still basic and must be extended for field-type-specific rendering.

### Important User Decisions

- Do not build Angular unless explicitly asked.
- Template Mapping Master must not depend on AMC Master.
- Template Mapping create/edit/view must not use a modal.
- Template Mapping must use PDF module `MF_` maker/checker/common approval.
- For field-type configuration, use the old context contract:
  - Text field rendering
  - CharGrid rendering
  - DateGrid rendering
  - OptionGroup rendering
  - Computed field rendering

## Field-Type Configuration Implementation Update

Implemented after reviewing `oldProjectContextToReview.md`.

### Angular Changes

- Extended `MappingFieldDraft` with:
  - `autoId`
  - `mstColId`
  - `configs`
- Added `TemplateMappingFieldConfigDraft` matching `MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP`.
- Added type-specific config editor inside the existing right dock `Type Config` panel.
- No modal was introduced.
- Field config defaults are created automatically when:
  - user draws a new field
  - user changes field type
  - old mapping detail loads without config rows
- Supported editable config groups:
  - `TEXT_FIELD`: font, font size, alignment, max characters
  - `CHAR_GRID`: box width, box height, box spacing, max boxes
  - `DATE_GRID`: grid box settings plus date format/date separator
  - `OPTION_GROUP`: selection mode, mark value, add/remove option rows with option value/label/x/y
  - `COMPUTED_FIELD`: text config plus computed expression/output format
- Added type-specific validation before submit:
  - Char/date grid require `maxBoxes` and `boxSpacing`
  - Date grid requires `dateFormat`
  - Option group requires at least two unique option values
  - Computed field requires expression
- Print Preview now renders:
  - `TEXT_FIELD` and `COMPUTED_FIELD` as styled text overlay
  - `CHAR_GRID` and `DATE_GRID` as per-character grid boxes
  - `OPTION_GROUP` by matching configured option value and rendering mark value at option coordinate

### API Changes

- `TemplateMappingFieldConfigRequest` now has explicit `JsonProperty` bindings for Angular camel-case payload fields.
- `TemplateMappingService.NormalizeFields` now normalizes config sequence and Y/N config flags.
- `GetTemplateMappingById` Angular API mapping now reads config cursor rows and attaches configs to each field.

### Database Changes

- `MF_TEMPLATE_MAPPING_MASTER_IUDS` was extended directly in Oracle.
- Procedure remains standalone; no package was created.
- Procedure now parses nested `fields[].configs[]` JSON and inserts rows into:

```text
MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP
```

- For pending update, existing field config APP rows are deleted and regenerated with the submitted aggregate.
- SQLcl MCP verification:
  - Procedure status: `VALID`
  - Temporary smoke insert created one field config APP row
  - Temporary smoke rows were cleaned up

### Remaining Work

- Add final operational PDF generation service that uses approved live config rows.
- Add Excel-driven real data preview once the Excel upload/batch module is implemented.
- Angular build was intentionally not run because user instructed not to build Angular.

### Template Mapping Approval Fix

- Fixed `MF_COMMON_APPROVAL_IUDS` for `MASTERNAME = 'Template Mapping Master'`.
- Root cause: procedure only supported `AMC Master`; every other master was routed through Template Master approval logic, causing `Approval record was not found` for mapping APP ids.
- Template Mapping approval now handles the full aggregate:
  - `MF_TEMPLATE_MAPPING_MAIN_APP`
  - `MF_TEMPLATE_MAPPING_FIELD_APP`
  - `MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP`
- On approve:
  - Inserts/updates/deactivates live `MF_TEMPLATE_MAPPING_MAIN`.
  - Recreates live `MF_TEMPLATE_MAPPING_FIELD` and `MF_TEMPLATE_MAPPING_FIELD_CONFIG` from APP rows for insert/update.
  - Updates APP statuses to approved.
  - Writes mapping main/field/config logs.
  - Writes `MF_COMMON_APPROVAL_MASTER_LOG`.
- On reject:
  - Updates main/field/config APP statuses to rejected.
  - Updates common approval status and log.
- SQLcl MCP smoke test:
  - Created temporary Template Mapping approval.
  - Approved it through `MF_COMMON_APPROVAL_IUDS`.
  - Verified one live main, one live field, and one live config row were created.
  - Cleaned up all temporary live/app/log/common approval rows.
- Existing real pending approval remains untouched:
  - `AUTO_ID = 4`
  - `TBL_AUTO_ID = 3`
  - `MASTERNAME = 'Template Mapping Master'`
  - `STATUS = 0`

### Checker Review / Preview Implementation

- Extended `MF_GET_COMMON_APPROVAL_DATA` for `MASTERNAME = 'Template Mapping Master'`.
- Checker detail now returns one row per pending mapping field, including:
  - mapping header
  - template metadata
  - field code/name/header/type
  - page number
  - X/Y/width/height
  - required/repeat flags
  - config count
  - field-type-specific config summary
- Common Approval UI now recognizes Template Mapping detail fields instead of treating the request as Template Master data.
- Checker can open a read-only visual mapping preview from:
  - the approval detail dialog `Preview Mapping` button
  - the approval grid preview icon for Template Mapping rows
- Preview route uses the pending mapping APP id:

```text
/pdf-coordinate-mapper/template-mapping/:tblAutoId/view
```

- The existing Template Mapping workspace loads pending APP rows before approved live rows, so checkers can see the exact maker-submitted mapping fields and use the existing PDF overlay/print preview behavior before approving or rejecting.

### Maker-Checker Update Reuse Fix

- Reviewed User Master / Role Master maker-checker behavior and aligned PDF module SPs with the same update principle.
- Update/delete requests must reuse the existing `_APP` row linked by `MST_COL_ID`; they must not create a new live main-table row.
- Changed these standalone SPs directly in DB:
  - `MF_AMC_MASTER_IUDS`
  - `MF_TEMPLATE_MASTER_IUDS`
  - `MF_TEMPLATE_MAPPING_MASTER_IUDS`
  - `MF_COMMON_APPROVAL_IUDS`
- Approval inserts now back-fill `_APP.MST_COL_ID` with the live main-table `AUTOID` so future updates target the same staging row.
- Existing approved `_APP` rows with missing `MST_COL_ID` were backfilled for AMC, Template Master, and Template Mapping using their unique business codes.
- Template Mapping update now reuses the same `MF_TEMPLATE_MAPPING_MAIN_APP` row and refreshes child field/config `_APP` rows under that same app id.
- Maker update submissions write log records for the reused APP state; checker approval still writes approved log snapshots.
- Approval/list joins were restricted to pending common approval rows (`STATUS = 0`) to avoid duplicate list rows from historical approvals.
- SQLcl smoke verification:
  - Created temporary AMC, Template, and Template Mapping records.
  - Approved inserts with checker user.
  - Submitted update requests with maker user.
  - Verified one live row and one reused `_APP` row per master after update.
  - Cleaned up all temporary smoke rows.

### Canvas Config Sync Fix

- Fixed field-type changes so changing the `Field Type` resets that field to the correct default config for the selected type.
- Fixed validation to use resolved/defaulted config values, preventing false errors such as `Char/Grid fields require Max Boxes and Box Spacing` when the UI is showing defaults.
- Canvas overlay now reflects type configuration immediately:
  - `CHAR_GRID` and `DATE_GRID` render configured grid boxes on the canvas.
  - `OPTION_GROUP` renders option marks/targets at configured option coordinates.
  - `TEXT_FIELD` and `COMPUTED_FIELD` render preview text instead of only the field name.
- Print preview now renders all configured grid boxes, including empty boxes, up to `maxBoxes`.

### CharGrid Coordinate Contract Fix

- Char/date grid config now has one meaning across canvas and print preview:
  - Field `xCoordinate` / `yCoordinate` is the first character box origin.
  - `boxWidth` is one character box width in page-percent coordinate space.
  - `boxHeight` is one character box height in page-percent coordinate space.
  - `boxSpacing` is the start-to-start distance between adjacent boxes in page-percent coordinate space.
  - `maxBoxes` controls how many boxes are rendered.
- Canvas no longer uses CSS grid layout for char/date grid. It renders each character box as an individual absolutely positioned box using the same coordinate math as print preview.
- Char/date grid default size was reduced:
  - Defaults divide the drawn field width by the inferred/default box count.
  - Default char grid count is based on preview value length, falling back to 10.
  - Default date grid count remains 8.
- Print preview now calls the same grid-box calculation used by canvas, avoiding text drift between screen and print output.

### OptionGroup Canvas/Edit Fix

- Option group targets are movable independently on the PDF canvas.
- Dragging an option target updates that option row's `optionXCoordinate` and `optionYCoordinate`.
- Dragging an option target opens/keeps the `Type Config` dock visible so the coordinate inputs update while moving.
- Option editor layout was widened:
  - Value and Label inputs are larger.
  - X and Y inputs are moved into a clearer row layout.
  - Delete action remains compact on the right.
- Follow-up fix:
  - Option dragging now uses document-level mousemove/mouseup tracking so mouse and touchpad drags keep working even when the pointer leaves the small option target.
  - Drag math uses the PDF paper rectangle captured at drag start.
  - Type Config right dock width increased.
  - Option config rows are explicitly laid out as Value/Label on the first row and X/Y on the second row with a fixed delete column.

## Existing DB Columns

### Mapping Main

```text
AUTOID
MST_COL_ID              -- APP/LOG only
TEMPLATE_ID
MAPPING_CODE
MAPPING_NAME
MAPPING_DESCRIPTION
PAGE_WIDTH
PAGE_HEIGHT
COORDINATE_ORIGIN
ISACTIVE
STATUS
ACTION
ACTIONREMARK
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
```

### Mapping Field

```text
AUTOID
MST_COL_ID              -- APP/LOG only
MAPPING_MAIN_ID
FIELD_UID
FIELD_CODE
FIELD_NAME
EXCEL_HEADER_NAME
FIELD_TYPE
PAGE_NO
X_COORDINATE
Y_COORDINATE
FIELD_WIDTH
FIELD_HEIGHT
IS_REQUIRED
SNAP_TO_GRID
SAMPLE_VALUE
DISPLAY_SEQUENCE
IS_REPEATABLE
REPEAT_GROUP_CODE
IS_REPEAT_GROUP_OWNER
ISACTIVE
STATUS
ACTION
ACTIONREMARK
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
```

### Mapping Field Config

```text
AUTOID
MST_COL_ID              -- APP/LOG only
MAPPING_FIELD_ID
CONFIG_SEQUENCE
FONT_NAME
FONT_SIZE
MIN_FONT_SIZE
FONT_STYLE
FONT_COLOR
TEXT_ALIGNMENT
VERTICAL_ALIGNMENT
IS_MULTILINE
MAX_LINES
LINE_HEIGHT
MAX_CHARACTERS
WRAP_TEXT
OVERFLOW_ACTION
BOX_WIDTH
BOX_HEIGHT
BOX_SPACING
MAX_BOXES
DATE_FORMAT
DATE_SEPARATOR
IGNORE_DATE_SEPARATOR
SELECTION_MODE
OPTION_VALUE
OPTION_LABEL
OPTION_X_COORDINATE
OPTION_Y_COORDINATE
OPTION_WIDTH
OPTION_HEIGHT
MARK_VALUE
REPEAT_SLOT_NO
REPEAT_X_OFFSET
REPEAT_Y_OFFSET
COMPUTED_EXPRESSION
OUTPUT_FORMAT
ISACTIVE
STATUS
ACTION
ACTIONREMARK
CREATEDBY
CREATEDDATE
MODIFIEDBY
MODIFIEDDATE
APPROVEDBY
APPROVEDDATE
```

## User-Friendly UI Architecture

### 1. List Route

Route:

```text
/pdf-coordinate-mapper/template-mapping
```

Purpose:

- Show existing mapping records.
- Separate All and Approved views.
- Let user create, edit, view, delete, and preview mappings.

Layout:

```text
Header
  Title: Template Mapping Master
  Tabs: All / Approved
  Actions: Refresh, Create Mapping

Message strip

AG Grid
  Actions
  Mapping Code
  Mapping Name
  Template Code
  Template Name
  Field Count
  Status
  Action
  Maker
  Created Date
```

Actions:

```text
View
Edit
Delete
Preview
```

### 2. Workspace Route

Routes:

```text
/pdf-coordinate-mapper/template-mapping/create
/pdf-coordinate-mapper/template-mapping/:id/view
/pdf-coordinate-mapper/template-mapping/:id/edit
```

The workspace should be a dense route-based Mapping Studio with auto-hide dock panels. The application already has a side navigation menu, so Template Mapping must not permanently consume extra width with fixed side panels.

```text
Top command bar
  Back
  Mode badge
  Template selector / mapping title
  Header info button
  Validate
  Submit for Approval

Left dock tab strip
  Pages
  Headers
  Page Fields

Center canvas
  PDF.js viewer
  Mapping pages only
  Zoom controls
  Page controls
  Coordinate overlays
  Draw/select tool
  Snap/grid toggle

Right dock tab strip
  Field Inspector
  Type Config
  Issues
  Review
```

Dock panels should behave like Visual Studio `Solution Explorer` / `Git Changes`:

```text
Collapsed - visible as a thin vertical tab only
Expanded  - opens when the user clicks the tab
Pinned    - stays open until the user unpins or closes it
```

Default desktop state:

```text
Pages panel       Expanded after template selection
Headers panel     Collapsed
Page Fields       Collapsed
Field Inspector   Collapsed until a field is selected
Issues            Opens only after validation failure
Review            Opens when user clicks Review or Submit
```

Panel content:

```text
Pages dock panel
  Template info
  Mapping page navigator
  Page progress
  Mapped/unmapped counters

Headers dock panel
  Excel header palette
  Header search
  Header usage status

Page Fields dock panel
  Selected page mapped fields
  Field search
  Delete/select actions

Field Inspector / Type Config dock panels
  Selected field properties
  Field type configuration
  Repeat settings

Issues / Review dock panels
  Validation issues
  Full mapping summary before submit
```

This arrangement keeps the PDF in the center as the main working surface. Source fields, page navigation, configuration, and validation stay one click away without permanently reducing the PDF canvas width.

Template/page header information is read-only context and should remain a small modal opened from the top-right `Header` button. Do not use that modal for field creation or mapping edits.

### 3. Mobile/Small Screen Behavior

Template Mapping is a desktop-first workflow.

For narrow screens:

- Keep PDF canvas first.
- Keep the same dock-tab concept, but open panels as full-height overlays over the canvas.
- Keep save/validate/submit commands sticky.
- Do not use a modal for the main editor.

## Workspace UX Details

## Deep Page-First Field Mapping Workflow

The mapping workflow must be page-first because one template can have multiple configured mapping pages.

The user should not begin by dropping fields onto an unknown PDF page. The system must guide the user through this sequence:

```text
1. Select Template
2. Load Mapping Pages
3. Select One Mapping Page
4. Map Fields On Selected Page
5. Keep Page Mapping In Working State
6. Move To Next Mapping Page
7. Review All Mapped Pages
8. Validate Whole Mapping Aggregate
9. Submit Whole Mapping For Approval
```

### Page-First Rule

After a template is selected, the system must read the template's configured mapping pages:

```text
MF_TEMPLATE_MASTER.MAPPING_PAGE_NUMBERS
```

Only these pages can be mapped.

Example:

```text
MAPPING_PAGE_NUMBERS = 1,3,5
```

The Mapping Studio page selector should show:

```text
Page 1
Page 3
Page 5
```

The user must select one page before the Excel header palette and draw tools become active. On create, the system can auto-select the first configured mapping page, but it must still show clearly which page is active.

### Working Aggregate State

The Angular store should maintain one working aggregate for the whole mapping:

```text
Mapping Main
  Fields for Page 1
  Fields for Page 3
  Fields for Page 5
  Config rows for every field
```

When the user changes pages, the current page's mapped fields are not submitted to DB immediately. They remain in the client-side working aggregate until the user saves or submits the complete mapping.

Recommended state shape:

```ts
interface MappingWorkspaceState {
  main: TemplateMappingMainDraft;
  mappingPages: number[];
  selectedPageNo: number | null;
  fields: TemplateMappingFieldDraft[];
  configs: TemplateMappingFieldConfigDraft[];
  dirtyPageNumbers: number[];
  validationIssues: MappingValidationIssue[];
}
```

Each field must carry its own page number:

```ts
interface TemplateMappingFieldDraft {
  fieldUid: string;
  excelHeaderName: string;
  fieldType: string;
  pageNo: number;
  xCoordinate: number;
  yCoordinate: number;
  fieldWidth: number;
  fieldHeight: number;
}
```

### Page Navigator UX

The `Pages` dock panel should contain a page navigator designed for mapping progress:

```text
Mapping Pages
  Page 1   8 fields mapped   Complete
  Page 3   5 fields mapped   Issues: 2
  Page 5   0 fields mapped   Not started
```

Each page item should show:

- Page number.
- Count of mapped fields on that page.
- Validation status.
- Dirty indicator.
- Click action to switch page.

Suggested page states:

```text
Not Started
In Progress
Has Issues
Complete
```

### Switching Pages

When the user selects another mapping page:

1. Persist current inspector edits into the working aggregate.
2. Keep all fields/config rows in memory.
3. Set `selectedPageNo`.
4. Render the selected PDF page.
5. Display overlays only where `field.pageNo === selectedPageNo`.
6. Filter the field list to the selected page by default.
7. Keep an option to show all mapped fields for full review.

Do not save partial page mapping to DB automatically on page switch.

### Mapping A Field On Selected Page

Primary flow:

```text
1. User selects a mapping page.
2. User opens the Headers dock panel and selects an Excel header.
3. User chooses field type or accepts default TEXT_FIELD.
4. User draws a rectangle on the PDF page.
5. UI converts the viewport rectangle to canonical PDF coordinates.
6. UI creates a field draft with selected page number.
7. Field appears as an overlay on the selected page.
8. Field appears in the selected-page field list.
9. Field Inspector dock panel opens for field properties/config.
10. User completes required field config.
```

Secondary flow:

```text
1. User selects a mapping page.
2. User draws a rectangle first.
3. UI asks user to select Excel header and field type in the inspector.
4. UI creates the field draft after required details are present.
```

First implementation should prefer select-header-then-draw. It is easier to validate, easier to explain, and avoids complicated drag/drop edge cases.

### Overlay Behavior

For the selected page, overlays should show:

```text
Field label
Resize handles
Selected state
Required marker
Repeatable marker
Validation issue marker
```

Overlay interactions:

- Click selects field.
- Drag moves field.
- Resize changes width and height.
- Delete removes field draft and related configs.
- Duplicate copies field on same page with a new field UID.
- Keyboard arrow keys nudge selected field.

Every move/resize must update canonical PDF coordinates, not raw screen pixels.

### Field List Behavior

The field list should default to current page:

```text
Fields On Page 3
```

It should also allow:

```text
Show All Fields
Show Unmapped Headers
Show Fields With Issues
```

Each row should show:

```text
Display Sequence
Excel Header
Field Name
Field Type
Required
Repeatable
Issue Count
```

Clicking a field:

1. Switches to that field's page if needed.
2. Selects its overlay.
3. Opens the inspector.

### Page Completion

A page is complete when:

- All intended required headers for that page are mapped.
- All fields on that page have valid coordinates.
- Required type-specific config exists.
- No field on that page is outside page bounds.
- No blocking validation issue exists for that page.

Completion is a UI guide only. Final API validation is for the full aggregate.

### Whole Mapping Review

Before submit, show a review panel:

```text
Mapping Summary
  Template
  Mapping Code / Name
  Mapping Pages
  Total Fields
  Fields By Page
  Repeat Groups
  Validation Issues
```

Example:

```text
Page 1: 8 fields, 0 issues
Page 3: 5 fields, 1 warning
Page 5: 7 fields, 0 issues
Total: 20 fields
```

The Submit button should be disabled when blocking validation issues exist.

### Save/Submit Rule

The user maps page by page, but the API save must receive the full mapping aggregate.

Save payload must include:

```text
Mapping Main
All fields for all mapping pages
All field config rows for all fields
```

Do not save each page as a separate DB approval request.

Submission creates one pending request:

```text
MASTERNAME = 'Template Mapping Master'
```

Checker approves or rejects the complete mapping aggregate.

### Example End-To-End User Journey

1. User opens `Create Mapping`.
2. User selects Template `KIM_FORM_A`.
3. System loads mapping pages `1,2,4`.
4. System selects Page 1 by default and renders it.
5. User selects Excel header `Investor Name`.
6. User draws the target rectangle on Page 1.
7. System creates `TEXT_FIELD` mapping for Page 1.
8. User configures font size, wrap, and required flag.
9. User maps all Page 1 fields.
10. Page navigator marks Page 1 complete.
11. User selects Page 2.
12. System renders Page 2 and hides Page 1 overlays.
13. User maps Page 2 fields.
14. User selects Page 4.
15. User maps Page 4 fields.
16. User opens Review.
17. System validates all pages and shows total mapped fields.
18. User submits for approval.
19. API saves the full aggregate into APP tables.
20. API creates one MF Common Approval row.
21. Checker reviews the complete aggregate and approves/rejects it.

## Page-First Implementation To-Do List

### UI Store To-Do

- Add `mappingPages: number[]`.
- Add `selectedPageNo: number | null`.
- Add `fields: TemplateMappingFieldDraft[]`.
- Add `configs: TemplateMappingFieldConfigDraft[]`.
- Add `dirtyPageNumbers: number[]`.
- Add `pageValidationSummary`.
- Add selector `fieldsForSelectedPage`.
- Add selector `configsForSelectedField`.
- Add selector `mappedFieldCountByPage`.
- Add selector `issueCountByPage`.
- Add method `selectMappingPage(pageNo)`.
- Add method `addFieldToSelectedPage(header, rect)`.
- Add method `updateFieldCoordinates(fieldUid, rect)`.
- Add method `updateFieldProperties(fieldUid, patch)`.
- Add method `upsertFieldConfig(fieldUid, patch)`.
- Add method `deleteField(fieldUid)`.
- Add method `validateSelectedPage()`.
- Add method `validateWholeMapping()`.
- Add method `buildSavePayload()`.

### PDF Viewer To-Do

- Load PDF through authorized API URL/blob.
- Render only selected mapping page in the main canvas.
- Support zoom in/out/reset.
- Support viewport-to-PDF coordinate conversion.
- Support PDF-to-viewport coordinate conversion for overlays.
- Emit `rectangleDrawn` with canonical coordinates.
- Emit `fieldMoved` with canonical coordinates.
- Emit `fieldResized` with canonical coordinates.
- Redraw overlays when zoom or selected page changes.
- Hide overlays for non-selected pages.

### Page Navigator To-Do

- Build page list from Template Master `MAPPING_PAGE_NUMBERS`.
- Select first mapping page after template load.
- Show mapped field count per page.
- Show validation state per page.
- Show dirty indicator per page.
- Prevent mapping if no page is selected.
- Keep current page state when switching pages.

### Field Palette To-Do

- Load Excel headers from API.
- Search/filter headers.
- Show mapped/unmapped state.
- Select header for mapping.
- First pass: support select-header-then-draw.
- Later enhancement: drag header onto PDF.

### Overlay To-Do

- Render overlays for `fieldsForSelectedPage`.
- Show labels and issue markers.
- Support select, move, resize, delete.
- Support keyboard nudge.
- Keep overlays stable across zoom changes.
- Mark selected overlay visually.

### Inspector To-Do

- Show common field properties.
- Show type-specific config controls.
- Validate required config by type.
- Save changes into working aggregate, not directly DB.
- Disable inspector in view mode.
- Show repeat settings only when `isRepeatable = Y`.

### Validation To-Do

- Validate selected page on field add/update/delete.
- Validate all pages before save/submit.
- Block submit for critical issues.
- Show warnings separately from blocking errors.
- Map API validation response back to field/page.

### API Payload To-Do

- Include all fields across all pages.
- Include all configs across all fields.
- Include page width/height and coordinate origin.
- Include template id and mapping header.
- Include current user and remark.
- Do not send only selected page.

### DB To-Do

- SP must parse/save full aggregate.
- SP must reject orphan configs.
- SP must reject fields on pages outside Template Master mapping pages.
- SP must create one APP aggregate request.
- SP must create one Common Approval row.
- Approval must move the whole aggregate to live tables atomically.

### Template Selection

Create mode starts with a setup band:

```text
Select Template
Mapping Code
Mapping Name
Description
Coordinate Origin
Active
```

After template selection:

- Load template metadata.
- Load PDF preview through authorized `PreviewTemplatePdf`.
- Load mapping pages from Template Master.
- Render only mapping pages.
- Show printing pages as read-only context.
- Use Template Master `REPEAT_ROWS_PER_PAGE` as the repeat capacity.

### Excel Header Palette

Until the Excel Upload feature exists, provide a controlled header source through one of these API-backed options:

- Static approved business header list from DB/SP.
- Upload sample header file in a later enhancement.
- Temporary server-defined list returned by `MF_TEMPLATE_MAPPING_LOOKUP_DATA`.

No fake UI-only fallback headers.

Palette behavior:

- Search headers.
- Filter unmapped/mapped.
- Drag header to PDF or select header then draw rectangle.
- Show a mapped badge when a header already has a field.

### PDF Canvas Behavior

PDF.js viewer must support:

- Zoom in/out/reset.
- Page selection/navigation for mapping pages.
- Pan/scroll.
- Draw rectangle.
- Select existing rectangle.
- Resize/move rectangle.
- Delete rectangle.
- Show field label overlay.
- Toggle overlays on/off.
- Toggle grid/snap.

Persisted coordinate contract:

```text
PAGE_NO
X_COORDINATE
Y_COORDINATE
FIELD_WIDTH
FIELD_HEIGHT
COORDINATE_ORIGIN
PAGE_WIDTH
PAGE_HEIGHT
```

Never persist raw canvas pixels.

### Field Inspector

Common field properties:

```text
Field Code
Field Name
Excel Header Name
Field Type
Page No
X / Y / Width / Height
Required
Snap To Grid
Sample Value
Display Sequence
Repeatable
Repeat Group Code
Repeat Group Owner
Active
```

Field type options:

```text
TEXT_FIELD
CHAR_GRID
DATE_GRID
OPTION_GROUP
COMPUTED_FIELD
```

Inspector dynamically shows config controls by field type.

TEXT_FIELD:

```text
Font name
Font size
Min font size
Font style
Font color
Text alignment
Vertical alignment
Multiline
Max lines
Line height
Max characters
Wrap text
Overflow action
```

CHAR_GRID:

```text
Box width
Box height
Box spacing
Max boxes
Font settings
```

DATE_GRID:

```text
Date format
Date separator
Ignore date separator
Box width
Box height
Box spacing
```

OPTION_GROUP:

```text
Selection mode
Option value
Option label
Option coordinates
Mark value
```

COMPUTED_FIELD:

```text
Computed expression
Output format
Allowed source headers
```

Repeat configuration:

```text
Repeat slot no
Repeat X offset
Repeat Y offset
Repeat group code
```

## Route-Based Workflow

### Create Mapping

1. User opens `/template-mapping/create`.
2. User selects an approved active Template Master record.
3. API returns template metadata and PDF preview URL.
4. User enters mapping header details.
5. User maps fields on PDF pages.
6. User configures field-type behavior.
7. User runs validation.
8. User saves draft/pending aggregate to APP tables.
9. User submits complete aggregate for approval.
10. API creates `MF_COMMON_APPROVAL_MASTER` row with `MASTERNAME = 'Template Mapping Master'`.

### Edit Mapping

1. User opens `/template-mapping/:id/edit`.
2. API loads approved live aggregate.
3. UI copies data into an editable working model.
4. User changes fields/configuration.
5. API writes changes to APP tables only.
6. Live mapping remains unchanged until checker approval.

### View Mapping

1. User opens `/template-mapping/:id/view`.
2. UI loads approved aggregate read-only.
3. PDF viewer displays overlays.
4. Inspector is read-only.
5. No save/submit controls are shown.

### Delete Mapping

1. User submits delete from list route.
2. API writes delete/deactivate request to APP tables.
3. Checker approves/rejects through PDF Common Approval.
4. Approval deactivates live mapping.

## DB Plan

### 1. Create Standalone Mapping SP

Create:

```text
MF_TEMPLATE_MAPPING_MASTER_IUDS
```

Do not create a package.

Required flags:

```text
S / SELECT          - list mapping records
GETBYID             - load one aggregate
INSERT              - create pending aggregate
UPDATE              - create pending aggregate update
D / DELETE          - create pending delete request
VALIDATE            - validate aggregate without save, if useful
```

List response:

```text
Table  = APP/pending-aware rows
Table1 = approved live rows
```

GETBYID response:

```text
Table  = Mapping Main
Table1 = Mapping Fields
Table2 = Field Config rows
Table3 = Template metadata
```

### 2. Create Lookup SP

Create:

```text
MF_TEMPLATE_MAPPING_LOOKUP_DATA
```

Required flags:

```text
TEMPLATES       - approved active Template Master records
FIELD_TYPES     - supported field type list
EXCEL_HEADERS   - approved Excel header list
```

Template lookup must use Template Master only, not AMC Master.

### 3. Extend MF Common Approval

Extend:

```text
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Required behavior:

- Support `MASTERNAME = 'Template Mapping Master'`.
- Show mapping header and key counts in approval list/detail.
- Approve/reject the full aggregate atomically.
- On approve, insert/update:
  - `MF_TEMPLATE_MAPPING_MAIN`
  - `MF_TEMPLATE_MAPPING_FIELD`
  - `MF_TEMPLATE_MAPPING_FIELD_CONFIG`
- Insert logs into all three LOG tables.
- Update APP statuses.
- Update/log MF Common Approval.
- Reject without changing live tables.

## API Plan

Create:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/TemplateMappingMasterController.cs
HDFC.PDFCoordinateMapper.Api/Services/TemplateMappingMasterService.cs
HDFC.PDFCoordinateMapper.Api/Models/TemplateMappingMasterModels.cs
```

Update:

```text
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj
```

Route prefix:

```csharp
[RoutePrefix("api/TemplateMappingMaster")]
```

Endpoints:

```text
GET  /api/TemplateMappingMaster/GetTemplateMappings
GET  /api/TemplateMappingMaster/GetTemplateMappingById?autoId=
GET  /api/TemplateMappingMaster/GetLookupData
POST /api/TemplateMappingMaster/ValidateTemplateMapping
POST /api/TemplateMappingMaster/SaveTemplateMapping
POST /api/TemplateMappingMaster/Delete_TemplateMapping
```

API responsibilities:

- Build Oracle parameters by name.
- Serialize/deserialize mapping fields and configs safely.
- Validate aggregate before save.
- Keep file access through Template Master preview endpoint.
- Return DataSet JSON consistently.
- Do not accept raw browser pixel coordinates as final values.

## API Model Plan

Suggested request model:

```csharp
public sealed class TemplateMappingMasterRequest
{
    public string Flag { get; set; }
    public string Auto_Id { get; set; }
    public string Mst_Col_Id { get; set; }
    public string Template_Id { get; set; }
    public string Mapping_Code { get; set; }
    public string Mapping_Name { get; set; }
    public string Mapping_Description { get; set; }
    public string Page_Width { get; set; }
    public string Page_Height { get; set; }
    public string Coordinate_Origin { get; set; }
    public string IsActive { get; set; }
    public string CurrentUserId { get; set; }
    public string Remark { get; set; }
    public List<TemplateMappingFieldRequest> Fields { get; set; }
}
```

Field model:

```csharp
public sealed class TemplateMappingFieldRequest
{
    public string Auto_Id { get; set; }
    public string Mst_Col_Id { get; set; }
    public string Field_Uid { get; set; }
    public string Field_Code { get; set; }
    public string Field_Name { get; set; }
    public string Excel_Header_Name { get; set; }
    public string Field_Type { get; set; }
    public string Page_No { get; set; }
    public string X_Coordinate { get; set; }
    public string Y_Coordinate { get; set; }
    public string Field_Width { get; set; }
    public string Field_Height { get; set; }
    public string Is_Required { get; set; }
    public string Snap_To_Grid { get; set; }
    public string Sample_Value { get; set; }
    public string Display_Sequence { get; set; }
    public string Is_Repeatable { get; set; }
    public string Repeat_Group_Code { get; set; }
    public string Is_Repeat_Group_Owner { get; set; }
    public string IsActive { get; set; }
    public List<TemplateMappingFieldConfigRequest> Configs { get; set; }
}
```

Config model should mirror `MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP` columns.

## Angular Structure

Create folder:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/pdf-coordinate-mapper/template-mapping/
  template-mapping.models.ts
  template-mapping-api.service.ts
  template-mapping.store.ts
  template-mapping.page.ts
  template-mapping-workspace.page.ts
  template-mapping.routes.ts
  pdf-viewer.component.ts
  coordinate-overlay.component.ts
  field-palette.component.ts
  field-inspector.component.ts
  mapping-validation-panel.component.ts
```

No create/edit modal.

Route file:

```ts
export const templateMappingRoutes: Routes = [
  { path: '', component: TemplateMappingPage },
  { path: 'create', component: TemplateMappingWorkspacePage },
  { path: ':id/view', component: TemplateMappingWorkspacePage },
  { path: ':id/edit', component: TemplateMappingWorkspacePage }
];
```

App route:

```text
/pdf-coordinate-mapper/template-mapping
```

## Angular Store Plan

State:

```text
mappings
approvedMappings
templates
fieldTypes
excelHeaders
currentMain
fields
selectedFieldUid
configs
validationIssues
mode
loading
workspaceLoading
pdfLoading
submitting
errorMessage
lastMessage
```

Methods:

```text
loadMappings()
loadLookups()
startCreate()
loadWorkspace(id, mode)
selectTemplate(templateId)
addFieldFromHeader(header)
selectField(fieldUid)
updateSelectedField(patch)
updateSelectedFieldConfig(patch)
moveField(fieldUid, coordinates)
resizeField(fieldUid, coordinates)
deleteField(fieldUid)
validateMapping()
saveDraft()
submitForApproval()
deleteMapping(record)
clearMessages()
```

## Validation Plan

Client-side validation should guide the user, but API/DB is authoritative.

Required checks:

- Template is approved and active.
- Mapping code/name are required.
- Mapping code is unique.
- At least one field is mapped.
- Every field has field UID, code, name, type, page, coordinates.
- Page number is one of Template Master mapping pages.
- Coordinates are inside PDF page bounds.
- Width and height are greater than zero.
- Field code is unique within the mapping.
- Display sequence is unique or normalized.
- Required type-specific config exists.
- Option-group rows have option value, label, coordinates, and mark value.
- Repeatable fields have repeat group and slot config.
- Computed expressions use only approved functions/headers.
- No orphan config exists.

## Approval Plan

Use:

```text
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Approval list display fields:

```text
Mapping Code
Mapping Name
Template Code
Template Name
Field Count
Action
Maker
Created Date
```

Checker detail should show:

- Mapping header.
- Template metadata.
- Field list.
- Config summary by field.
- PDF overlay preview if feasible in first pass.

## Step-By-Step Implementation Order

1. Finalize route names and workspace layout.
2. Confirm Template Mapping has no AMC dependency.
3. Confirm current mapping tables/sequences/triggers are valid.
4. Create `MF_TEMPLATE_MAPPING_LOOKUP_DATA`.
5. Create `MF_TEMPLATE_MAPPING_MASTER_IUDS`.
6. Extend `MF_COMMON_APPROVAL_IUDS` for `Template Mapping Master`.
7. Extend `MF_GET_COMMON_APPROVAL_DATA` for mapping aggregate details.
8. Smoke test DB list/lookups/save/approve/reject using SQLcl MCP.
9. Add backend models/service/controller.
10. Register service in Unity.
11. Update `.csproj`.
12. Build API.
13. Add Angular route and feature folder.
14. Build list page.
15. Build workspace shell route.
16. Build template selector and metadata strip.
17. Build PDF viewer component with authorized PDF loading.
18. Build page navigation and zoom controls.
19. Build coordinate overlay draw/select/move/resize.
20. Build field palette.
21. Build field inspector.
22. Build field-type config sections.
23. Build validation panel.
24. Wire save draft and submit for approval.
25. Wire view/edit modes.
26. Wire delete request from list.
27. Build Angular.
28. Test create mapping request.
29. Test edit mapping request.
30. Test PDF Common Approval approve/reject.
31. Verify live/app/log/common approval rows.
32. Verify approved mapping reloads read-only and as edit baseline.

## Verification Checklist

DB:

- Mapping SPs compile valid.
- Lookup SP returns approved active templates.
- Insert/update/delete creates APP aggregate rows.
- Submit creates `MF_COMMON_APPROVAL_MASTER`.
- Approval moves aggregate to live tables.
- Logs are inserted.
- Rejection preserves live mapping.

API:

- `dotnet build HDFC.PDFCoordinateMapper.sln` succeeds.
- List endpoint returns DataSet JSON.
- Lookup endpoint returns templates, headers, field types.
- Save endpoint accepts nested aggregate payload.
- Validate endpoint returns structured validation issues.
- Delete endpoint creates pending delete request.

Angular:

- `npm run build` succeeds.
- List route loads.
- Create route loads without modal.
- PDF renders through API.
- Drawing/moving/resizing persists canonical coordinates.
- Inspector edits selected field.
- Validation panel guides missing/invalid config.
- Submit creates pending request.
- View mode is read-only.
- Edit mode creates pending update, not direct live update.

## Open Decisions Before Coding

- Exact approved Excel header source until Excel Upload is implemented.
- Whether first pass supports drag-to-map or select-header-then-draw only.
- Whether PDF overlay preview is mandatory in Checker detail first pass.
- Coordinate origin standard: recommended `TOP_LEFT`.
- Unit standard: recommended PDF points.
- Whether overlapping fields are blocked or only warned.
- Whether draft save and submit are separate buttons or one submit action.

## Final Rule

Template Mapping Master is a route-based Mapping Studio, not a modal form.

It must depend on Template Master only, use canonical PDF coordinates, save the mapping aggregate atomically, and route approvals through the PDF module's `MF_` Common Approval flow.
