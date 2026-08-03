using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Web;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Configuration;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;
using HDFC.PDFCoordinateMapper.Api.Utilities;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [RoutePrefix("api/auth")]
    public sealed class AuthController : ApiController
    {
        private readonly IAuthService authService;
        private readonly IJwtTokenService tokenService;

        public AuthController(IAuthService authService, IJwtTokenService tokenService)
        {
            this.authService = authService;
            this.tokenService = tokenService;
        }

        [AllowAnonymous, HttpGet, Route("login")]
        public IHttpActionResult LoginInfo()
        {
            return Ok(ApiResponse<object>.Ok(new
            {
                method = "POST",
                url = "/api/auth/login",
                requiredBody = new
                {
                    userName = "string",
                    password = "string",
                    flag = "LOGIN"
                }
            }, "Login endpoint is available. Submit credentials with HTTP POST."));
        }

        [AllowAnonymous, HttpPost, Route("login")]
        public IHttpActionResult Login(LoginRequest request)
        {
            NormalizeLoginRequest(request);

            if (request == null || string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Content(HttpStatusCode.BadRequest, ApiResponse<object>.Fail("User name and password are required."));
            }

            request.GUID = Guid.NewGuid().ToString();
            request.SystemIP = GetIpAddress();

            DataSet dataSet = authService.ValidateCredentials(request);
            string message = GetMessage(dataSet);

            if (!IsSuccessfulLogin(dataSet))
            {
                return Ok(ApiResponse<DataSet>.Fail(message ?? "Login failed."));
            }

            var roles = ExtractRoles(dataSet).ToArray();
            var response = new LoginResponse
            {
                AccessToken = tokenService.Create(request.UserName, roles),
                TokenType = "Bearer",
                ExpiresInSeconds = AppSettings.JwtExpiryMinutes * 60,
                UserName = request.UserName,
                SessionId = request.GUID,
                Roles = roles,
                Data = dataSet
            };

            return Ok(ApiResponse<LoginResponse>.Ok(response, message ?? "Login successful."));
        }

        [ConfigurableAuthorize, HttpGet, Route("me")]
        public IHttpActionResult Me()
        {
            var principal = User as ClaimsPrincipal;
            var response = new CurrentUserResponse
            {
                UserName = string.IsNullOrWhiteSpace(User?.Identity?.Name)
                    ? "swagger-test-user"
                    : User.Identity.Name,
                Roles = principal?.Claims
                    .Where(claim => claim.Type == ClaimTypes.Role)
                    .Select(claim => claim.Value)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray() ?? new string[0]
            };

            return Ok(ApiResponse<CurrentUserResponse>.Ok(response));
        }

        [ConfigurableAuthorize, HttpPost, Route("logout")]
        public IHttpActionResult Logout()
        {
            string userName = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(userName))
            {
                if (!AppSettings.EnableJwtAuthorization)
                {
                    return Ok(ApiResponse<object>.Ok(new { userName = "swagger-test-user" }, "Logout skipped because JWT authorization is disabled for testing."));
                }

                return Content(HttpStatusCode.Unauthorized, ApiResponse<object>.Fail("Authenticated user is required."));
            }

            DataSet dataSet = authService.Logout(userName, GetIpAddress());
            return Ok(ApiResponse<DataSet>.Ok(dataSet, GetMessage(dataSet) ?? "Logout completed."));
        }

        private static bool IsSuccessfulLogin(DataSet dataSet)
        {
            if (dataSet == null || dataSet.Tables.Count == 0)
            {
                return false;
            }

            foreach (DataTable table in dataSet.Tables)
            {
                foreach (DataRow row in table.Rows)
                {
                    foreach (DataColumn column in table.Columns)
                    {
                        if (string.Equals(column.ColumnName, "msgid", StringComparison.OrdinalIgnoreCase)
                            && string.Equals(Convert.ToString(row[column]), "0", StringComparison.OrdinalIgnoreCase))
                        {
                            return false;
                        }
                    }
                }
            }

            return dataSet.Tables.Cast<DataTable>().Any(table => table.Rows.Count > 0);
        }

        private static string GetMessage(DataSet dataSet)
        {
            if (dataSet == null)
            {
                return null;
            }

            foreach (DataTable table in dataSet.Tables)
            {
                foreach (DataRow row in table.Rows)
                {
                    foreach (DataColumn column in table.Columns)
                    {
                        if (column.ColumnName.IndexOf("msg", StringComparison.OrdinalIgnoreCase) >= 0
                            || column.ColumnName.IndexOf("message", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            string value = Convert.ToString(row[column]);
                            if (!string.IsNullOrWhiteSpace(value) && !string.Equals(value, "0", StringComparison.OrdinalIgnoreCase))
                            {
                                return value;
                            }
                        }
                    }
                }
            }

            return null;
        }

        private static IEnumerable<string> ExtractRoles(DataSet dataSet)
        {
            if (dataSet == null)
            {
                yield break;
            }

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (DataTable table in dataSet.Tables)
            {
                foreach (DataColumn column in table.Columns)
                {
                    if (column.ColumnName.IndexOf("role", StringComparison.OrdinalIgnoreCase) < 0)
                    {
                        continue;
                    }

                    foreach (DataRow row in table.Rows)
                    {
                        string role = Convert.ToString(row[column]);
                        if (!string.IsNullOrWhiteSpace(role) && seen.Add(role))
                        {
                            yield return role;
                        }
                    }
                }
            }
        }

        private static string GetIpAddress()
        {
            return HttpContext.Current?.Request?.UserHostAddress ?? string.Empty;
        }

        private static void NormalizeLoginRequest(LoginRequest request)
        {
            if (request == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(request.UserName))
            {
                request.UserName = !string.IsNullOrWhiteSpace(request.UserId)
                    ? request.UserId
                    : request.User_Id;
            }

            if (string.IsNullOrWhiteSpace(request.Flag))
            {
                request.Flag = "LOGIN";
            }
        }
    }
}
