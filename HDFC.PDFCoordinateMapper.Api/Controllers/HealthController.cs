using System;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Models;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [RoutePrefix("api/health")]
    public sealed class HealthController : ApiController
    {
        [AllowAnonymous, HttpGet, Route("")]
        public IHttpActionResult Get()
        {
            // This endpoint deliberately avoids Oracle so it can verify application startup independently.
            return Ok(ApiResponse<object>.Ok(new { status = "Healthy", utcTime = DateTime.UtcNow }));
        }
    }
}
