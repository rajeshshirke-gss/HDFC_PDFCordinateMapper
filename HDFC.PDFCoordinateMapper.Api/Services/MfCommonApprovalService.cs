using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IMfCommonApprovalService
    {
        DataSet GetPendingSummary(MfCommonApprovalRequest request);
        DataSet GetMasters();
        DataSet GetPendingDetails(MfCommonApprovalDetailRequest request);
        DataSet Approve(MfCommonApprovalRequest request);
        DataSet Reject(MfCommonApprovalRequest request);
    }

    public sealed class MfCommonApprovalService : IMfCommonApprovalService
    {
        private const string ApprovalProcedureName = "MF_COMMON_APPROVAL_IUDS";
        private const string DetailProcedureName = "MF_GET_COMMON_APPROVAL_DATA";

        private readonly IDbHelper db;

        public MfCommonApprovalService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet GetPendingSummary(MfCommonApprovalRequest request)
        {
            request = request ?? new MfCommonApprovalRequest();
            request.Flag = "S";
            return ExecuteApproval(request);
        }

        public DataSet GetMasters()
        {
            return ExecuteApproval(new MfCommonApprovalRequest { Flag = "FM" });
        }

        public DataSet GetPendingDetails(MfCommonApprovalDetailRequest request)
        {
            request = request ?? new MfCommonApprovalDetailRequest();

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_MASTER_NAME", request.MasterName),
                InputVarchar("p_UPDATED_BY", request.UpdatedBy),
                InputVarchar("p_CURR_USER", request.CurrentUserId),
                InputVarchar("p_AUTO_ID", request.AutoId),
                Cursor()
            };

            return db.ExecuteDataSet(DetailProcedureName, parameters);
        }

        public DataSet Approve(MfCommonApprovalRequest request)
        {
            request = request ?? new MfCommonApprovalRequest();
            request.Flag = "A";
            return ExecuteApproval(request);
        }

        public DataSet Reject(MfCommonApprovalRequest request)
        {
            request = request ?? new MfCommonApprovalRequest();
            request.Flag = "R";
            return ExecuteApproval(request);
        }

        private DataSet ExecuteApproval(MfCommonApprovalRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Flag))
            {
                throw new ArgumentException("PDF Common Approval flag is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", request.Flag),
                InputVarchar("p_Auto_Id", request.Auto_Id),
                InputVarchar("p_tbl_Auto_Id", request.Tbl_Auto_Id),
                InputVarchar("p_MasterName", request.MasterName),
                InputVarchar("p_User", null),
                InputVarchar("p_Group_Id", null),
                InputVarchar("p_UserName", null),
                InputVarchar("p_Email", null),
                InputVarchar("p_Action", request.Flag),
                InputNumber("p_Status", null),
                InputVarchar("p_UserID", request.CurrentUserId),
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
                InputVarchar("p_Value", request.Remark),
                InputVarchar("p_isactive", null),
                Cursor()
            };

            return db.ExecuteDataSet(ApprovalProcedureName, parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter InputNumber(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Decimal)
            {
                Direction = ParameterDirection.Input,
                Value = DBNull.Value
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
    }
}
