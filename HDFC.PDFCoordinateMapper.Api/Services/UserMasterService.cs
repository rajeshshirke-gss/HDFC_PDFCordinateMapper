using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Net;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Utilities;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IUserMasterService
    {
        DataSet SaveUserMaster(UserMasterRequest request);
        DataSet GetUserMaster();
        DataSet DeleteUserMaster(UserMasterRequest request);
        DataSet GetAllRecordForDdl();
        DataSet UserMasterIuds(UserMasterRequest request);
        DataSet UnlockUser(UserMasterRequest request);
    }

    public sealed class UserMasterService : IUserMasterService
    {
        private const string ProcedureName = "USP_DDP_USERMASTER_IUDS";

        private readonly IDbHelper db;

        public UserMasterService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet SaveUserMaster(UserMasterRequest request)
        {
            request = request ?? new UserMasterRequest();

            // Save uses Flag. For insert, Flag should be INSERT.
            return ExecuteUserMaster(request, request.Flag);
        }

        public DataSet GetUserMaster()
        {
            return ExecuteUserMaster(new UserMasterRequest(), "S");
        }

        public DataSet DeleteUserMaster(UserMasterRequest request)
        {
            request = request ?? new UserMasterRequest();
            return ExecuteUserMaster(request, "D");
        }

        public DataSet GetAllRecordForDdl()
        {
            return ExecuteUserMaster(new UserMasterRequest(), "DropDown");
        }

        public DataSet UserMasterIuds(UserMasterRequest request)
        {
            request = request ?? new UserMasterRequest();
            return ExecuteUserMaster(request, request.ProcessName);
        }

        public DataSet UnlockUser(UserMasterRequest request)
        {
            request = request ?? new UserMasterRequest();
            return ExecuteUserMaster(request, request.ProcessName);
        }

        private DataSet ExecuteUserMaster(UserMasterRequest request, string flag)
        {
            request = request ?? new UserMasterRequest();

            string qFlag = DecryptValue(flag);

            if (string.IsNullOrWhiteSpace(qFlag))
            {
                throw new ArgumentException("User Master flag/process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputNumber("p_Auto_Id", DecryptValue(request.Auto_Id)),
                InputVarchar("p_User_Id", DecryptValue(First(request.UserId, request.User_Id))),
                InputVarchar("p_Group_Id", DecryptValue(First(request.GroupId, request.Group_Id))),
                InputVarchar("p_User_Name", DecryptValue(request.User_Name)),
                // Existing SP inserts p_User_Id as password, so API keeps password blank.
                InputVarchar("p_Password", string.Empty),
                InputVarchar("p_Email", DecryptValue(First(request.Email, request.emailID))),
                InputVarchar("p_Module_Id", DecryptValue(request.Module_Id)),
                InputNumber("p_fstlogin", DecryptValue(request.fstlogin)),
                InputNumber("p_Login_Status", DecryptValue(request.Login_Status)),
                InputVarchar("p_Login_System", DecryptValue(request.LoginSystem)),
                InputNumber("p_nooflogintry", DecryptValue(request.nooflogintry)),
                InputNumber("p_Status", DecryptValue(request.Status)),
                // CreatedBy / ModifiedBy user.
                InputVarchar(
                    "p_UserID",
                    DecryptValue(First(request.currrentUserId, request.InitiatedBy))
                ),
                InputTimestamp("p_CreatedDate", null),
                InputTimestamp("p_ModifiedDate", null),
                InputTimestamp("p_ApprovedDate", null),
                InputVarchar("p_Qflag", qFlag),
                InputVarchar("p_ReportGroupId", DecryptValue(request.Report_GroupId)),
                InputVarchar("p_Dept_Id", DecryptValue(request.Dept_Id)),
                InputVarchar("p_UserRights", DecryptValue(request.Rights)),
                InputVarchar("p_Module_Access_Id", DecryptValue(request.Module_Access_Id)),
                InputVarchar("p_groupidcheck", DecryptValue(request.groupidcheck)),
                InputVarchar("p_isactive", DecryptValue(First(request.Active, request.isactive))),
                InputVarchar("p_isdormant", DecryptValue(First(request.Dormant, request.isUnterminate))),
                InputVarchar("p_DEPARTMENT_CODE", DecryptValue(request.DepartmentCode)),
                InputVarchar("p_DEPARTMENT_NAME", DecryptValue(request.DepartmentName)),
                InputVarchar("p_BRANCH_CODE", DecryptValue(request.BranchCode)),
                InputVarchar("P_BRANCH_NAME", DecryptValue(request.BranchName)),

                new OracleParameter("cur", OracleDbType.RefCursor)
                {
                    Direction = ParameterDirection.Output
                },
                new OracleParameter("cur1", OracleDbType.RefCursor)
                {
                    Direction = ParameterDirection.Output
                },
                new OracleParameter("cur2", OracleDbType.RefCursor)
                {
                    Direction = ParameterDirection.Output
                }
            };

            return db.ExecuteDataSet(ProcedureName, parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value)
                    ? (object)DBNull.Value
                    : value
            };
        }

        private static OracleParameter InputNumber(string name, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
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

        private static OracleParameter InputTimestamp(string name, DateTime? value)
        {
            return new OracleParameter(name, OracleDbType.TimeStamp)
            {
                Direction = ParameterDirection.Input,
                Value = value.HasValue
                    ? (object)value.Value
                    : DBNull.Value
            };
        }

        private static string DecryptValue(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            /*
             * This supports both:
             * 1. Encrypted values coming from Angular.
             * 2. Plain values entered directly in Swagger/Postman.
             *
             * Your Swagger test sends plain text like INSERT, SuperAdmin2, Y.
             * If we directly decrypt those, API can fail or send null to SP.
             */
            string trimmedValue = value.Trim();
            string decodedValue = WebUtility.UrlDecode(trimmedValue);

            string[] candidates;

            if (!string.Equals(trimmedValue, decodedValue, StringComparison.Ordinal))
            {
                candidates = new[] { trimmedValue, decodedValue };
            }
            else
            {
                candidates = new[] { trimmedValue };
            }

            foreach (string candidate in candidates)
            {
                try
                {
                    string decryptedValue = LegacyAesHelper.DecryptUserMasterValue(candidate);

                    if (!string.IsNullOrWhiteSpace(decryptedValue))
                    {
                        return decryptedValue;
                    }
                }
                catch
                {
                    // Not encrypted, continue and finally return plain decoded value.
                }
            }

            return decodedValue;
        }

        private static string First(string first, string second)
        {
            return string.IsNullOrWhiteSpace(first) ? second : first;
        }
    }
}
