using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IRoleModuleMappingService
    {
        DataSet RoleModuleMasterIuds(RoleModuleMappingRequest request);
    }

    public sealed class RoleModuleMappingService : IRoleModuleMappingService
    {
        private const string ProcedureName = "USP_CCIL_ROLEMODMAPPING_IUDS";

        private readonly IDbHelper db;

        public RoleModuleMappingService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet RoleModuleMasterIuds(RoleModuleMappingRequest request)
        {
            request = request ?? new RoleModuleMappingRequest();

            string processName = LegacyRequestValue.Decode(request.ProcessName);
            if (string.IsNullOrWhiteSpace(processName))
            {
                throw new ArgumentException("Role Module Mapping process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_ProcessName", processName),
                InputVarchar("p_RoleId", LegacyRequestValue.Decode(request.RoleId)),
                InputVarchar("p_RoleName", LegacyRequestValue.Decode(request.RoleName)),
                InputVarchar("p_MenuAccess", LegacyRequestValue.Decode(request.MenuAccess)),
                InputVarchar("p_Group_Id", LegacyRequestValue.Decode(First(request.Groupid, request.GroupId))),
                InputVarchar("p_UserId", LegacyRequestValue.Decode(request.UserId)),
                InputTimestamp("p_CreatedDate", null),
                InputVarchar("p_ApproveUserId", LegacyRequestValue.Decode(request.ApprovedBy)),
                InputTimestamp("p_ApprovedDate", null),
                InputVarchar("p_AutoId", LegacyRequestValue.Decode(request.AutoId)),
                Cursor(),
                Cursor("cur1"),
                Cursor("cur2")
            };

            return db.ExecuteDataSet(ProcedureName, parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter InputTimestamp(string name, DateTime? value)
        {
            return new OracleParameter(name, OracleDbType.TimeStamp)
            {
                Direction = ParameterDirection.Input,
                Value = value.HasValue ? (object)value.Value : DBNull.Value
            };
        }

        private static OracleParameter Cursor(string name = "cur")
        {
            return new OracleParameter(name, OracleDbType.RefCursor)
            {
                Direction = ParameterDirection.Output
            };
        }

        private static string First(string first, string second)
        {
            return string.IsNullOrWhiteSpace(first) ? second : first;
        }
    }
}
