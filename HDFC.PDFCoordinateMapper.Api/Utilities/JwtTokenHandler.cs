using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HDFC.PDFCoordinateMapper.Api.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    public interface IJwtTokenService { string Create(string userName, IEnumerable<string> roles); }

    public sealed class JwtTokenService : IJwtTokenService
    {
        public string Create(string userName, IEnumerable<string> roles)
        {
            var now = DateTime.UtcNow;
            var claims = new List<Claim> { new Claim(ClaimTypes.Name, userName), new Claim(JwtRegisteredClaimNames.Sub, userName) };
            claims.AddRange((roles ?? Enumerable.Empty<string>()).Select(role => new Claim(ClaimTypes.Role, role)));
            var credentials = new SigningCredentials(Key(), SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(AppSettings.JwtIssuer, AppSettings.JwtAudience, claims, now, now.AddMinutes(AppSettings.JwtExpiryMinutes), credentials);
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        internal static SymmetricSecurityKey Key() => new SymmetricSecurityKey(Encoding.UTF8.GetBytes(AppSettings.JwtSecret));
    }

    /// <summary>Validates bearer tokens early and supplies the principal used by [Authorize].</summary>
    public sealed class JwtTokenHandler : DelegatingHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var authorization = request.Headers.Authorization;
            if (authorization != null && authorization.Scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var parameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true, IssuerSigningKey = JwtTokenService.Key(),
                        ValidateIssuer = true, ValidIssuer = AppSettings.JwtIssuer,
                        ValidateAudience = true, ValidAudience = AppSettings.JwtAudience,
                        ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1)
                    };
                    SecurityToken validatedToken;
                    var principal = new JwtSecurityTokenHandler().ValidateToken(authorization.Parameter, parameters, out validatedToken);
                    Thread.CurrentPrincipal = principal;
                    if (System.Web.HttpContext.Current != null) System.Web.HttpContext.Current.User = principal;
                }
                catch (Exception)
                {
                    // Leave the request anonymous; [Authorize] returns the appropriate 401 response.
                }
            }
            return await base.SendAsync(request, cancellationToken);
        }
    }
}
