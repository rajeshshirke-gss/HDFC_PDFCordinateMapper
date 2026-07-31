using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Utilities;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IMenuService
    {
        DataSet GetMenu(MenuRequest request);
    }

    public sealed class MenuService : IMenuService
    {
        private readonly IDbHelper db;
        public MenuService(IDbHelper db) { this.db = db; }

        public DataSet GetMenu(MenuRequest request)
        {
            var roleId = LegacyAesHelper.DecryptMenuValue(request?.roleid);
            var moduleId = LegacyAesHelper.DecryptMenuValue(request?.Moduleid);
            var parameters = new List<OracleParameter>
            {
                new OracleParameter("p_Roleid", OracleDbType.Varchar2, roleId, ParameterDirection.Input),
                new OracleParameter("p_Moduleid", OracleDbType.Varchar2, moduleId, ParameterDirection.Input),
                new OracleParameter("cur", OracleDbType.RefCursor, ParameterDirection.InputOutput)
            };

            return db.ExecuteDataSet("usp_getmenu", parameters);
        }
    }
}
