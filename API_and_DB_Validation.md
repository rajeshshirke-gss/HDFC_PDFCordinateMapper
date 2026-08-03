# Codex Task: Analyse Existing Login, User, Role, Module and Menu APIs Before Implementing the Angular UI

## 1. Current Project Status

Database and ASP.NET Web API development has been completed for the following functional areas:

* Login and authentication
* User Management
* Role Management
* Module Management
* Menu Management
* User-role mapping
* Role-module-menu access mapping
* Logged-in user menu access
* Common Approval, where applicable

The API is implemented using:

```text
ASP.NET Web API
.NET Framework 4.7.2
```

The next major activity is Angular UI development.

However, Angular implementation must not begin until the existing database and API implementation has been fully analysed and documented.

This task is:

```text
Phase 1 — Database and API Discovery and Verification
```

Do not implement Angular screens during this phase.

---

# 2. Primary Objective

Analyse the complete database and ASP.NET Web API implementation related to:

* Authentication
* Users
* Roles
* Modules
* Menus
* User-role assignments
* Role-module-menu permissions
* Logged-in user access
* Common Approval

The analysis must establish the actual end-to-end contract that the Angular application will consume.

Codex must trace every operation through the complete implementation path:

```text
Angular-facing API endpoint
    → ASP.NET Web API Controller
        → Service or Business Layer
            → Repository or Database Helper
                → Oracle Stored Procedure or Function
                    → Tables, Views, Sequences and Triggers
                        → Output cursors, DataSet tables, status and message
```

Do not rely only on:

* Controller method names
* Method comments
* Stored procedure names
* Existing documentation
* Assumed naming conventions

Verify the actual implementation in code and database scripts.

---

# 3. Important Scope Rule

This phase is for analysis and verification only.

Do not:

* Implement Angular components.
* Modify Angular files.
* Modify database objects.
* Modify API controllers.
* Modify service classes.
* Modify repositories.
* Rename tables.
* Rename stored procedures.
* Rename functions.
* Rename sequences.
* Rename triggers.
* Introduce new APIs.
* Add mock APIs.
* Correct identified issues automatically.
* Refactor unrelated code.
* Invent missing behaviour.
* Migrate the API to ASP.NET Core.
* Introduce ASP.NET Core authentication patterns.

If an issue is identified, document it together with the recommended minimal correction.

Any implementation change will be handled through a separate approved task.

---

# 4. Technology Identification

Before analysing individual features, document the actual technology stack.

## 4.1 API technology

Confirm and document:

* .NET Framework version
* ASP.NET Web API version
* Project type
* Hosting model
* IIS configuration, where available
* `Global.asax` configuration
* `WebApiConfig`
* `RouteConfig`, where applicable
* `FilterConfig`
* `Startup` or OWIN startup class, if present
* Dependency injection library, if present
* Authentication middleware, if present
* JSON serializer configuration
* CORS configuration
* Logging framework
* Oracle client library
* API documentation mechanism

Do not assume ASP.NET Core concepts such as:

* `Program.cs`
* ASP.NET Core middleware pipeline
* ASP.NET Core dependency injection
* ASP.NET Core authentication handlers
* `IConfiguration`
* `appsettings.json`

Use the actual .NET Framework 4.7.2 implementation.

## 4.2 Database technology

Confirm:

* Oracle database version, where available
* Schema or schemas used
* Oracle client library
* Managed or unmanaged Oracle provider
* Connection-string source
* Database helper implementation
* Stored procedure calling convention
* Cursor handling
* Transaction handling
* Command timeout handling
* `BindByName` usage
* `DataSet` and `DataTable` population pattern

Do not assume all objects belong to one Oracle schema.

---

# 5. Repository Discovery

Identify and document:

* Visual Studio solution path
* ASP.NET Web API project path
* Angular project path
* Business/service layer projects
* Data-access projects
* Shared/common library projects
* Database scripts path
* Test project path
* Documentation path
* `Web.config`
* Environment-specific configuration files
* Swagger configuration, where present
* Postman collections, where available

Create a high-level solution dependency diagram.

Example:

```text
Web API Project
    → Business or Service Project
        → Data Access Project
            → Oracle Database

Web API Project
    → Shared Models
    → Common Utilities
    → Authentication Utilities
```

Use the actual project references.

---

# 6. Mandatory ASP.NET Web API Analysis

## 6.1 Controllers

Inspect all relevant classes derived from:

```csharp
ApiController
```

For every controller and action, document:

* Controller name
* Route prefix
* Action route
* Conventional or attribute routing
* HTTP method
* Request source
* Request model
* Return type
* Authorization attribute
* Custom authorization filter
* Exception filter
* Logging
* Status-code handling
* Business layer called
* Database operation triggered

Verify use of attributes such as:

```csharp
[RoutePrefix]
[Route]
[HttpGet]
[HttpPost]
[HttpPut]
[HttpDelete]
[Authorize]
[AllowAnonymous]
```

Also inspect custom filters such as:

```csharp
AuthorizationFilterAttribute
ActionFilterAttribute
ExceptionFilterAttribute
```

Do not assume an action is protected merely because the controller has an authorization attribute. Verify inherited and overridden behaviour.

---

# 7. Authentication and Login Analysis

Determine the actual authentication mechanism.

Possible implementations may include:

* Forms authentication
* ASP.NET Identity
* JWT issued manually
* OWIN OAuth bearer authentication
* Session-based authentication
* Custom token authentication
* Custom database session validation
* Windows authentication
* Azure AD or SSO integration
* Hybrid authentication

Inspect:

* `Web.config`
* `Global.asax`
* OWIN startup class
* OAuth provider classes
* Token generation utilities
* Login controller
* Session validation code
* Custom authorization filters
* Password encryption/decryption utilities
* Password hashing
* Login stored procedures
* Session tables
* Login audit tables

Document the complete login flow:

```text
Login request
    → Credential validation
        → User lookup
            → Password validation
                → Role and menu lookup
                    → Token or session generation
                        → API response
```

Verify:

* Login request fields
* Encryption expected from the client
* Password validation method
* Token or session format
* Expiry
* Session storage
* Account lock rules
* Failed-login count
* User active status
* Password expiry
* First-login behaviour
* Concurrent-session handling
* Logout behaviour
* Session invalidation

Do not recommend replacing the existing mechanism during this analysis.

---

# 8. JWT or Token Verification

Where JWT or another bearer token is used, verify:

* Token-generation code
* Signing algorithm
* Signing key source
* Issuer
* Audience
* Expiry
* Clock-skew handling
* Claims
* Token validation
* Authorization header format
* OWIN middleware configuration
* Custom token validation
* Refresh-token support, if any
* Revocation or logout handling

Do not apply ASP.NET Core classes such as:

```csharp
AddAuthentication
JwtBearerDefaults
TokenValidationParameters configured in Program.cs
```

unless the application explicitly uses compatible libraries through OWIN.

Use the actual .NET Framework/OWIN implementation.

---

# 9. Claims Analysis

Identify every claim created during login.

Document:

| Claim Name | Source | Value | Purpose | Used By |
| ---------- | ------ | ----- | ------- | ------- |

Verify possible claims such as:

* User ID
* User name
* Login name
* Email ID
* Role ID
* Role name
* User type
* Module ID
* Menu ID
* Permission code
* Session ID

Confirm how claims are read in .NET Framework code, for example:

```csharp
User.Identity.Name
ClaimsPrincipal.Current
Thread.CurrentPrincipal
HttpContext.Current.User
User.IsInRole(...)
```

Do not assume the role claim is mapped automatically.

Verify:

* Exact claim type
* Exact role claim type
* Whether `User.IsInRole()` works
* Whether custom role authorization is used
* Whether role values are empty or populated
* Whether menu permission is claim-based or database-based

---

# 10. Request and Response Model Analysis

Inspect:

* Request DTOs
* Response DTOs
* View models
* Data contracts
* Database parameter models
* Shared models
* Validation attributes
* Nullable properties
* Default values
* Operation flags
* Date formats
* Boolean representations
* Numeric ID types
* List payloads
* Mapping payloads

Document for each request model:

| Property | Type | Mandatory | Default | Validation | DB Parameter | Notes |
| -------- | ---- | --------: | ------- | ---------- | ------------ | ----- |

Document for each response model:

| Property | Type | Source | Nullable | Meaning |
| -------- | ---- | ------ | -------: | ------- |

Verify whether request models are bound from:

* Request body
* Query string
* Route
* Headers
* Form data
* Multipart form data

---

# 11. Service and Business Layer Analysis

Inspect:

* Service interfaces
* Service implementations
* Business manager classes
* Static helper classes
* Controller-to-service dependency pattern
* Exception handling
* Logging
* Validation
* Transaction boundaries
* Data transformation
* DataSet interpretation

For every controller action, identify the exact business method called.

Document:

| Controller Action | Service Method | Repository/DB Method | Stored Procedure |
| ----------------- | -------------- | -------------------- | ---------------- |

Verify whether business logic exists in:

* Controller
* Service
* Repository
* Stored procedure
* Utility class

Do not assume all business validation is located in the stored procedure.

---

# 12. Repository and Database Helper Analysis

Inspect the actual Oracle execution mechanism.

Verify:

* Oracle connection creation
* Connection-string retrieval
* `OracleCommand`
* `CommandType.StoredProcedure`
* `OracleParameter`
* `OracleDbType`
* Parameter direction
* Parameter size
* Cursor parameters
* `OracleDataAdapter`
* `DataSet`
* `DataTable`
* Transaction handling
* Connection disposal
* Command disposal
* Exception logging
* Command timeout
* `BindByName`

Document whether the application uses:

* `Oracle.ManagedDataAccess`
* `Oracle.DataAccess`
* `System.Data.OracleClient`
* Custom Oracle wrappers

For every stored procedure call, compare the API parameter definition with the database definition.

---

# 13. Mandatory Database Object Analysis

Codex must verify all Oracle objects used directly or indirectly by the relevant API operations.

The analysis must cover:

* Tables
* Views
* Stored procedures
* Functions
* Packages, where used
* Triggers
* Sequences
* Indexes
* Primary keys
* Foreign keys
* Unique constraints
* Check constraints
* Synonyms, where used

---

# 14. Table Analysis

For every relevant table, document:

* Schema
* Table name
* Business purpose
* Primary key
* Foreign keys
* Unique constraints
* Check constraints
* Mandatory columns
* Nullable columns
* Data types
* Column sizes
* Default values
* Active flag
* Approval status
* Maker fields
* Checker fields
* Rejection remarks
* Created-by field
* Created-date field
* Updated-by field
* Updated-date field
* Soft-delete field
* Record version or locking field
* Indexes

Create a table inventory:

| Table | Purpose | Primary Key | Main Relationships | Used By |
| ----- | ------- | ----------- | ------------------ | ------- |

Verify whether tables support:

* Duplicate prevention
* Active/inactive records
* Maker-checker workflow
* Approval status
* Audit history
* Logical delete
* Account lock
* Password history
* Session tracking
* Menu hierarchy
* Role-menu mapping
* User-role mapping

---

# 15. Stored Procedure Analysis

For every stored procedure used by the API, document:

* Schema
* Procedure name
* Purpose
* Calling API endpoint
* Calling service method
* Input parameters
* Output parameters
* Parameter types
* Parameter sizes
* Default values
* Operation flags
* Tables read
* Tables inserted
* Tables updated
* Tables deleted
* Functions called
* Procedures called
* Sequences used
* Exception handling
* Transaction handling
* Commit behaviour
* Rollback behaviour
* Output cursors
* Status values
* Message values

Create a stored procedure inventory:

| Procedure | Feature | API Endpoint | Flags | Tables | Output |
| --------- | ------- | ------------ | ----- | ------ | ------ |

For operation-flag procedures, document every supported flag separately.

Example:

| Flag | Operation | Input Required | Table Impact | Output |
| ---- | --------- | -------------- | ------------ | ------ |

Do not document only the flags currently used by the API. Also identify implemented flags that are not currently exposed through an API.

---

# 16. API-to-Stored-Procedure Parameter Verification

For every stored procedure call, create this comparison:

| API Property | Oracle Parameter | Direction | .NET Type | Oracle Type | Size | Nullable | Match |
| ------------ | ---------------- | --------- | --------- | ----------- | ---: | -------: | ----- |

Verify:

* Exact parameter name
* Parameter direction
* Parameter order
* `BindByName`
* Data type
* Size
* Nullable handling
* Empty string handling
* Date conversion
* Timestamp conversion
* Number conversion
* Boolean conversion
* Cursor definition

Highlight:

* Missing parameters
* Additional parameters
* Incorrect sizes
* Incorrect directions
* Incorrect Oracle types
* Positional binding risks
* Null handling differences

---

# 17. Function Analysis

For every Oracle function used directly or indirectly, document:

* Schema
* Function name
* Purpose
* Input parameters
* Return type
* Tables read
* Procedures/functions called
* Calling stored procedure
* Exception handling
* Null behaviour
* Security implications
* Performance implications

Create a function inventory:

| Function | Purpose | Called By | Return Type | Tables Used |
| -------- | ------- | --------- | ----------- | ----------- |

Verify functions used for:

* Password processing
* User validation
* Role validation
* Duplicate checking
* Menu hierarchy
* Approval status
* Audit generation
* ID or code generation

---

# 18. Trigger Analysis

For every trigger on relevant tables, document:

* Schema
* Trigger name
* Table
* Trigger timing
* Trigger event
* Row-level or statement-level
* Purpose
* Columns affected
* Tables affected
* Sequence used
* Audit behaviour
* Approval behaviour
* Error behaviour

Create a trigger inventory:

| Trigger | Table | Event | Purpose | Side Effects |
| ------- | ----- | ----- | ------- | ------------ |

Verify whether triggers:

* Generate primary keys
* Maintain audit tables
* Change approval status
* Populate timestamps
* Restrict updates
* Create history
* Cascade changes
* Introduce hidden side effects

---

# 19. Sequence Analysis

For every relevant sequence, document:

* Schema
* Sequence name
* Used by table
* Used by procedure or trigger
* Start value
* Increment
* Cache
* Cycle setting
* Maximum value, where defined

Create a sequence inventory:

| Sequence | Used For | Used By | Target Column |
| -------- | -------- | ------- | ------------- |

Verify:

* Every insert receives a valid key.
* The same sequence is not incorrectly shared.
* Sequence calls are not duplicated between API, procedure and trigger.
* Primary-key generation is consistent.

---

# 20. Constraint and Index Analysis

Verify:

* Primary keys
* Foreign keys
* Unique constraints
* Check constraints
* Non-unique indexes
* Composite indexes
* Function-based indexes, where present

Confirm whether database-level protection exists for:

* Duplicate usernames
* Duplicate role names
* Duplicate module names or codes
* Duplicate menu names or codes
* Duplicate user-role mappings
* Duplicate role-menu mappings
* Invalid parent menu
* Invalid status
* Self-referencing hierarchy
* Orphaned mapping records

Identify cases where duplicate validation exists only in a stored procedure but not through a unique constraint.

Do not automatically add constraints. Document the risk.

---

# 21. Mandatory Functional API Inventory

Analyse all APIs related to the following features.

## 21.1 Authentication

* Login
* Logout
* Current user
* Session validation
* Token validation
* Password change
* Password reset
* Account unlock
* Failed-login handling
* Menu retrieval after login

## 21.2 User Management

* User list
* User details
* User create
* User update
* User activate
* User deactivate
* User delete
* User unlock
* User-role assignment
* Password reset
* Dropdown APIs
* Audit/history
* Approval submission

## 21.3 Role Management

* Role list
* Role details
* Role create
* Role update
* Role activate
* Role deactivate
* Role delete
* Role-module mapping
* Role-menu mapping
* Permission mapping
* Audit/history
* Approval submission

## 21.4 Module Management

* Module list
* Module details
* Module create
* Module update
* Module activate
* Module deactivate
* Module delete
* Audit/history
* Approval submission

## 21.5 Menu Management

* Menu list
* Menu details
* Menu create
* Menu update
* Menu activate
* Menu deactivate
* Menu delete
* Parent-menu lookup
* Module lookup
* Menu hierarchy
* Display order
* Route configuration
* Audit/history
* Approval submission

## 21.6 Access Management

* User-role mapping
* Role-module mapping
* Role-menu mapping
* Action permission mapping
* Logged-in user menu access
* Logged-in user action access

## 21.7 Common Approval

* Approval summary
* Pending record list
* Approval details
* Approve
* Reject
* Rejection remarks
* Maker-checker validation
* Approval audit
* Approved record retrieval

---

# 22. API Inventory Format

Create one consolidated API inventory:

| Feature | Controller | Endpoint | Method | Authorization | Request | Response | Service | SP/Function | Main Tables |
| ------- | ---------- | -------- | ------ | ------------- | ------- | -------- | ------- | ----------- | ----------- |

For every endpoint, also document:

* Request example
* Success response example
* Failure response example
* Empty-data response
* Validation response
* Authorization behaviour
* Stored procedure result interpretation

Do not invent sample values that change the meaning of the contract.

---

# 23. DataSet and Multiple-Table Response Analysis

For APIs returning `DataSet`, document every table by index.

Use this format:

| Table Index | Runtime Table Name | Purpose | Columns | Empty Behaviour |
| ----------: | ------------------ | ------- | ------- | --------------- |

Verify:

* Main data table
* Status table
* Message table
* Count table
* Dropdown table
* Permission table
* Menu hierarchy table
* Audit table
* Approval table

Do not assume:

```text
Table[0] = main data
Table[1] = status
```

Verify every endpoint independently.

Also document how the API serializes the `DataSet`, including names such as:

```text
Table
Table1
Table2
```

or custom table names.

---

# 24. Response Status and Message Analysis

Document all status values returned by relevant stored procedures and APIs.

Create a status catalogue:

| Status Value | Message | Meaning | API Handling | Expected Angular Handling |
| ------------ | ------- | ------- | ------------ | ------------------------- |

Verify behaviour for:

* Success
* Failure
* Duplicate
* Validation failure
* Record not found
* Inactive user
* Locked user
* Invalid credentials
* Unauthorized
* Forbidden
* Pending approval
* Approved
* Rejected
* Record in use
* Database exception

Do not determine success only from message text when a structured status is available.

---

# 25. Common Approval Verification

Where Common Approval applies, trace the complete data lifecycle:

```text
Maker creates or modifies record
    → Pending approval data
        → Approval summary
            → Checker opens details
                → Approve or reject
                    → Main/approval/log tables updated
```

Verify:

* Which entities require approval
* Maker and checker fields
* Approval status values
* Rejection status
* Rejection remarks
* Self-approval prevention
* Multi-record approval
* Pending record storage
* Main table update
* Approval table update
* Log/history table update
* Duplicate handling while pending
* Active/inactive changes under approval
* Delete under approval

Document all tables, procedures and functions involved.

---

# 26. End-to-End Traceability Matrix

Create a traceability matrix:

| Business Operation | API Endpoint | Controller | Service | DB Method | SP/Function | Tables | Output |
| ------------------ | ------------ | ---------- | ------- | --------- | ----------- | ------ | ------ |

The matrix must cover all analysed operations.

This matrix will become the source of truth for Angular development.

---

# 27. Database Verification Checklist

For every relevant operation, verify:

* Procedure compiles.
* Function compiles.
* Trigger compiles.
* Referenced table exists.
* Referenced column exists.
* Referenced sequence exists.
* Referenced function exists.
* Referenced procedure exists.
* Parameter count matches.
* Parameter type matches.
* Parameter size is sufficient.
* Cursor is opened.
* Exception path returns status/message.
* Transaction behaviour is understood.
* Duplicate validation exists.
* Active/inactive logic exists.
* Approval logic works as intended.
* Audit fields are populated.
* Foreign-key relationships are valid.
* No invalid object remains.

Where database execution access is unavailable, perform static verification from scripts and clearly mark execution validation as pending.

Do not claim runtime verification when only script analysis was performed.

---

# 28. API Verification Checklist

For every relevant endpoint, verify:

* Route is reachable.
* HTTP method is correct.
* Request model binds correctly.
* Authorization is applied.
* Service method exists.
* Database call exists.
* Oracle parameters match.
* Response is serializable.
* Empty result is handled.
* Database error is handled.
* Validation message is preserved.
* Sensitive data is not exposed.
* Password is not returned.
* Token is not logged.
* Connection is disposed.
* Command is disposed.
* DataSet table usage is correct.

Where the API cannot be run, mark runtime verification as pending.

---

# 29. API Gap Handling

If an API required by the future Angular UI is missing, incomplete or inconsistent:

1. Do not create mock behaviour.
2. Do not modify the database automatically.
3. Do not modify the API automatically.
4. Record the issue under `API Gaps`.
5. Explain the exact impact on Angular implementation.
6. Recommend the smallest compatible correction.
7. Continue analysing all non-blocked functionality.

For every gap, use:

| Gap ID | Feature | Required UI Behaviour | Existing Behaviour | Exact Gap | Minimal Correction | Severity |
| ------ | ------- | --------------------- | ------------------ | --------- | ------------------ | -------- |

Examples of gaps include:

* List API exists but details API is missing.
* Save API does not return the saved record ID.
* Dropdown API returns inactive records.
* Menu API does not return route.
* Permission API lacks action-level permissions.
* Common Approval API cannot identify selected records.
* API response table order differs by operation.
* Stored procedure has a flag not exposed through the API.
* API parameter length is smaller than the Oracle parameter.
* Delete endpoint exists but stored procedure only deactivates.
* Login response does not provide enough information to load menus.

---

# 30. Issues and Risk Classification

Classify identified findings as:

* Blocker
* High
* Medium
* Low
* Observation

For each issue, document:

* Affected feature
* Evidence
* Current behaviour
* Expected behaviour
* Angular impact
* Recommended minimal correction

Do not report stylistic preferences as blockers.

---

# 31. Required Documents

Create the following files:

```text
docs/login-user-role-module-menu-db-api-analysis.md
docs/login-user-role-module-menu-traceability-matrix.md
docs/login-user-role-module-menu-api-gaps.md
docs/login-user-role-module-menu-angular-readiness.md
```

---

# 32. Analysis Document Structure

The main analysis document must contain:

1. Executive summary
2. Solution architecture
3. Technology stack
4. API project structure
5. Authentication flow
6. Claims and authorization
7. API inventory
8. Request and response contracts
9. Service and repository mapping
10. Database object inventory
11. Table analysis
12. Stored procedure analysis
13. Function analysis
14. Trigger analysis
15. Sequence analysis
16. Constraint and index analysis
17. DataSet table mapping
18. Status and message catalogue
19. Common Approval flow
20. Security observations
21. API gaps
22. Database gaps
23. Angular-readiness assessment
24. Recommendations
25. Final conclusion

---

# 33. Angular-Readiness Assessment

For every feature, assign one status:

* Ready
* Ready with minor gaps
* Partially ready
* Blocked

Use:

| Feature | Status | APIs Available | DB Verified | Gaps | Angular Impact |
| ------- | ------ | -------------- | ----------- | ---- | -------------- |

Assess:

* Login
* Session restoration
* Logout
* Dynamic menu loading
* User Management
* Role Management
* Module Management
* Menu Management
* User-role mapping
* Role-module-menu mapping
* Action permissions
* Common Approval

Do not mark a feature as `Ready` unless its complete API and database flow has been verified.

---

# 34. Definition of Done

This analysis phase is complete only when:

* Every relevant API has been inventoried.
* Every API has been traced to its database object.
* Every stored procedure called by the API has been analysed.
* Every referenced table has been analysed.
* Every referenced function has been analysed.
* Every relevant trigger has been analysed.
* Every relevant sequence has been analysed.
* API and Oracle parameters have been compared.
* DataSet table indexes have been documented.
* Status and message values have been documented.
* Authentication and claims have been verified.
* Menu and permission retrieval has been verified.
* Common Approval flow has been verified.
* Database and API gaps have been documented.
* Angular readiness has been assessed.
* No source code or database object has been changed.

---

# 35. Final Codex Response

At completion, return:

## Analysis completed

* Number of controllers analysed
* Number of endpoints analysed
* Number of services analysed
* Number of stored procedures analysed
* Number of functions analysed
* Number of tables analysed
* Number of triggers analysed
* Number of sequences analysed

## Authentication findings

* Authentication type
* Session or token type
* Claims
* Role handling
* Menu-loading mechanism
* Logout behaviour

## Functional readiness

* Login
* Users
* Roles
* Modules
* Menus
* Access mappings
* Common Approval

## Gaps

* Blockers
* High-priority issues
* Medium-priority issues
* Minor observations

## Angular readiness

State which features are ready for Angular implementation and which require minimal API or database corrections.

## Validation statement

Clearly distinguish:

* Statically verified from code/scripts
* Runtime verified through API execution
* Database verified through execution
* Not verified because access was unavailable

Do not claim successful runtime validation unless the endpoints and database objects were actually executed.
