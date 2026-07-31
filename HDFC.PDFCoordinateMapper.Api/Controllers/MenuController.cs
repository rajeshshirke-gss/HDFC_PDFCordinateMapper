using System;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/Menu")]
    public sealed class MenuController : ApiController
    {
        private readonly IMenuService menuService;
        public MenuController(IMenuService menuService) { this.menuService = menuService; }

        [HttpPost, Route("getmenu")]
        public IHttpActionResult GetMenu(MenuRequest request)
        {
            return Ok(menuService.GetMenu(request) ?? new DataSet());
        }
    }
}
