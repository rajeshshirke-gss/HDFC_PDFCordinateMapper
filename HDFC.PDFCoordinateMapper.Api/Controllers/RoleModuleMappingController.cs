using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/RoleModuleMapping")]
    public sealed class RoleModuleMappingController : ApiController
    {
        private readonly IRoleModuleMappingService roleModuleMappingService;

        public RoleModuleMappingController(IRoleModuleMappingService roleModuleMappingService)
        {
            this.roleModuleMappingService = roleModuleMappingService;
        }

        [HttpPost]
        [Route("RoleModuleMaster_IUDS")]
        //[Route("rolemodulemaster_iuds")]
        public IHttpActionResult RoleModuleMasterIuds(RoleModuleMappingRequest request)
        {
            return JsonDataSet(() => roleModuleMappingService.RoleModuleMasterIuds(request));
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
