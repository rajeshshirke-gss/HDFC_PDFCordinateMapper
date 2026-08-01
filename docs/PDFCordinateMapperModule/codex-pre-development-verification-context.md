# Codex Task: Pre-Development Verification for PDF Coordinate Mapping Application

## 1. Task Mode

This is a **read-only verification and gap-analysis task**.

Do not start database development, stored-procedure development, API development, Angular development, PDF-engine development, refactoring, renaming, or file modification during this task.

The purpose is to inspect the actual repository and supplied reference files, verify the existing tested Admin-module implementation, reconcile the available project contexts, and produce a factual development-readiness report.

After producing the verification report, **stop and wait for approval**.

---

## 2. Primary Objective

Before development begins, verify that the PDF Coordinate Mapping requirements can be implemented using the existing application architecture.

The existing Admin module is already completed and tested. It includes the established implementation for:

- Login and authentication
- User Management
- Role Management
- Module Management
- Menu Management
- User-role mapping
- Role-module-menu access mapping
- Maker–Checker
- Common Approval
- Master-level status handling
- Master APP and LOG tables
- Master approval and rejection
- Existing API and Angular patterns

All new master-level functionality must follow the same tested Admin-module implementation.

Do not design a new Maker–Checker or Common Approval framework.

---

## 3. Required Source Files

Inspect the actual repository first and then review the following supplied reference files where available:

1. `pdf-coordinate-mapping-project-overview-architecture-context.md`
2. `MF_Template_Mapping_Create_Tables.sql`
3. `MF investment PDF Mapping _final.xlsx`
4. `template-registry 2.json`
5. `PDF Coordinate Mapping Understanding Document v2..docx`
6. `projectPrintContext.zip`
7. `DB Scrips with Modules Roles Menus Users Common Approval.zip`
8. Existing Admin-module database scripts
9. Existing Admin-module API source
10. Existing Admin-module Angular source
11. Existing Oracle data-access implementation
12. Existing project configuration and dependency files

If any listed source is not available in the repository, identify it as unavailable. Do not invent its contents.

---

## 4. Source Priority

Use the following priority when sources conflict.

### Priority 1: Actual working repository

The currently tested source code, database objects, APIs, Angular pages, configuration, and runtime behaviour are the implementation baseline.

### Priority 2: Existing tested Admin-module scripts

These define the mandatory pattern for:

- Table naming
- Live/APP/LOG structure
- Sequences
- Triggers
- Stored procedures
- Status values
- QFLAG or action handling
- Common Approval integration
- Maker/Checker controls
- Duplicate checks
- API contracts
- Angular approval behaviour

### Priority 3: Finalized current project context

Use:

```text
pdf-coordinate-mapping-project-overview-architecture-context.md
```

as the current functional and architecture baseline.

### Priority 4: Current proposed database script

Use:

```text
MF_Template_Mapping_Create_Tables.sql
```

as a proposed structure that must be verified against the tested Admin-module pattern.

It is not automatically approved merely because it exists.

### Priority 5: Current business samples

Use:

```text
MF investment PDF Mapping _final.xlsx
template-registry 2.json
```

to verify Excel headers, sample mappings, repeatable fields, page configuration, and expected data structures.

### Priority 6: Earlier understanding and historical contexts

The understanding document and files inside `projectPrintContext.zip` are historical references.

Do not treat them as final when they conflict with the current finalized architecture. Record every conflict instead of silently reconciling it.

---

## 5. Non-Negotiable Finalized Decisions

Verify that the proposed implementation supports the following decisions.

### 5.1 Existing Admin module

The Admin module is already completed and tested.

New master development must reuse its existing:

- Maker–Checker pattern
- Common Approval pattern
- Live/APP/LOG approach
- Status values
- Sequence and trigger approach
- Stored-procedure conventions
- API conventions
- Angular conventions
- Authorization rules

Do not redesign these mechanisms.

### 5.2 Master-level Maker–Checker

The following configuration areas require the same master-level Maker–Checker/Common Approval implementation as the Admin module:

```text
AMC Master
Template Master
Template Mapping Main
Template Mapping Field
Template Mapping Field Configuration
```

Expected logical table families are:

```text
MF_AMC_MASTER
MF_AMC_MASTER_APP
MF_AMC_MASTER_LOG

MF_TEMPLATE_MASTER
MF_TEMPLATE_MASTER_APP
MF_TEMPLATE_MASTER_LOG

MF_TEMPLATE_MAPPING_MAIN
MF_TEMPLATE_MAPPING_MAIN_APP
MF_TEMPLATE_MAPPING_MAIN_LOG

MF_TEMPLATE_MAPPING_FIELD
MF_TEMPLATE_MAPPING_FIELD_APP
MF_TEMPLATE_MAPPING_FIELD_LOG

MF_TEMPLATE_MAPPING_FIELD_CONFIG
MF_TEMPLATE_MAPPING_FIELD_CONFIG_APP
MF_TEMPLATE_MAPPING_FIELD_CONFIG_LOG
```

Verify the exact physical naming and structure from the tested Admin baseline before accepting these names.

### 5.3 Operational PDF-processing approval

The operational Excel-to-PDF process must **not** use:

- APP tables
- Common Approval
- Master-level Maker–Checker procedures

Operational approval is row-level and is controlled through `STATUS_ID`.

The operational process uses:

```text
MF_PDF_PROCESS_STATUS_MASTER
MF_PDF_PROCESS_BATCH
MF_PDF_PROCESS_ROW
MF_PDF_PROCESS_VALIDATION_ERROR
MF_PDF_GENERATED_DOCUMENT
MF_PDF_PROCESS_BATCH_LOG
MF_PDF_PROCESS_ROW_LOG
```

### 5.4 No physical processing group tables

Do not create:

```text
MF_PDF_PROCESS_GROUP
MF_PDF_PROCESS_GROUP_ROW
```

Grouping must be calculated logically using approved master configuration and process-row data.

### 5.5 No row-value child table

Do not create:

```text
MF_PDF_PROCESS_ROW_VALUE
```

The approved Excel input currently contains 54 business columns. These columns must be stored directly in:

```text
MF_PDF_PROCESS_ROW
```

Verify the exact 54 headers against the supplied Excel workbook.

### 5.6 Audit

Only two operational audit tables are required:

```text
MF_PDF_PROCESS_BATCH_LOG
MF_PDF_PROCESS_ROW_LOG
```

Batch log must cover batch, file, document-generation, download, print, completion, and failure events.

Row log must cover row load, edit, validation, submission, approval, rejection, status transition, and data snapshots.

### 5.7 Row-level Checker decision

Checker action is row-level:

```text
APPROVE
REJECT
```

A rejection remark is mandatory.

There is no refer-back status in the current operational workflow.

Rejected rows are not edited or resubmitted within the same submitted request unless a later approved requirement explicitly changes this.

### 5.8 Derived batch status

Verify support for this exact derivation:

```text
If any row is PENDING_FOR_APPROVAL:
    Batch = PENDING_FOR_APPROVAL

If no row is pending and all rows are APPROVED:
    Batch = APPROVED

If no row is pending and approved and rejected rows both exist:
    Batch = PARTIALLY_APPROVED

If no row is pending and all rows are REJECTED:
    Batch = REJECTED
```

Final PDFs use approved rows only.

### 5.9 Template configuration

`MF_TEMPLATE_MASTER` must hold:

- Approved AMC reference
- Template code and name
- PDF file metadata
- PDF page count
- Mapping page numbers
- Printing page numbers
- Repeat rows per page
- Active/inactive status
- Digital-signature detection information where applicable

Mapping pages and printing pages are maintained in Template Master, not Mapping Field Configuration.

Repeat rows per page is maintained in Template Master, not Mapping Field Configuration.

### 5.10 Excel header management

Excel headers are maintained directly in:

```text
MF_TEMPLATE_MAPPING_FIELD
```

Do not introduce a separate Excel Header Master unless an existing tested repository requirement proves that it is already mandatory.

### 5.11 Mapping field types

The finalized field types are:

```text
TEXT_FIELD
CHAR_GRID
DATE_GRID
OPTION_GROUP
COMPUTED_FIELD
```

Historical references to additional automatic geometric patterns must not be implemented unless separately approved.

### 5.12 Scheme and ISIN masters

Scheme Master and ISIN Master are not required in the current phase.

Do not add them based only on older documents.

---

## 6. Mandatory Repository Verification

## 6.1 Repository inventory

Identify and report:

- Solution and project names
- API technology and exact framework version
- Angular version
- Oracle provider and data-access pattern
- Existing folder/module structure
- Authentication mechanism
- Authorization mechanism
- Logging framework
- File-storage implementation
- Existing PDF libraries
- Existing Excel libraries
- Unit-test projects
- Build scripts
- Environment configuration
- Deployment configuration

Do not assume the API is .NET Core, .NET Framework 4.5, or .NET Framework 4.7.2. Verify the actual project files.

## 6.2 Existing Admin-module implementation

Locate the complete implementation for at least one working master that uses Maker–Checker and Common Approval.

Trace it end to end:

```text
Angular screen
→ Angular service
→ API controller
→ request/response model
→ data-access call
→ Oracle stored procedure
→ live/APP/LOG tables
→ Common Approval
→ Checker approval/rejection
```

Record exact file names, class names, method names, routes, stored-procedure names, table names, QFLAG values, status values, and transaction behaviour.

Do not describe a theoretical pattern. Document the actual tested implementation.

## 6.3 Common Approval verification

The supplied scripts appear to use names such as:

```text
DDP_COMMON_APPROVAL_MASTER
DDP_COMMON_APPROVAL_MASTER_LOG
USP_DDP_COMMON_APPROVAL_IUDS
```

Earlier project discussion used a different name:

```text
PMS_COMMON_APPROVAL_MASTER
```

Verify the actual physical table and procedure names used by the repository.

This naming discrepancy must be explicitly reported.

Also verify:

- Common Approval master columns
- Common Approval log columns
- Status meanings
- Action meanings
- Master-name values
- QFLAG values
- Same-user approval prevention
- Approval and rejection remarks
- Delete approval handling
- Bulk approval behaviour
- Whether the stored procedure contains hard-coded branches for each master
- Exact changes required to register AMC, Template, and Mapping masters

Do not rename the existing Common Approval objects.

## 6.4 Status verification

Extract the actual tested Admin status matrix.

The supplied Common Approval script references values including:

```text
0
1
3
4
5
```

Do not assign meanings from assumption.

Trace each status through:

- APP tables
- Live tables
- LOG tables
- Common Approval tables
- Stored procedures
- API response
- Angular display

Produce an exact status dictionary supported by code evidence.

Operational PDF-processing statuses may use a separate status master, but their numeric IDs must not conflict conceptually with master approval statuses.

## 6.5 Sequence and trigger verification

The proposed `MF_Template_Mapping_Create_Tables.sql` does not include final sequence and trigger scripts.

Verify the tested Admin-module convention for:

- Sequence naming
- Trigger naming
- AUTOID population
- LOGID population
- Whether sequences are global or table-specific
- Trigger timing
- Insert behaviour
- Any audit-column population

List every missing sequence and trigger required for the new tables.

Do not create them during this verification task.

## 6.6 Stored-procedure verification

Identify the tested stored-procedure pattern for master IUDS and approval.

Verify:

- Procedure naming convention
- Parameter naming
- Cursor output pattern
- QFLAG/action values
- Duplicate-check logic
- Insert behaviour
- Update behaviour
- Delete request behaviour
- Approval behaviour
- Rejection behaviour
- LOG insertion
- Common Approval insertion/update
- Exception handling
- Commit/rollback ownership

Determine whether:

- AMC Master needs one new IUDS procedure
- Template Master needs one new IUDS procedure
- Mapping Main/Field/Config should be handled by one aggregate procedure or multiple procedures
- Common Approval procedure requires new hard-coded branches
- Mapping approval can be atomic across header, fields, and field configuration

Report the safest pattern based on the existing tested code. Do not implement it.

---

## 7. Database Verification

## 7.1 Verify proposed template and mapping tables

Compare every column in `MF_Template_Mapping_Create_Tables.sql` with the tested Admin-module conventions.

Check:

- Live/APP/LOG structural alignment
- `AUTOID`, `LOGID`, and `MST_COL_ID`
- Status datatype
- Action fields
- Action remark fields
- Created/modified/approved columns
- User-ID datatype and length
- Timestamp datatype
- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Indexes
- Sequence requirements
- Trigger requirements
- Approved-record lookup performance
- Duplicate detection

Report each difference as:

```text
MATCH
ACCEPTABLE PROJECT-SPECIFIC DIFFERENCE
REQUIRES CHANGE
REQUIRES BUSINESS CONFIRMATION
```

## 7.2 Verify AMC Master completeness

AMC Master Maker–Checker is currently required but may not be present in the proposed table script.

Verify whether an AMC Master already exists in the repository.

If it exists:

- Record exact table/SP/API/UI names.
- Verify whether it already supports Maker–Checker/Common Approval.
- Determine whether it can be reused without modification.

If it does not exist:

- Identify the exact Admin master that should be used as the structural reference.
- List the minimum AMC fields supported by current requirements.
- Do not invent additional AMC attributes.

## 7.3 Verify operational tables

Confirm whether DDL already exists for:

```text
MF_PDF_PROCESS_STATUS_MASTER
MF_PDF_PROCESS_BATCH
MF_PDF_PROCESS_ROW
MF_PDF_PROCESS_VALIDATION_ERROR
MF_PDF_GENERATED_DOCUMENT
MF_PDF_PROCESS_BATCH_LOG
MF_PDF_PROCESS_ROW_LOG
```

For each table, report:

- Present or missing
- Column completeness
- Constraint completeness
- Index completeness
- Sequence/trigger completeness
- Alignment with current requirements

## 7.4 Verify the 54 Excel columns

Open:

```text
MF investment PDF Mapping _final.xlsx
```

Verify:

- Sheet name
- Header row number
- Data-start row number
- Exact number of business headers
- Exact header text
- Duplicate or near-duplicate headers
- Blank headers
- Sample data
- Fields that may contain leading zeroes
- Fields that look numeric but must be stored as text
- Dates stored as text or Excel serial values
- Repeating scheme columns
- Applicant-level fields
- Nominee-level fields
- Candidate logical grouping fields

Compare the workbook headers against `MF_PDF_PROCESS_ROW`.

Produce a column-by-column mapping:

```text
Excel sequence
Excel header
Database column
Datatype
Maximum observed length
Nullable in sample
Potential normalization
Mismatch, if any
```

Do not change the workbook or table during verification.

## 7.5 Verify template-registry JSON

Inspect:

```text
template-registry 2.json
```

Verify:

- Number of template records
- Template identifiers
- AMC identifiers/names
- Mapping pages
- Printing pages
- Field UIDs/codes
- Excel headers
- Field types
- Coordinates
- Repeat groups
- Option groups
- Field configuration
- Any concepts not represented by the proposed database tables
- Any database columns that have no supporting JSON requirement

Report mismatches without modifying either source.

---

## 8. Requirement Conflict Verification

Create a conflict matrix covering at least the following known areas.

### 8.1 PDF-generation location

Historical context may describe browser-side generation using `pdf-lib`.

Current architecture describes an ASP.NET API and a PDF-rendering component.

Verify actual repository libraries and current intended ownership.

Do not select client-side or server-side generation without evidence.

### 8.2 Mapping storage

Historical context may describe exported JSON as the primary mapping contract.

Current design stores approved mapping configuration in Oracle tables.

Verify whether JSON remains:

- Import/export only
- Runtime cache
- Migration input
- Not required

### 8.3 Automatic field discovery

Historical context refers to:

- OCR
- PDF text-layer scanning
- Automatic geometric detection
- Zero-config mapping
- Thirteen geometric patterns

Current finalized scope uses manual/configured mapping and five field types.

Record this as a conflict and treat automatic discovery as out of scope unless confirmed by current repository requirements.

### 8.4 Grouping logic

Historical context contains examples such as:

```text
Fund Name + First Applicant Name
```

Current design states grouping is logical and based on approved master data, but the final business grouping key may still need confirmation.

Do not hard-code a grouping key.

Identify all candidate fields from the Excel sample and existing documents, then mark the final grouping key as either:

```text
VERIFIED
NOT VERIFIED
```

### 8.5 Page-generation logic

Historical context may assume one PDF page per Excel row.

Current design requires grouped records and repeatable rows with capacity configured in `MF_TEMPLATE_MASTER`.

Verify the expected page duplication/order from current template samples.

Do not implement one-page-per-row logic by default.

### 8.6 Technology version

Historical files refer to differing platform versions.

Verify actual:

- Angular version
- .NET/API framework and version
- Oracle version, if available
- PDF library
- Excel library

### 8.7 Common Approval object names

Explicitly reconcile:

```text
PMS_COMMON_APPROVAL_MASTER
```

versus:

```text
DDP_COMMON_APPROVAL_MASTER
```

The actual tested repository is authoritative.

---

## 9. API and Angular Verification

## 9.1 Existing API pattern

For the tested Admin master used as reference, document:

- Controller
- Route
- HTTP method
- Request model
- Response model
- Service/repository layer
- Entity Framework or Oracle command usage
- Stored-procedure invocation
- Cursor/result handling
- Error response
- Logging
- Authorization attribute
- Transaction handling

## 9.2 Existing Angular pattern

Document:

- Module or standalone-component architecture
- Routing
- Menu permission handling
- All tab
- Approved tab
- Pending/Common Approval screen
- Add/edit form pattern
- Form validation
- Grid component
- Pagination
- Search/filtering
- Active/inactive control
- Maker action handling
- Checker action handling
- Approval/rejection dialog
- API service pattern
- Error-message handling
- Notification/toast pattern

## 9.3 Reuse assessment

For each proposed new page, identify the closest tested Admin page that should be reused as a pattern:

```text
AMC Master
Template Registry
Mapping Studio
Excel Upload and Validation
Maker Review
Checker Row Approval
Generated Documents
Audit History
```

Do not create UI code during verification.

---

## 10. Security Verification

Verify:

- Existing authentication
- Existing authorization claims or session model
- Module/menu/role permission enforcement
- Maker cannot approve own master request
- API-level permission checks
- File upload restrictions
- PDF MIME and signature validation
- Excel file restrictions
- File-path exposure
- Download authorization
- Audit-table write restrictions
- SQL-injection protection
- Computed-field expression safety
- Logging of sensitive applicant information
- PAN/account/mobile masking requirements, if present

Report unsupported security assumptions as gaps.

---

## 11. Transaction and Audit Verification

Verify current transaction ownership:

- Oracle stored procedure
- API transaction
- Both
- Neither

For the new design, determine how the existing tested pattern can guarantee atomicity for:

### Master request

```text
APP insert/update
+ Common Approval entry
```

### Master approval

```text
APP status update
+ live-table insert/update
+ LOG insert
+ Common Approval update/log
```

### Process-row decision

```text
row status update
+ row audit insert
+ batch status recalculation
+ batch update
+ batch audit insert
```

### Final document generation

```text
approved-row selection
+ file generation
+ generated-document record
+ batch update
+ batch audit
```

Identify any risk of database/file-system inconsistency.

---

## 12. Required Codex Deliverable

Create one Markdown report:

```text
docs/pdf-coordinate-mapping/pre-development-verification-report.md
```

If that folder does not exist, create only the documentation folder and report. Do not change application source code or database scripts.

The report must contain the following sections.

### 12.1 Executive readiness summary

Use one verdict:

```text
READY
READY WITH NON-BLOCKING GAPS
NOT READY
```

Explain the evidence.

### 12.2 Repository inventory

List the actual technologies, projects, modules, and relevant files.

### 12.3 Existing Admin baseline

Document the complete tested Maker–Checker/Common Approval implementation with file and object references.

### 12.4 Database object inventory

Use a table with:

```text
Required object
Existing object
Status
Evidence
Required action
```

### 12.5 Status dictionary

List actual Admin/Common Approval statuses and proposed operational statuses separately.

### 12.6 Source conflict matrix

Use:

```text
Topic
Source A
Source B
Actual repository evidence
Decision
Remaining confirmation
```

### 12.7 Excel-to-database mapping

Include all 54 headers and their proposed database columns.

### 12.8 Template JSON-to-database mapping

Map JSON concepts to the proposed template/mapping tables.

### 12.9 API and Angular reuse matrix

For every new feature, identify the existing tested implementation pattern to reuse.

### 12.10 Missing objects and changes

Separate into:

```text
Database
Stored procedures
Common Approval
API
Angular
PDF engine
File storage
Tests
Configuration
```

### 12.11 Blocking decisions

List only decisions that genuinely prevent safe development.

Do not repeat already finalized decisions.

### 12.12 Recommended development order

Provide a dependency-based order, but do not begin implementation.

### 12.13 Final no-change confirmation

Confirm that this verification task made no changes to:

- Existing source code
- Existing SQL scripts
- Database objects
- API contracts
- Angular pages
- Configuration
- Uploaded business files

---

## 13. Evidence Requirements

Every finding must cite evidence using:

- Repository-relative file path
- Class/procedure/table name
- Method or route
- Line range where practical

Example:

```text
Evidence:
DB/CommonApproval/CommonApproval-SP.txt
Procedure: USP_DDP_COMMON_APPROVAL_IUDS
Lines: 50–75
Finding: Same user cannot approve the record.
```

Do not use statements such as:

```text
It appears
Probably
Likely
Normally
Best practice suggests
```

unless clearly marked as inference.

Separate every conclusion into:

```text
Verified fact
Conflict
Gap
Inference
Recommendation
```

---

## 14. Prohibited Actions

During this verification task, do not:

- Implement any feature
- Modify existing code
- Modify SQL scripts
- Generate final DDL
- Generate stored procedures
- Add sequences or triggers
- Add API endpoints
- Add Angular components
- Rename existing objects
- Replace the Admin approval pattern
- Introduce a new status convention
- Add Scheme Master
- Add ISIN Master
- Add process-group tables
- Add process-row-value tables
- Add OCR or automatic mapping
- Assume client-side PDF generation
- Assume server-side PDF generation
- Hard-code the grouping key
- Hard-code template-selection rules
- Resolve source conflicts silently
- Mark the project ready without evidence

---

## 15. Completion Condition

The verification task is complete only when Codex has:

1. Inspected the actual repository.
2. Traced one tested Admin master end to end.
3. Extracted the actual Common Approval pattern.
4. Identified the actual status values.
5. Compared the proposed tables with the existing Admin conventions.
6. Verified all 54 Excel headers.
7. Compared template JSON with the proposed database structure.
8. Recorded all historical-context conflicts.
9. Listed missing database, API, Angular, PDF, and test work.
10. Produced the required readiness report.
11. Stopped without implementation.

Do not proceed to development until the verification report is reviewed and approved.
