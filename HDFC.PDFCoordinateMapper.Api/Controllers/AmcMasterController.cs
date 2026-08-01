using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/AmcMaster")]
    public sealed class AmcMasterController : ApiController
    {
        private readonly IAmcMasterService amcMasterService;

        public AmcMasterController(IAmcMasterService amcMasterService)
        {
            this.amcMasterService = amcMasterService;
        }

        [HttpGet]
        [Route("GetAmcMaster")]
        public IHttpActionResult GetAmcMaster()
        {
            return JsonDataSet(() => amcMasterService.GetAmcMaster());
        }

        [HttpGet]
        [Route("GetAmcMasterById")]
        public IHttpActionResult GetAmcMasterById([FromUri] string autoId)
        {
            return JsonDataSet(() => amcMasterService.GetAmcMasterById(autoId));
        }

        [HttpPost]
        [Route("SaveAmcMaster")]
        public IHttpActionResult SaveAmcMaster(AmcMasterRequest request)
        {
            return JsonDataSet(() => amcMasterService.SaveAmcMaster(request));
        }

        [HttpPost]
        [Route("Delete_AmcMaster")]
        public IHttpActionResult DeleteAmcMaster(AmcMasterRequest request)
        {
            return JsonDataSet(() => amcMasterService.DeleteAmcMaster(request));
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
