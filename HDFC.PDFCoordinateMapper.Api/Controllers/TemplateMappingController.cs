using System;
using System.Data;
using System.Net;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/TemplateMapping")]
    public sealed class TemplateMappingController : ApiController
    {
        private readonly ITemplateMappingService templateMappingService;

        public TemplateMappingController(ITemplateMappingService templateMappingService)
        {
            this.templateMappingService = templateMappingService;
        }

        [HttpGet]
        [Route("GetTemplateMapping")]
        public IHttpActionResult GetTemplateMapping()
        {
            return JsonDataSet(() => templateMappingService.GetTemplateMappings());
        }

        [HttpGet]
        [Route("GetTemplateMappingById")]
        public IHttpActionResult GetTemplateMappingById([FromUri] string autoId)
        {
            return JsonDataSet(() => templateMappingService.GetTemplateMappingById(autoId));
        }

        [HttpPost]
        [Route("SaveTemplateMapping")]
        public IHttpActionResult SaveTemplateMapping(TemplateMappingRequest request)
        {
            return JsonDataSet(() => templateMappingService.SaveTemplateMapping(request));
        }

        [HttpPost]
        [Route("Delete_TemplateMapping")]
        public IHttpActionResult DeleteTemplateMapping(TemplateMappingRequest request)
        {
            return JsonDataSet(() => templateMappingService.DeleteTemplateMapping(request));
        }

        private IHttpActionResult JsonDataSet(Func<DataSet> action)
        {
            try
            {
                return Ok(action() ?? new DataSet());
            }
            catch (ArgumentException ex)
            {
                return Content(HttpStatusCode.BadRequest, ApiResponse<object>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
