# Codex Context -- HDFC.PDFCoordinateMapper Web API

## Solution Name

`HDFC.PDFCoordinateMapper`

## Objective

Build a **new ASP.NET Web API (.NET Framework 4.7.2)** solution named
**HDFC.PDFCoordinateMapper**.

This phase includes **only the Web API**. Do **not** create any Angular
project.

The API will be consumed by a future Angular application, but no
frontend code should be generated.

## Technology Stack

-   ASP.NET Web API (.NET Framework 4.7.2)
-   Oracle.ManagedDataAccess 4.122.1.0
-   Oracle Database
-   Newtonsoft.Json
-   Unity (lightweight DI)
-   JWT Authentication
-   File-based logging
-   Web.config configuration

## Architecture

``` text
Controllers
    ↓
Services
    ↓
Database (DbHelper)
    ↓
Oracle Stored Procedures
```

## Do Not Use

-   Entity Framework
-   Repository Pattern
-   Unit of Work
-   CQRS
-   MediatR
-   Dapper
-   AutoMapper
-   Clean/Onion Architecture templates
-   Microservices

## Solution Structure

``` text
HDFC.PDFCoordinateMapper
│
├── HDFC.PDFCoordinateMapper.Api
│   ├── App_Start
│   ├── Configuration
│   ├── Constants
│   ├── Controllers
│   ├── Database
│   │   ├── ConnectionFactory.cs
│   │   └── DbHelper.cs
│   ├── Filters
│   ├── Models
│   ├── Services
│   ├── Utilities
│   │   ├── Logger.cs
│   │   ├── EncryptionHelper.cs
│   │   ├── ExcelHelper.cs
│   │   ├── CsvHelper.cs
│   │   └── JsonHelper.cs
│   ├── Global.asax
│   └── Web.config
```

## Database Rules

DbHelper is the only class allowed to communicate with Oracle.

Provide reusable methods:

-   ExecuteDataSet()
-   ExecuteDataTable()
-   ExecuteScalar()
-   ExecuteNonQuery()
-   ExecuteReader()

Use only `CommandType.StoredProcedure`.

Use `using` blocks for OracleConnection, OracleCommand and
OracleDataAdapter.

Do not hardcode stored procedure names inside DbHelper.

Pass parameters as `List<OracleParameter>` or `OracleParameter[]`.

## Controller Rules

Controllers should only:

-   Validate request
-   Invoke services
-   Return standardized API responses

No Oracle code or business logic.

## Service Rules

Services should:

-   Implement business logic
-   Prepare Oracle parameters
-   Call DbHelper
-   Return DataSet/DataTable/object/int as appropriate

## Utilities

Separate reusable components:

-   Logger
-   EncryptionHelper
-   ExcelHelper
-   CsvHelper
-   JsonHelper

## Exception Handling

Implement a global ExceptionFilter that:

-   Logs exceptions
-   Returns a standard API response

## Authentication

Implement JWT authentication.

## Configuration

Create an AppSettings wrapper for:

-   Oracle connection string
-   JWT settings
-   Encryption keys
-   Log path
-   Upload path

## Coding Standards

-   PascalCase for classes, methods and properties
-   camelCase for local variables
-   Avoid duplicate code
-   Dispose IDisposable objects using `using`
-   Avoid magic strings and magic numbers

## Goal

Create a lightweight, maintainable, enterprise Web API optimized for
Oracle stored procedures. The architecture should make it easy to add
new modules without changing the core infrastructure.
