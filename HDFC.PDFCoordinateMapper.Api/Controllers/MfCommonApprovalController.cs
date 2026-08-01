using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/MfCommonApproval")]
    public sealed class MfCommonApprovalController : ApiController
    {
        private readonly IMfCommonApprovalService mfCommonApprovalService;

        public MfCommonApprovalController(IMfCommonApprovalService mfCommonApprovalService)
        {
            this.mfCommonApprovalService = mfCommonApprovalService;
        }

        [HttpPost]
        [Route("GetPendingSummary")]
        public IHttpActionResult GetPendingSummary(MfCommonApprovalRequest request)
        {
            return JsonDataSet(() => mfCommonApprovalService.GetPendingSummary(request));
        }

        [HttpGet]
        [Route("GetMasters")]
        public IHttpActionResult GetMasters()
        {
            return JsonDataSet(() => mfCommonApprovalService.GetMasters());
        }

        [HttpPost]
        [Route("GetPendingDetails")]
        public IHttpActionResult GetPendingDetails(MfCommonApprovalDetailRequest request)
        {
            return JsonDataSet(() => mfCommonApprovalService.GetPendingDetails(request));
        }

        [HttpPost]
        [Route("Approve")]
        public IHttpActionResult Approve(MfCommonApprovalRequest request)
        {
            return JsonDataSet(() => mfCommonApprovalService.Approve(request));
        }

        [HttpPost]
        [Route("Reject")]
        public IHttpActionResult Reject(MfCommonApprovalRequest request)
        {
            return JsonDataSet(() => mfCommonApprovalService.Reject(request));
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
