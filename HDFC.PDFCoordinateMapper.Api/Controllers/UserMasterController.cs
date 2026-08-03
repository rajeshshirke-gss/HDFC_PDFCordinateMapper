using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/UserMaster")]
    public sealed class UserMasterController : ApiController
    {
        private readonly IUserMasterService userMasterService;

        public UserMasterController(IUserMasterService userMasterService)
        {
            this.userMasterService = userMasterService;
        }

        [HttpPost]
        [Route("SaveUserMaster")]
        [Route("saveuser")]
        public IHttpActionResult SaveUserMaster(UserMasterRequest request)
        {
            return JsonDataSet(() => userMasterService.SaveUserMaster(request));
        }

        [HttpGet]
        [Route("GetUserMaster")]
        public IHttpActionResult GetUserMaster()
        {
            return JsonDataSet(() => userMasterService.GetUserMaster());
        }

        [HttpPost]
        [Route("getuser")]
        public IHttpActionResult GetUserMasterPost()
        {
            return JsonDataSet(() => userMasterService.GetUserMaster());
        }

        [HttpGet]
        [Route("getuser")]
        public IHttpActionResult GetUserMasterLower()
        {
            return JsonDataSet(() => userMasterService.GetUserMaster());
        }

        [HttpPost]
        [Route("Delete_UserMaster")]
        public IHttpActionResult DeleteUserMaster(UserMasterRequest request)
        {
            return JsonDataSet(() => userMasterService.DeleteUserMaster(request));
        }

        [HttpGet]
        [Route("GetAllRecordForDDL")]
        public IHttpActionResult GetAllRecordForDdl()
        {
            return JsonDataSet(() => userMasterService.GetAllRecordForDdl());
        }

        [HttpPost]
        [Route("UserMaster_IUDS")]
        public IHttpActionResult UserMasterIuds(UserMasterRequest request)
        {
            return JsonDataSet(() => userMasterService.UserMasterIuds(request));
        }

        [HttpPost]
        [Route("UnlockUser")]
        [Route("unlockuser")]
        [Route("activatedormantuser")]
        public IHttpActionResult UnlockUser(UserMasterRequest request)
        {
            return JsonDataSet(() => userMasterService.UnlockUser(request));
        }

        private IHttpActionResult JsonDataSet(Func<DataSet> action)
        {
            try
            {
                DataSet ds = action() ?? new DataSet();

                /*
                 * IMPORTANT:
                 * Do not use JsonConvert.SerializeObject(ds) and then return Json(json).
                 * That returns JSON as a string, like "{}".
                 *
                 * Returning Ok(ds) returns proper JSON object:
                 * {
                 *   "Table": [...]
                 * }
                 */
                return Ok(ds);
            }
            catch (Exception ex)
            {
                /*
                 * Do not swallow the exception.
                 * Swagger/Postman should show the real Oracle or decryption error.
                 */
                return InternalServerError(ex);
            }
        }
    }
}
