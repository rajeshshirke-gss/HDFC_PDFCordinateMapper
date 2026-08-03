using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/welcome")]
    public sealed class WelcomeController : ApiController
    {
        private readonly IWelcomeService welcomeService;
        public WelcomeController(IWelcomeService welcomeService) { this.welcomeService = welcomeService; }

        [HttpPost, Route("GetData")]
        public IHttpActionResult GetData(WelcomeRequest request)
        {
            return Ok(welcomeService.GetData(request) ?? new DataSet());
        }
    }
}
