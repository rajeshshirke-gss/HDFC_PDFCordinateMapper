# PDFCordinateMapperModule Feature Development Context

## Purpose

Use this document before creating any new feature for `PDFCordinateMapperModule`.

The goal is to ensure PDF Coordinate Mapper features follow the same implementation structure already used by the completed User Management module in `HDFC.PDFCoordinateMapper.WebV1` and `HDFC.PDFCoordinateMapper.Api`.

This document is implementation guidance. It does not replace the functional architecture in:

```text
docs/PDFCordinateMapperModule/pdf-coordinate-mapping-project-overview-architecture-context(2).md
```

## Mandatory Reference Pattern

The completed User Management module is the current project-level reference.

Angular reference folder:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/administration/users/
  user-master.models.ts
  user-master-api.service.ts
  user-master.store.ts
  user-master.page.ts
  user-master-form.dialog.ts
  user-master.routes.ts
```

Backend reference files:

```text
HDFC.PDFCoordinateMapper.Api/Controllers/UserMasterController.cs
HDFC.PDFCoordinateMapper.Api/Services/UserMasterService.cs
HDFC.PDFCoordinateMapper.Api/Models/UserMasterModels.cs
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
```

Supporting Angular references:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/core/api/api.config.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/core/api/dataset.adapter.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/core/auth/auth.store.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/shared/confirm-dialog.component.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/app.routes.ts
HDFC.PDFCoordinateMapper.WebV1/src/app/core/layout/application-shell.component.ts
```

## Required Angular Structure

Every new PDF Coordinate Mapper feature should use a self-contained standalone feature folder.

Recommended location:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/pdf-coordinate-mapper/<feature-name>/
```

Required files for a CRUD or workflow page:

```text
<feature-name>.models.ts
<feature-name>-api.service.ts
<feature-name>.store.ts
<feature-name>.page.ts
<feature-name>.routes.ts
```

Add a dialog file only when the feature needs a modal form or review action:

```text
<feature-name>-form.dialog.ts
<feature-name>-review.dialog.ts
<feature-name>-approval.dialog.ts
```

For PDF.js coordinate work, keep PDF viewer and overlay responsibilities isolated:

```text
pdf-viewer.component.ts
coordinate-overlay.component.ts
field-property-panel.component.ts
```

Do not create many child components by default. Add child components only when they separate real responsibilities such as PDF rendering, coordinate capture, field configuration, or row validation grids.

## Angular Layer Responsibilities

### Models

Models must define:

- Raw API row shape where needed.
- Stable view model used by the page.
- Form value model.
- API command payload model where useful.
- Command result model.
- Feature view/tab type.

Keep API quirks out of templates. For DataSet-backed responses, preserve the raw row on the view model:

```ts
raw: Record<string, unknown>;
```

### API Service

The feature API service owns:

- API URLs.
- HTTP method selection.
- Payload construction.
- DataSet table extraction.
- Field-name normalization.
- DB/API message extraction.
- Business-error detection.
- Mapping raw rows into typed view models.

Use:

```text
src/app/core/api/api.config.ts
src/app/core/api/dataset.adapter.ts
```

Do not return fake rows, sample rows, or fallback business data from a service.

### Store

Use a signal-based store/facade similar to `UserMasterStore`.

The store owns:

- Current rows.
- Active tab/view.
- Dropdown/reference data.
- Loading flags.
- Submitting flags.
- Error message.
- Last success/info message.
- Current-user lookup through `AuthStore`.
- Refresh after successful commands.

The page should call store methods. It should not build API payloads.

### Page

The page owns:

- Header layout.
- Toolbar actions.
- Tab switching.
- Grid rendering.
- Dialog opening.
- User interaction events.

The page must stay thin. It should not contain stored-procedure names, Oracle parameter names, or raw DataSet table logic.

### Dialogs

Dialogs own:

- Reactive form controls.
- Field-level validation.
- Create/edit/view mode display.
- Submit/cancel behavior.
- Disabled state in view mode.

Confirmation must use shared confirmation behavior, not browser `alert()`.

## Required UI Pattern

Follow the User Management operational layout:

```text
Page header
  Title
  Compact tabs beside the title where the feature has views
  Primary action
  Refresh/action icon buttons

Message strip

Grid or workflow surface
  AG Grid for tabular records
  PDF.js viewer for mapping surfaces
  Property/validation panel only when required
```

Do not create a marketing-style landing page for module features.

Do not wrap the whole page in decorative cards. Use an unframed page layout and reserve cards for repeated items, modals, or genuinely framed tools.

## PDF Coordinate Mapper Feature Areas

Use the following target structure as features are built:

```text
pdf-coordinate-mapper/
  amc-master/
  template-registry/
  template-mapping/
  excel-upload/
  row-validation/
  row-approval/
  generated-documents/
  audit-history/
```

Closest User Management pattern by feature:

| PDF feature | Reference pattern | Notes |
| --- | --- | --- |
| AMC Master | User Master / Role Master | Master CRUD with Maker-Checker and PDF module MF Common Approval. |
| Template Registry | User Master plus file upload/PDF preview | Master CRUD with PDF upload, page selection, and PDF module MF Common Approval. |
| Template Mapping | Role Menu Mapping plus PDF.js viewer | Aggregate editor for mapping header, fields, and field configs. |
| Excel Upload | New workflow page | File upload, validation result, batch creation. |
| Row Validation | AG Grid workflow | Editable operational rows and validation messages. |
| Row Approval | Common Approval visual style, not Common Approval backend | Row-level checker decision with operational statuses. |
| Generated Documents | Grid plus download/print actions | Use approved rows only. |
| Audit History | Grid/read-only detail | Append-only audit display. |

## Backend Structure

The backend is an ASP.NET Web API project targeting .NET Framework 4.7.2.

Use the existing folders:

```text
HDFC.PDFCoordinateMapper.Api/Controllers
HDFC.PDFCoordinateMapper.Api/Services
HDFC.PDFCoordinateMapper.Api/Models
HDFC.PDFCoordinateMapper.Api/Database
HDFC.PDFCoordinateMapper.Api/Utilities
HDFC.PDFCoordinateMapper.Api/App_Start
```

For each new API area, create:

```text
Controllers/<FeatureController>.cs
Services/<FeatureService>.cs
Models/<FeatureModels>.cs
```

If dependency injection is required, register the interface and implementation in:

```text
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
```

When adding `.cs` files, update:

```text
HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj
```

This project uses explicit `<Compile Include="...">` entries.

## API Rules

Follow the User Management controller/service style:

- Use `[ConfigurableAuthorize]`.
- Use `[RoutePrefix("api/<feature-route>")]`.
- Keep controllers thin.
- Keep Oracle/DataSet calls in services.
- Return structured JSON objects or raw `DataSet` consistently with the existing endpoint contract.
- Prefer API/DB messages over invented UI success text.
- Do not swallow exceptions silently.

For DataSet responses, Angular must normalize immediately in the feature API service.

## Maker-Checker and Approval Rules

Master/configuration features must reuse the tested Admin/User Management style, but must use separate PDF module approval objects:

- Live table.
- APP table.
- LOG table.
- Maker insert/update/delete request.
- Separate `MF_COMMON_APPROVAL_MASTER` queue.
- Separate `MF_COMMON_APPROVAL_MASTER_LOG` history.
- Separate `MF_COMMON_APPROVAL_IUDS` approval procedure.
- Separate `MF_GET_COMMON_APPROVAL_DATA` detail/list procedure.
- Checker approval/rejection.
- Maker cannot approve own record.
- Duplicate validation at API/DB level.
- API/DB is authoritative for final validation and authorization.

Do not use Admin approval tables for PDF module approvals:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
```

Do not extend Admin approval procedures for PDF module approvals:

```text
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
```

Use `MF_` standalone stored procedure names for PDF module DB APIs.

Master/configuration features include:

```text
AMC Master
Template Registry
Template Mapping Main
Template Mapping Field
Template Mapping Field Configuration
```

Operational Excel-to-PDF processing must not use APP tables or Common Approval. It uses row-level statuses and checker decisions as documented in the PDF module architecture context.

Operational features include:

```text
Excel Upload
Row Validation
Row Approval
Generated Documents
Operational Audit
```

## PDF.js and Coordinate Rules

Use PDF.js only for browser-side PDF viewing and coordinate interaction.

PDF.js may:

- Render template PDF pages.
- Read page dimensions and viewport information.
- Support zoom and page navigation.
- Show mapping overlays.
- Capture pointer-selected rectangles.
- Convert viewport coordinates to canonical PDF-space coordinates.

PDF.js must not:

- Act as the mapping database.
- Replace server-side validation.
- Replace final PDF generation.
- Receive unrestricted physical file paths.

Coordinate persistence must include:

- Page number.
- X position.
- Y position.
- Width.
- Height.
- Page rotation.
- Coordinate origin.
- Unit of measurement.

Never persist raw DOM, canvas, or zoom-dependent pixels.

## Routing and Navigation

Use lazy feature routes like User Management:

```ts
{
  path: 'pdf-coordinate-mapper/<feature-route>',
  loadChildren: () =>
    import('./features/pdf-coordinate-mapper/<feature-name>/<feature-name>.routes')
      .then((m) => m.<featureName>Routes)
}
```

Add shell navigation only for implemented routes. Do not add dead menu entries for future pages.

## Grids and Tables

Use AG Grid for operational data tables where the User Management module already does.

Grid expectations:

- Generated columns are allowed for raw DataSet result views.
- Hide internal IDs and sensitive values unless needed for operations.
- Keep action column stable.
- Use icon buttons with labels/tooltips.
- Use pagination.
- Use quick search and floating filters when practical.
- Keep horizontal scroll inside the grid.

Do not build custom pagination if AG Grid pagination is sufficient.

## Forms and Validation

Use Angular reactive forms for create/edit dialogs and workflow forms.

Validation expectations:

- Required fields have visible labels and errors.
- API/DB remains authoritative for duplicate checks and business rules.
- File upload features must validate extension, MIME type, size, and API response.
- PDF template features must validate page selections before submit.
- Mapping features must validate coordinate bounds and field configuration before submit.

Do not use browser `alert()`.

## Security and File Handling

- Do not expose physical file paths to the frontend.
- Load PDFs through authorized API endpoints.
- Download generated documents through authorized API endpoints.
- Keep sensitive investor values out of logs unless explicitly required by audit design.
- UI authorization is for usability only. API/DB authorization remains authoritative.

## Maker-Checker Update Rule

PDF module masters must follow the existing User Master / Role Master approval pattern:

- Insert requests create a new `_APP` row and one common approval row.
- When an insert is approved, the checker SP must back-fill `_APP.MST_COL_ID` with the live main-table `AUTOID`.
- Update and delete requests for an approved master must reuse the existing `_APP` row linked by `MST_COL_ID`.
- Update and delete requests must not create a duplicate live main-table row.
- The maker SP should set the reused `_APP` row back to `STATUS = 0` with `ACTION = 'UPDATE'` or `ACTION = 'D'`.
- A new `MF_COMMON_APPROVAL_MASTER` row is still created for every new approval request.
- Checker approval updates the existing live main-table row for update/delete actions.
- Log tables must receive entries for maker-submitted updates and checker-approved/rejected actions as applicable.
- Approval list joins should only surface pending common approval rows with `MF_COMMON_APPROVAL_MASTER.STATUS = 0`.

This rule applies to:

```text
MF_AMC_MASTER_IUDS
MF_TEMPLATE_MASTER_IUDS
MF_TEMPLATE_MAPPING_MASTER_IUDS
MF_COMMON_APPROVAL_IUDS
```

## Documentation Expectations for New Features

Before implementing a substantial PDF Coordinate Mapper feature, create or update a feature implementation context under:

```text
docs/PDFCordinateMapperModule/
```

Use this naming pattern:

```text
<feature-name>-implementation-context.md
```

Each feature context should include:

- Purpose.
- Scope.
- Out of scope.
- Existing User Management/Admin pattern being reused.
- API contract.
- DataSet table mapping, if applicable.
- Angular folder structure.
- Models.
- Service methods.
- Store state and methods.
- UI layout.
- Validation rules.
- Approval/status behavior.
- Verification checklist.

## Verification Checklist

For documentation-only changes:

```text
No build required unless source files changed.
```

For backend changes:

```text
dotnet build HDFC.PDFCoordinateMapper.sln
```

For Angular changes:

```text
cd HDFC.PDFCoordinateMapper.WebV1
npm run build
```

For combined feature work, run both.

## Final Rule

When in doubt, mirror the completed User Management module structure first, then adapt only the domain-specific parts required by PDF Coordinate Mapper.

Do not redesign the project architecture while implementing a feature.
