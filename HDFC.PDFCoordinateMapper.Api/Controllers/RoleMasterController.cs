using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/RoleMaster")]
    public sealed class RoleMasterController : ApiController
    {
        private readonly IRoleMasterService roleMasterService;

        public RoleMasterController(IRoleMasterService roleMasterService)
        {
            this.roleMasterService = roleMasterService;
        }

        [HttpPost]
        [Route("SaveRoleMaster")]
        [Route("saverole")]
        public IHttpActionResult SaveRoleMaster(RoleMasterRequest request)
        {
            return JsonDataSet(() => roleMasterService.SaveRoleMaster(request));
        }

        [HttpGet]
        [Route("GetRoleMaster")]
        public IHttpActionResult GetRoleMaster()
        {
            return JsonDataSet(() => roleMasterService.GetRoleMaster());
        }

        [HttpPost]
        [Route("getrole")]
        public IHttpActionResult GetRoleMasterPost()
        {
            return JsonDataSet(() => roleMasterService.GetRoleMaster());
        }

        [HttpGet]
        [Route("getrole")]
        public IHttpActionResult GetRoleMasterLower()
        {
            return JsonDataSet(() => roleMasterService.GetRoleMaster());
        }

        [HttpPost]
        [Route("Delete_RoleMaster")]
        public IHttpActionResult DeleteRoleMaster(RoleMasterRequest request)
        {
            return JsonDataSet(() => roleMasterService.DeleteRoleMaster(request));
        }

        [HttpPost]
        [Route("GetRoleName")]
        public IHttpActionResult GetRoleName(RoleMasterRequest request)
        {
            return JsonDataSet(() => roleMasterService.GetRoleName(request));
        }

        [HttpGet]
        [Route("GetRoles")]
        public IHttpActionResult GetRoles()
        {
            return JsonDataSet(() => roleMasterService.GetRoles());
        }

        [HttpPost]
        [Route("ModuleMaster_IUDS")]
        public IHttpActionResult ModuleMasterIuds(ModuleMasterRequest request)
        {
            return JsonDataSet(() => roleMasterService.ModuleMasterIuds(request));
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
