using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/CommonApproval")]
    public sealed class CommonApprovalController : ApiController
    {
        private readonly ICommonApprovalService commonApprovalService;

        public CommonApprovalController(ICommonApprovalService commonApprovalService)
        {
            this.commonApprovalService = commonApprovalService;
        }

        [HttpPost]
        [Route("GetAllUser")]
        [Route("~/api/CommonApproval_AR/getpending")]
        public IHttpActionResult GetAllUser(UserMasterRequest request)
        {
            return JsonDataSet(() => commonApprovalService.GetAllUser(request));
        }

        [HttpGet]
        [Route("~/api/CommonApproval_AR/getpending")]
        public IHttpActionResult GetPending()
        {
            return JsonDataSet(() => commonApprovalService.GetAllUser(new UserMasterRequest { Flag = "S" }));
        }

        [HttpPost]
        [Route("GetAllMasterForDDL")]
        public IHttpActionResult GetAllMasterForDdl()
        {
            return JsonDataSet(() => commonApprovalService.GetAllMasterForDdl());
        }

        [HttpPost]
        [Route("ApproveOrRejectUser")]
        public IHttpActionResult ApproveOrRejectUser(UserMasterRequest request)
        {
            return JsonDataSet(() => commonApprovalService.ApproveOrRejectUser(request));
        }

        [HttpPost]
        [Route("GetData_CommonApproval")]
        public IHttpActionResult GetDataCommonApproval(CommonApprovalRequest request)
        {
            return JsonDataSet(() => commonApprovalService.GetDataCommonApproval(request));
        }

        [HttpPost]
        [Route("CommonApproval_AR")]
        [Route("~/api/CommonApproval_AR/approve-reject")]
        public IHttpActionResult CommonApprovalAr(CommonApprovalArRequest request)
        {
            return JsonDataSet(() => commonApprovalService.CommonApprovalAr(request));
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
