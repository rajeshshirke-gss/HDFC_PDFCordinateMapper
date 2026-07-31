using System.Data;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;
using HDFC.PDFCoordinateMapper.Api.Utilities;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize, RoutePrefix("api/pdf-coordinates")]
    public sealed class PdfCoordinatesController : ApiController
    {
        private readonly IPdfCoordinateService service;
        public PdfCoordinatesController(IPdfCoordinateService service) { this.service = service; }

        [HttpGet, Route("")]
        public IHttpActionResult Get([FromUri] string templateName)
        {
            if (string.IsNullOrWhiteSpace(templateName))
                return Content(HttpStatusCode.BadRequest, ApiResponse<object>.Fail("Template name is required."));
            return Ok(ApiResponse<DataTable>.Ok(service.GetByTemplate(templateName)));
        }

        [HttpPost, Route("")]
        public IHttpActionResult Save(PdfCoordinate request)
        {
            if (request == null || !ModelState.IsValid)
                return Content(HttpStatusCode.BadRequest, ApiResponse<object>.Fail("The coordinate request is invalid."));
            var affectedRows = service.Save(request, User.Identity.Name);
            return Ok(ApiResponse<int>.Ok(affectedRows, "Coordinate saved successfully."));
        }

        [HttpGet, Route("export/csv")]
        public HttpResponseMessage ExportCsv([FromUri] string templateName)
        {
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new StringContent(CsvHelper.ToCsv(service.GetByTemplate(templateName)), Encoding.UTF8, "text/csv");
            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment") { FileName = "coordinates.csv" };
            return response;
        }

        [HttpGet, Route("export/excel")]
        public HttpResponseMessage ExportExcel([FromUri] string templateName)
        {
            var response = Request.CreateResponse(HttpStatusCode.OK);
            response.Content = new ByteArrayContent(ExcelHelper.ToSpreadsheetXml(service.GetByTemplate(templateName)));
            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/vnd.ms-excel");
            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment") { FileName = "coordinates.xml" };
            return response;
        }
    }
}
