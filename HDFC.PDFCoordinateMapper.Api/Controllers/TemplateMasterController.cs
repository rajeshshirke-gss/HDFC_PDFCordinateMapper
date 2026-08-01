using System;
using System.Data;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/TemplateMaster")]
    public sealed class TemplateMasterController : ApiController
    {
        private readonly ITemplateMasterService templateMasterService;

        public TemplateMasterController(ITemplateMasterService templateMasterService)
        {
            this.templateMasterService = templateMasterService;
        }

        [HttpGet]
        [Route("GetTemplateMaster")]
        public IHttpActionResult GetTemplateMaster()
        {
            return JsonDataSet(() => templateMasterService.GetTemplateMaster());
        }

        [HttpGet]
        [Route("GetTemplateMasterById")]
        public IHttpActionResult GetTemplateMasterById([FromUri] string autoId)
        {
            return JsonDataSet(() => templateMasterService.GetTemplateMasterById(autoId));
        }

        [HttpPost]
        [Route("SaveTemplateMaster")]
        public IHttpActionResult SaveTemplateMaster(TemplateMasterRequest request)
        {
            return JsonDataSet(() => templateMasterService.SaveTemplateMaster(request));
        }

        [HttpPost]
        [Route("Delete_TemplateMaster")]
        public IHttpActionResult DeleteTemplateMaster(TemplateMasterRequest request)
        {
            return JsonDataSet(() => templateMasterService.DeleteTemplateMaster(request));
        }

        [HttpPost]
        [Route("UploadTemplatePdf")]
        public IHttpActionResult UploadTemplatePdf()
        {
            try
            {
                HttpPostedFile file = HttpContext.Current.Request.Files.Count > 0
                    ? HttpContext.Current.Request.Files[0]
                    : null;
                return Ok(ApiResponse<TemplateUploadResult>.Ok(templateMasterService.UploadTemplatePdf(file), "PDF uploaded successfully."));
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.BadRequest, ApiResponse<object>.Fail(ex.Message));
            }
        }

        [HttpGet]
        [Route("PreviewTemplatePdf")]
        public HttpResponseMessage PreviewTemplatePdf([FromUri] string templateId)
        {
            string path = templateMasterService.ResolveTemplateFilePath(templateId);
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(System.IO.File.ReadAllBytes(path));
            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("inline")
            {
                FileName = System.IO.Path.GetFileName(path)
            };
            return response;
        }

        private IHttpActionResult JsonDataSet(Func<DataSet> action)
        {
            try
            {
                return Ok(action() ?? new DataSet());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
