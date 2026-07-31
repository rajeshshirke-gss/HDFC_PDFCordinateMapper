using System.Web.Http;
using System.Web.Http.Controllers;
using HDFC.PDFCoordinateMapper.Api.Configuration;

namespace HDFC.PDFCoordinateMapper.Api.Filters
{
    /// <summary>Allows local Swagger testing without removing authorization attributes from controllers.</summary>
    public sealed class ConfigurableAuthorizeAttribute : AuthorizeAttribute
    {
        protected override bool IsAuthorized(HttpActionContext actionContext)
        {
            if (!AppSettings.EnableJwtAuthorization)
            {
                return true;
            }

            return base.IsAuthorized(actionContext);
        }
    }
}
