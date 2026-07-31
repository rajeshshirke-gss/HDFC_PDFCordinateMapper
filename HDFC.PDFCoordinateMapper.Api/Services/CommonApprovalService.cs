using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface ICommonApprovalService
    {
        DataSet GetAllUser(UserMasterRequest request);
        DataSet GetAllMasterForDdl();
        DataSet ApproveOrRejectUser(UserMasterRequest request);
        DataSet GetDataCommonApproval(CommonApprovalRequest request);
        DataSet CommonApprovalAr(CommonApprovalArRequest request);
    }

    public sealed class CommonApprovalService : ICommonApprovalService
    {
        private readonly IDbHelper db;

        public CommonApprovalService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet GetAllUser(UserMasterRequest request)
        {
            return ExecuteCommonApprovalForUser(request ?? new UserMasterRequest(), request?.Flag);
        }

        public DataSet GetAllMasterForDdl()
        {
            return ExecuteCommonApprovalForUser(new UserMasterRequest(), "FM");
        }

        public DataSet ApproveOrRejectUser(UserMasterRequest request)
        {
            return ExecuteCommonApprovalForUser(request ?? new UserMasterRequest(), request?.Flag);
        }

        public DataSet GetDataCommonApproval(CommonApprovalRequest request)
        {
            request = request ?? new CommonApprovalRequest();

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_MASTER_NAME", LegacyRequestValue.Decode(request.Auth_MasterName)),
                InputVarchar("p_UPDATED_BY", LegacyRequestValue.Decode(request.Auth_UpdatedBy)),
                InputVarchar("p_CURR_USER", LegacyRequestValue.Decode(request.Auth_CurrUser)),
                InputVarchar("p_AUTO_ID", LegacyRequestValue.Decode(request.Auth_AutoId)),
                Cursor()
            };

            return db.ExecuteDataSet("USP_GET_COMMAPPROVALDATA_CCIL", parameters);
        }

        public DataSet CommonApprovalAr(CommonApprovalArRequest request)
        {
            request = request ?? new CommonApprovalArRequest();

            string qFlag = DecodeFirst(request.Qflag);
            string tableAutoId = DecodeFirst(request.tbl_Auto_Id);
            string masterName = DecodeFirst(request.MasterName);
            string currentUser = DecodeFirst(request.UserID);

            if (IsNullValue(qFlag)) throw new ArgumentException("qflag is required.");
            if (IsNullValue(tableAutoId)) throw new ArgumentException("tbl_Auto_Id is required.");
            if (IsNullValue(masterName)) throw new ArgumentException("masterName is required.");
            if (IsNullValue(currentUser)) throw new ArgumentException("userID is required.");

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", qFlag),
                InputVarchar("p_Auto_Id", DecodeFirst(request.Auto_Id)),
                InputVarchar("p_tbl_Auto_Id", tableAutoId),
                InputVarchar("p_MasterName", masterName),
                InputVarchar("p_User", DecodeFirst(request.User)),
                InputVarchar("p_Group_Id", DecodeFirst(request.Group_Id)),
                InputVarchar("p_UserName", DecodeFirst(request.UserName)),
                InputVarchar("p_Email", DecodeFirst(request.Email)),
                InputVarchar("p_Action", DecodeFirst(request.Action)),
                InputNumber("p_Status", DecodeFirst(request.Status)),
                InputVarchar("p_UserID", currentUser),
                InputTimestamp("p_CreatedDate", DecodeFirst(request.CreatedDate)),
                InputVarchar("p_RoleDescription", DecodeFirst(request.RoleDescription)),
                InputVarchar("p_RoleName", DecodeFirst(request.RoleName)),
                InputTimestamp("p_ModifiedDate", DecodeFirst(request.ModifiedDate)),
                InputVarchar("p_Password", DecodeFirst(request.Password)),
                InputVarchar("p_clienttype", DecodeFirst(request.clienttype)),
                InputVarchar("p_accounttype", DecodeFirst(request.accounttype)),
                InputVarchar("p_clientname", DecodeFirst(request.clientname)),
                InputVarchar("p_clientid", DecodeFirst(request.clientid)),
                InputVarchar("p_configuration", DecodeFirst(request.configuration)),
                InputVarchar("p_specification", DecodeFirst(request.specification)),
                InputVarchar("p_Value", DecodeFirst(request.Value)),
                InputVarchar("p_isactive", DecodeFirst(request.isactive)),
                Cursor()
            };

            return db.ExecuteDataSet("usp_Common_Approval_IUDS", parameters);
        }

        private DataSet ExecuteCommonApprovalForUser(UserMasterRequest request, string flag)
        {
            string qFlag = string.Equals(flag, "FM", StringComparison.OrdinalIgnoreCase)
                ? "FM"
                : LegacyRequestValue.Decode(flag);

            if (string.IsNullOrWhiteSpace(qFlag))
            {
                throw new ArgumentException("Common Approval flag is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", qFlag),
                InputVarchar("p_Auto_Id", LegacyRequestValue.Decode(request.Auto_Id)),
                InputVarchar("p_tbl_Auto_Id", null),
                InputVarchar("p_MasterName", LegacyRequestValue.Decode(request.MasterName)),
                InputVarchar("p_User", null),
                InputVarchar("p_Group_Id", null),
                InputVarchar("p_UserName", null),
                InputVarchar("p_Email", null),
                InputVarchar("p_Action", null),
                InputNumber("p_Status", null),
                InputVarchar("p_UserID", DecodeFirst(request.User_Id, request.UserId, request.currrentUserId, request.userName)),
                InputTimestamp("p_CreatedDate", null),
                InputVarchar("p_RoleDescription", null),
                InputVarchar("p_RoleName", null),
                InputTimestamp("p_ModifiedDate", null),
                InputVarchar("p_Password", null),
                InputVarchar("p_clienttype", null),
                InputVarchar("p_accounttype", null),
                InputVarchar("p_clientname", null),
                InputVarchar("p_clientid", null),
                InputVarchar("p_configuration", null),
                InputVarchar("p_specification", null),
                InputVarchar("p_Value", null),
                InputVarchar("p_isactive", null),
                Cursor()
            };

            return db.ExecuteDataSet("usp_Common_Approval_IUDS", parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = IsNullValue(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter InputNumber(string name, string value)
        {
            if (IsNullValue(value))
            {
                return new OracleParameter(name, OracleDbType.Decimal)
                {
                    Direction = ParameterDirection.Input,
                    Value = DBNull.Value
                };
            }

            decimal parsedValue;

            if (!decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsedValue))
            {
                return new OracleParameter(name, OracleDbType.Decimal)
                {
                    Direction = ParameterDirection.Input,
                    Value = DBNull.Value
                };
            }

            return new OracleParameter(name, OracleDbType.Decimal)
            {
                Direction = ParameterDirection.Input,
                Value = parsedValue
            };
        }

        private static OracleParameter InputTimestamp(string name, string value)
        {
            if (IsNullValue(value))
            {
                return new OracleParameter(name, OracleDbType.TimeStamp)
                {
                    Direction = ParameterDirection.Input,
                    Value = DBNull.Value
                };
            }

            DateTime parsedValue;

            if (!DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces, out parsedValue))
            {
                return new OracleParameter(name, OracleDbType.TimeStamp)
                {
                    Direction = ParameterDirection.Input,
                    Value = DBNull.Value
                };
            }

            return new OracleParameter(name, OracleDbType.TimeStamp)
            {
                Direction = ParameterDirection.Input,
                Value = parsedValue
            };
        }

        private static OracleParameter Cursor(string name = "cur")
        {
            return new OracleParameter(name, OracleDbType.RefCursor)
            {
                Direction = ParameterDirection.Output
            };
        }

        private static string DecodeFirst(params string[] values)
        {
            foreach (string value in values)
            {
                if (!IsNullValue(value))
                {
                    return LegacyRequestValue.Decode(value);
                }
            }

            return null;
        }

        private static bool IsNullValue(string value)
        {
            return string.IsNullOrWhiteSpace(value)
                || string.Equals(value.Trim(), "null", StringComparison.OrdinalIgnoreCase)
                || string.Equals(value.Trim(), "string", StringComparison.OrdinalIgnoreCase);
        }
    }
}
