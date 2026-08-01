# Repository Agent Instructions

## Project Identity

This repository contains the HDFC PDF Coordinate Mapper solution.

- Backend solution: `HDFC.PDFCoordinateMapper.sln`
- API project: `HDFC.PDFCoordinateMapper.Api`
- API technology: ASP.NET Web API on .NET Framework 4.7.2 project format
- Frontend project: `HDFC.PDFCoordinateMapper.WebV1`
- Frontend technology: Angular standalone application

Do not treat the backend as an SDK-style .NET Core project when editing project files. It can currently be built with `dotnet build HDFC.PDFCoordinateMapper.sln`, but the project structure is legacy ASP.NET Web API.

## Mandatory Context Before PDF Coordinate Mapper Work

Before creating or changing any feature for `PDFCordinateMapperModule`, read:

```text
docs/PDFCordinateMapperModule/PDFCordinateMapperModule_Feature_Development_Context.md
docs/PDFCordinateMapperModule/pdf-coordinate-mapping-project-overview-architecture-context(2).md
docs/UserManagmentModule/User Master Standalone Angular Final Implementation Context.md
```

The User Management module is the mandatory implementation reference for Angular feature structure, API service boundaries, store/facade style, route style, UI layout, confirmation handling, DataSet adaptation, and build verification.

## Current Reference Implementation

Use these existing files as the closest code pattern:

```text
HDFC.PDFCoordinateMapper.WebV1/src/app/features/administration/users/
  user-master.models.ts
  user-master-api.service.ts
  user-master.store.ts
  user-master.page.ts
  user-master-form.dialog.ts
  user-master.routes.ts

HDFC.PDFCoordinateMapper.Api/Controllers/UserMasterController.cs
HDFC.PDFCoordinateMapper.Api/Services/UserMasterService.cs
HDFC.PDFCoordinateMapper.Api/Models/UserMasterModels.cs
HDFC.PDFCoordinateMapper.Api/App_Start/UnityConfig.cs
HDFC.PDFCoordinateMapper.Api/HDFC.PDFCoordinateMapper.Api.csproj
```

## Development Rules

- Keep PDF Coordinate Mapper features structurally aligned with the completed User Management module.
- Keep Angular pages as standalone feature pages with typed models, a feature API service, a signal-based store/facade, route file, and dialogs/components only when needed.
- Keep API DataSet parsing inside adapters, services, or stores. Do not parse raw DataSet shapes directly inside UI templates.
- Prefer existing shared utilities such as `src/app/core/api/dataset.adapter.ts`, `AuthStore`, and `ConfirmDialogComponent`.
- Do not invent sample or fallback data.
- Do not redesign Maker-Checker, Common Approval, status handling, APP/LOG table handling, or role/menu authorization patterns.
- For master-level PDF Coordinate Mapper features, reuse the tested Admin/User Management maker-checker and Common Approval approach.
- For operational Excel-to-PDF processing, follow the PDF module context: row-level checker decisions use operational statuses and do not use APP tables or Common Approval.
- Do not store PDF coordinates as raw browser or canvas pixels. Coordinates must be canonical, zoom-independent PDF-space values.
- Do not expose physical file paths to Angular. PDF and generated document access must go through authorized API endpoints.
- Update the legacy `.csproj` compile item list when adding backend `.cs` files.

## Verification

After code changes, run the relevant build:

```text
dotnet build HDFC.PDFCoordinateMapper.sln
npm run build
```

Run `npm run build` from:

```text
HDFC.PDFCoordinateMapper.WebV1
```

If a requested change is documentation-only, no build is required unless code or project files were touched.

