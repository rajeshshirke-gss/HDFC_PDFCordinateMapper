using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Models;
using Integration.Data.Services;

namespace HDFC.PDFCoordinateMapper.Api.Controllers
{
    [ConfigurableAuthorize]
    [RoutePrefix("api/MasterImport")]
    public sealed class MasterImportController : ApiController
    {
        private readonly IMasterImportService masterImportService;

        public MasterImportController(IMasterImportService masterImportService)
        {
            this.masterImportService = masterImportService;
        }

        [HttpGet]
        [Route("GetMasters")]
        public IHttpActionResult GetMasters()
        {
            return SafeOk(() => masterImportService.GetMasters());
        }

        [HttpGet]
        [Route("GetData")]
        public IHttpActionResult GetData([FromUri] string masterKey)
        {
            return SafeOk(() =>
            {
                var dataSet = masterImportService.GetMasterData(masterKey);
                return dataSet.Tables.Count == 0 ? new List<IDictionary<string, object>>() : ToRows(dataSet.Tables[0]);
            });
        }

        [HttpGet]
        [Route("GetImportLog")]
        public IHttpActionResult GetImportLog([FromUri] string masterKey)
        {
            return SafeOk(() =>
            {
                var dataSet = masterImportService.GetImportLog(masterKey);
                return dataSet.Tables.Count == 0 ? new List<IDictionary<string, object>>() : ToRows(dataSet.Tables[0]);
            });
        }

        [HttpPost]
        [Route("Import")]
        public IHttpActionResult Import(MasterImportRequest request)
        {
            request = request ?? new MasterImportRequest();
            return SafeOk(() => masterImportService.ImportMaster(request.MasterKey, CurrentUser(request.ImportedBy)));
        }

        [HttpPost]
        [Route("ImportAll")]
        public IHttpActionResult ImportAll(MasterImportRequest request)
        {
            request = request ?? new MasterImportRequest();
            return SafeOk(() => masterImportService.ImportAll(CurrentUser(request.ImportedBy)));
        }

        private IHttpActionResult SafeOk(Func<object> action)
        {
            try
            {
                return Ok(action());
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private string CurrentUser(string fallback)
        {
            return string.IsNullOrWhiteSpace(fallback) ? User?.Identity?.Name ?? "api-user" : fallback;
        }

        private static IList<IDictionary<string, object>> ToRows(DataTable table)
        {
            var rows = new List<IDictionary<string, object>>();
            foreach (DataRow row in table.Rows)
            {
                var item = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                foreach (DataColumn column in table.Columns)
                {
                    item[column.ColumnName] = row[column] == DBNull.Value ? null : row[column];
                }

                rows.Add(item);
            }

            return rows;
        }
    }
}
