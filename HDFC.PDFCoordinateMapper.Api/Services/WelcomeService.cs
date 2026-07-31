using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Utilities;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IWelcomeService
    {
        DataSet GetData(WelcomeRequest request);
    }

    public sealed class WelcomeService : IWelcomeService
    {
        private readonly IDbHelper db;
        public WelcomeService(IDbHelper db) { this.db = db; }

        public DataSet GetData(WelcomeRequest request)
        {
            var userId = LegacyAesHelper.DecryptMenuValue(request?.UserId);
            var parameters = new List<OracleParameter>
            {
                new OracleParameter("p_User_Id", OracleDbType.Varchar2, userId, ParameterDirection.Input),
                new OracleParameter("cur", OracleDbType.RefCursor, ParameterDirection.InputOutput)
            };

            return db.ExecuteDataSet("usp_getAllModule_Master_access", parameters);
        }
    }
}
