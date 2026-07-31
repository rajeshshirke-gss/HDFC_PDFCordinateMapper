# HDFC.PDFCoordinateMapper

ASP.NET Web API 2 on .NET Framework 4.7.2, designed for Oracle stored procedures.

## Build

1. Open `HDFC.PDFCoordinateMapper.sln` in Visual Studio 2022.
2. Restore NuGet packages.
3. Update the Oracle connection string and secrets in `Web.config`.
4. Build and run with IIS Express.

Command-line build:

```powershell
& 'C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe' `
  .\HDFC.PDFCoordinateMapper.sln /t:Restore,Build /p:Configuration=Debug
```

Test startup with `GET /api/health`. Database endpoints require the stored procedures configured in `Web.config`.

Swagger UI is available at `/swagger` (for example, `http://localhost:50971/swagger`).

## API

- `GET /api/health` — anonymous application health
- `POST /api/auth/login` — validates credentials through Oracle and issues JWT
- `GET /api/pdf-coordinates?templateName=...` — authenticated lookup
- `POST /api/pdf-coordinates` — authenticated save
- `GET /api/pdf-coordinates/export/csv?templateName=...`
- `GET /api/pdf-coordinates/export/excel?templateName=...`

Production secrets should be protected with ASP.NET configuration encryption or injected during deployment; do not commit real credentials.
