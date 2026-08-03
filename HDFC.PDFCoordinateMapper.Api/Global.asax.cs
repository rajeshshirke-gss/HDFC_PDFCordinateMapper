using System;
using System.Linq;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.App_Start;
using HDFC.PDFCoordinateMapper.Api.Configuration;

namespace HDFC.PDFCoordinateMapper.Api
{
    public class WebApiApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
            UnityConfig.RegisterComponents(GlobalConfiguration.Configuration);
        }

        protected void Application_BeginRequest()
        {
            ApplyCorsHeaders();

            if (string.Equals(Request.HttpMethod, "OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                Response.StatusCode = 200;
                Response.SuppressContent = true;
                Context.ApplicationInstance.CompleteRequest();
            }
        }

        private void ApplyCorsHeaders()
        {
            var origin = Request.Headers["Origin"];
            if (string.IsNullOrWhiteSpace(origin))
            {
                return;
            }

            var allowedOrigin = ResolveAllowedOrigin(origin);
            if (string.IsNullOrWhiteSpace(allowedOrigin))
            {
                return;
            }

            Response.Headers.Set("Access-Control-Allow-Origin", allowedOrigin);
            Response.Headers.Set("Vary", "Origin");
            Response.Headers.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            Response.Headers.Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            Response.Headers.Set("Access-Control-Max-Age", "600");
        }

        private static string ResolveAllowedOrigin(string requestOrigin)
        {
            var configuredOrigins = AppSettings.AllowedCorsOrigins;
            if (configuredOrigins == "*")
            {
                return requestOrigin;
            }

            var allowedOrigins = configuredOrigins
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(origin => origin.Trim());

            return allowedOrigins.Any(origin => string.Equals(origin, requestOrigin, StringComparison.OrdinalIgnoreCase))
                ? requestOrigin
                : null;
        }
    }
}
