using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IAuthService
    {
        DataSet ValidateCredentials(LoginRequest request);
        DataSet Logout(string userId, string systemIp);
    }

    public sealed class AuthService : IAuthService
    {
        private readonly IDbHelper db;
        public AuthService(IDbHelper db) { this.db = db; }

        public DataSet ValidateCredentials(LoginRequest request)
        {
            // Password handling should match the database contract; never log this value.
            var parameters = new List<OracleParameter>
            {
                //new OracleParameter("P_USERNAME", OracleDbType.Varchar2, userName, ParameterDirection.Input),
                //new OracleParameter("P_PASSWORD", OracleDbType.Varchar2, password, ParameterDirection.Input),

                new OracleParameter("P_PR_FLAG", OracleDbType.Varchar2,request.Flag, ParameterDirection.Input),
                new OracleParameter("P_PR_USERNAME", OracleDbType.Varchar2,request.UserName, ParameterDirection.Input),
                new OracleParameter("P_PR_PWD", OracleDbType.Varchar2, request.Password, ParameterDirection.Input),
                new OracleParameter("P_SYSTEMIP", OracleDbType.Varchar2, request.SystemIP, ParameterDirection.Input),
                new OracleParameter("P_GUID", OracleDbType.Varchar2, request.GUID, ParameterDirection.Input),
                new OracleParameter("P_LDAPENABLE", OracleDbType.Varchar2, "false", ParameterDirection.Input),

                new OracleParameter("cur", OracleDbType.RefCursor, ParameterDirection.InputOutput),
                new OracleParameter("cur1", OracleDbType.RefCursor, ParameterDirection.InputOutput),
                new OracleParameter("cur2", OracleDbType.RefCursor, ParameterDirection.InputOutput)

            };
            var dsoutput = db.ExecuteDataSet("USP_ADMIN_LOGIN", parameters);

            
            if (dsoutput.Tables.Count == 0)
            {
                var failedParameters = new List<OracleParameter>
                {
                    new OracleParameter("P_PR_FLAG", OracleDbType.Varchar2, request.Flag, ParameterDirection.Input),
                    new OracleParameter("P_PR_USERNAME", OracleDbType.Varchar2, request.UserName, ParameterDirection.Input),
                    new OracleParameter("P_PR_PWD", OracleDbType.Varchar2, request.Password, ParameterDirection.Input),
                    new OracleParameter("P_SYSTEMIP", OracleDbType.Varchar2, request.SystemIP, ParameterDirection.Input),
                    new OracleParameter("P_GUID", OracleDbType.Varchar2, request.GUID, ParameterDirection.Input),
                    new OracleParameter("P_LDAPENABLE", OracleDbType.Varchar2, "true", ParameterDirection.Input),
                    new OracleParameter("P_MSGID", OracleDbType.Varchar2, "0", ParameterDirection.Input),
                    new OracleParameter("P_MSG", OracleDbType.Varchar2, "Login failed, Invalid password", ParameterDirection.Input)
                };

                db.ExecuteDataSet("LDAP_LOGIN_FAILED", failedParameters);

            }
            return dsoutput;
        }

        public DataSet Logout(string userId, string systemIp)
        {
            var parameters = new List<OracleParameter>
            {
                new OracleParameter("P_USERID", OracleDbType.Varchar2, userId, ParameterDirection.Input),
                new OracleParameter("P_SYSTEMIP", OracleDbType.Varchar2, systemIp, ParameterDirection.Input),
                new OracleParameter("CUR", OracleDbType.RefCursor, ParameterDirection.Output)
            };

            return db.ExecuteDataSet("USP_USER_LOGOUT", parameters);
        }
    }
}
