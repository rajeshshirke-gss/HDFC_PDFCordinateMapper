# PDF Module Standalone Stored Procedure Context

## Purpose

Use standalone Oracle stored procedures for the PDF Coordinate Mapper module.

Do not create `PKG_PDF_COORDINATE`.

The API should call named `MF_*` procedures directly. The Admin/User/Role stored procedures remain a structure reference only.

## Verified MCP Connection

Verified through SQLcl MCP using:

```text
Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.1.201)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=HDFCPDFMAP)));User ID=system;Password=***;
```

Connected database context:

```text
SESSION_USER   = SYSTEM
CURRENT_SCHEMA = SYSTEM
SERVICE_NAME   = HDFCPDFMAP
DB_NAME        = HDFCPDFM
```

## Current DB Setup Status

The PDF module tables are present and valid:

```text
MF_AMC_MASTER / MF_AMC_MASTER_APP / MF_AMC_MASTER_LOG
MF_TEMPLATE_MASTER / MF_TEMPLATE_MASTER_APP / MF_TEMPLATE_MASTER_LOG
MF_TEMPLATE_MAPPING_MAIN / MF_TEMPLATE_MAPPING_MAIN_APP / MF_TEMPLATE_MAPPING_MAIN_LOG
MF_TEMPLATE_MAPPING_FIELD / MF_TEMPLATE_MAPPING_FIELD_APP / MF_TEMPLATE_MAPPING_FIELD_LOG
MF_TEMPLATE_MAPPING_FIELD_CONFIG / MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP / MF_TEMPLATE_MAPPING_FIELD_CONFIG_LOG
MF_PDF_PROCESS_STATUS_MASTER
MF_PDF_PROCESS_BATCH
MF_PDF_PROCESS_ROW
MF_PDF_PROCESS_VALIDATION_ERROR
MF_PDF_GENERATED_DOCUMENT
MF_PDF_PROCESS_BATCH_LOG
MF_PDF_PROCESS_ROW_LOG
```

The PDF module status master is seeded for:

```text
BATCH
ROW
DOCUMENT
VALIDATION_ERROR
```

The following Admin procedures are present and valid, but are reference only for this module:

```text
USP_DDP_USERMASTER_IUDS
USP_DDP_ROLEMASTER_IUDS
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
USP_ADMIN_LOGIN
USP_GETMENU
USP_GETALLMODULE_MASTER_ACCESS
USP_USER_LOGOUT
```

## Important Setup Gap

Initial MCP verification found that the new `MF_*` tables had `AUTOID` and `LOGID` columns, but no generated-key setup:

```text
No MF_* sequences
No MF_* triggers
MF_* AUTOID/LOGID columns are not identity columns
```

Before standalone SPs can insert reliably, create either:

1. Sequences and before-insert triggers for all `MF_*` `AUTOID` and `LOGID` columns, which matches the existing Admin pattern best.
2. Or explicit ID generation inside every SP.

Recommended option: create sequences and triggers.

Existing Admin examples:

```text
USER_MASTER_APPROVAL_SEQ_TR
USER_MASTER_LOG_SEQ_TR
ROLE_MASTER_APPROVAL_SEQ_TR
ROLE_MASTER_LOG_SEQ_TR
DDP_COMMON_APPROVAL_ON_INSERT
DDP_COMMON_APPROVAL_MASTER_LOG_ON_INSERT
```

Use this script for the PDF module sequence and trigger setup:

```text
docs/PDFCordinateMapperModule/mf-pdf-module-sequences-and-triggers.sql
```

Execution status as of 31 July 2026:

```text
Executed directly on HDFCPDFMAP through SQLcl MCP.
22 MF_* sequences created or verified.
22 MF_* triggers created or replaced.
All 22 triggers are ENABLED.
No compile errors found in USER_ERRORS for MF_*_SEQ_TR triggers.
```

## Procedure Naming Standard

Create standalone procedures with `MF_` names:

```text
MF_AMC_MASTER_IUDS
MF_TEMPLATE_MASTER_IUDS
MF_TEMPLATE_MAPPING_IUDS
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
MF_PDF_PROCESS_BATCH_IUDS
MF_PDF_PROCESS_ROW_IUDS
MF_PDF_GENERATED_DOCUMENT_IUDS
MF_PDF_AUDIT_IUDS
```

Do not use package procedure names such as:

```text
PKG_PDF_COORDINATE.SP_GET_COORDINATES
PKG_PDF_COORDINATE.SP_SAVE_COORDINATE
```

## Master Procedure Pattern

Use this pattern for:

```text
AMC Master
Template Master
Template Mapping Main
Template Mapping Field
Template Mapping Field Configuration
```

These are master/configuration entities and must use APP/LOG and the PDF module's separate MF Common Approval tables.

Each master SP should support these actions:

```text
S or SELECT       - return all/live and approved/pending views as required
GETBYID          - return one record and related children
DROPDOWN         - return approved active reference data
INSERT           - insert pending APP record and MF Common Approval row
UPDATE           - insert/update pending APP record and MF Common Approval row
D or DELETE      - submit delete/deactivate request to APP and MF Common Approval
```

Return output through `SYS_REFCURSOR` parameters like existing Admin SPs.

Typical signature style:

```sql
CREATE OR REPLACE PROCEDURE MF_AMC_MASTER_IUDS
(
    p_Qflag        IN VARCHAR2,
    p_Auto_Id      IN NUMBER DEFAULT NULL,
    p_Mst_Col_Id   IN NUMBER DEFAULT NULL,
    p_Amc_Code     IN VARCHAR2 DEFAULT NULL,
    p_Amc_Name     IN VARCHAR2 DEFAULT NULL,
    p_Description  IN VARCHAR2 DEFAULT NULL,
    p_IsActive     IN VARCHAR2 DEFAULT NULL,
    p_UserId       IN VARCHAR2 DEFAULT NULL,
    p_Remark       IN VARCHAR2 DEFAULT NULL,
    cur            OUT SYS_REFCURSOR,
    cur1           OUT SYS_REFCURSOR
);
/
```

## MF Common Approval Integration

For `PDFCordinateMapperModule`, create separate approval tables:

```text
MF_COMMON_APPROVAL_MASTER
MF_COMMON_APPROVAL_MASTER_LOG
```

Do not insert PDF module approval requests into:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
```

Create separate approval procedures:

```text
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Do not extend Admin approval procedures for PDF module approvals:

```text
USP_COMMON_APPROVAL_IUDS
USP_GET_COMMAPPROVALDATA_CCIL
```

For master `INSERT`, `UPDATE`, and `DELETE`, the SP should:

1. Validate duplicates and required values.
2. Insert or update the relevant `_APP` table.
3. Capture the `_APP.AUTOID`.
4. Insert into `MF_COMMON_APPROVAL_MASTER`.
5. Return a DB message cursor.

Use these `MasterName` values consistently:

```text
AMC Master
Template Master
Template Mapping
```

## MF Approval Procedure Changes Required

Build the PDF module approval flow in:

```text
MF_COMMON_APPROVAL_IUDS
MF_GET_COMMON_APPROVAL_DATA
```

Required additions:

- Show `AMC Master`, `Template Master`, and `Template Mapping` in pending approval list.
- Prevent same-maker approval.
- On approve:
  - Update APP status/action remark.
  - Insert/update live table.
  - Insert LOG row.
  - Update `MF_COMMON_APPROVAL_MASTER`.
  - Insert `MF_COMMON_APPROVAL_MASTER_LOG`.
- On reject:
  - Update APP status/action remark.
  - Update `MF_COMMON_APPROVAL_MASTER`.
  - Insert `MF_COMMON_APPROVAL_MASTER_LOG`.
  - Preserve existing live data unchanged.

For Template Mapping, approval must be aggregate-level:

```text
MF_TEMPLATE_MAPPING_MAIN_APP
MF_TEMPLATE_MAPPING_FIELD_APP
MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP
```

Approve or reject the mapping as one logical unit. Do not approve individual fields separately.

## Operational Procedure Pattern

Operational Excel-to-PDF processing must not use APP tables or Common Approval.

Use direct operational SPs for:

```text
MF_PDF_PROCESS_BATCH
MF_PDF_PROCESS_ROW
MF_PDF_PROCESS_VALIDATION_ERROR
MF_PDF_GENERATED_DOCUMENT
MF_PDF_PROCESS_BATCH_LOG
MF_PDF_PROCESS_ROW_LOG
```

Recommended standalone procedures:

```text
MF_PDF_PROCESS_BATCH_IUDS
MF_PDF_PROCESS_ROW_IUDS
MF_PDF_GENERATED_DOCUMENT_IUDS
MF_PDF_AUDIT_IUDS
```

Operational actions:

```text
CREATE_BATCH
LOAD_ROWS
VALIDATE_BATCH
UPDATE_ROW
SUBMIT_FOR_CHECKER
APPROVE_ROW
REJECT_ROW
RECALCULATE_BATCH_STATUS
REGISTER_DRAFT_DOCUMENT
REGISTER_FINAL_DOCUMENT
MARK_DOWNLOAD
MARK_PRINT
GET_BATCHES
GET_ROWS
GET_ERRORS
GET_DOCUMENTS
GET_AUDIT
```

Checker decision rules:

- Checker approval/rejection is row-level.
- Rejection requires checker remark.
- Batch status is derived from row statuses.
- Final PDFs use approved rows only.

## Current API Config Change Required

Current `Web.config` still points to package SP names:

```text
SpGetCoordinates  = PKG_PDF_COORDINATE.SP_GET_COORDINATES
SpSaveCoordinate  = PKG_PDF_COORDINATE.SP_SAVE_COORDINATE
```

Since no package is required, change these settings later to standalone SPs, for example:

```text
SpGetCoordinates  = MF_TEMPLATE_MAPPING_GET_COORDINATES
SpSaveCoordinate  = MF_TEMPLATE_MAPPING_SAVE_COORDINATE
```

Or replace the legacy coordinate endpoint with the full Template Mapping API that calls:

```text
MF_TEMPLATE_MAPPING_IUDS
```

## Suggested Build Order

1. Create `MF_*` sequences and triggers for `AUTOID` and `LOGID`.
2. Create `MF_COMMON_APPROVAL_MASTER` and `MF_COMMON_APPROVAL_MASTER_LOG`.
3. Create sequences/triggers for the MF Common Approval tables.
4. Create `MF_AMC_MASTER_IUDS`.
5. Create `MF_TEMPLATE_MASTER_IUDS`.
6. Create `MF_TEMPLATE_MAPPING_IUDS`.
7. Create `MF_COMMON_APPROVAL_IUDS` and `MF_GET_COMMON_APPROVAL_DATA`.
8. Create operational process SPs.
9. Update API config/code to call standalone `MF_` SP names.
10. Test through API and Angular feature flows.

## Final Rule

Create standalone `MF_*` procedures only.

Do not create PDF module packages and do not use Admin `DDP_COMMON_APPROVAL_MASTER` for PDF module approvals unless a later requirement explicitly changes this decision.
