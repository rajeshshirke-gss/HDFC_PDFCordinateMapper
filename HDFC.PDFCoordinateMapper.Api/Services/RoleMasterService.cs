using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IRoleMasterService
    {
        DataSet SaveRoleMaster(RoleMasterRequest request);
        DataSet GetRoleMaster();
        DataSet DeleteRoleMaster(RoleMasterRequest request);
        DataSet GetRoleName(RoleMasterRequest request);
        DataSet GetRoles();
        DataSet ModuleMasterIuds(ModuleMasterRequest request);
    }

    public sealed class RoleMasterService : IRoleMasterService
    {
        private readonly IDbHelper db;

        public RoleMasterService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet SaveRoleMaster(RoleMasterRequest request)
        {
            request = request ?? new RoleMasterRequest();
            return ExecuteRoleMaster(request, request.Flag);
        }

        public DataSet GetRoleMaster()
        {
            return ExecuteRoleMaster(new RoleMasterRequest(), "SELECT");
        }

        public DataSet DeleteRoleMaster(RoleMasterRequest request)
        {
            request = request ?? new RoleMasterRequest();
            return ExecuteRoleMaster(request, request.Flag);
        }

        public DataSet GetRoleName(RoleMasterRequest request)
        {
            request = request ?? new RoleMasterRequest();

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_UserId", LegacyRequestValue.Decode(request.User_Id)),
                Cursor()
            };

            return db.ExecuteDataSet("usp_GetRoleName", parameters);
        }

        public DataSet GetRoles()
        {
            return db.ExecuteDataSet("usp_GetRoles", new[] { Cursor() });
        }

        public DataSet ModuleMasterIuds(ModuleMasterRequest request)
        {
            request = request ?? new ModuleMasterRequest();

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_ProcessName", LegacyRequestValue.Decode(request.ProcessName)),
                InputVarchar("p_UserId", LegacyRequestValue.Decode(request.UserId)),
                InputVarchar("p_AutoId", LegacyRequestValue.Decode(request.AutoId)),
                Cursor()
            };

            return db.ExecuteDataSet("USP_CCIL_ModuleMaster_IUDS", parameters);
        }

        private DataSet ExecuteRoleMaster(RoleMasterRequest request, string flag)
        {
            string processName = LegacyRequestValue.Decode(flag);

            if (string.IsNullOrWhiteSpace(processName))
            {
                throw new ArgumentException("Role Master flag/process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_PROCESS_NAME", processName),
                InputVarchar("p_AUTO_ID", LegacyRequestValue.Decode(request.Auto_Id)),
                InputVarchar("p_ROLECODE", LegacyRequestValue.Decode(request.Role_Code)),
                InputVarchar("p_ROLENAME", LegacyRequestValue.Decode(request.Role_Name)),
                InputVarchar("p_ROLEDESC", LegacyRequestValue.Decode(request.Description)),
                InputVarchar("p_CURR_USER", LegacyRequestValue.Decode(request.User_Id)),
                InputVarchar("p_groupidcheck", LegacyRequestValue.Decode(request.groupidcheck)),
                InputVarchar("p_isactive", LegacyRequestValue.Decode(request.Active)),
                InputVarchar("p_MenuAccess", LegacyRequestValue.Decode(request.MenuAccess)),
                Cursor(),
                Cursor("cur1")
            };

            return db.ExecuteDataSet("USP_DDP_ROLEMASTER_IUDS", parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter Cursor(string name = "cur")
        {
            return new OracleParameter(name, OracleDbType.RefCursor)
            {
                Direction = ParameterDirection.Output
            };
        }
    }
}
