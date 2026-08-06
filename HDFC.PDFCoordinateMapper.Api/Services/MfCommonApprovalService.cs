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
        private const string ExcludedAmcMasterName = "AMC Master";

        private readonly IDbHelper db;

        public MfCommonApprovalService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet GetPendingSummary(MfCommonApprovalRequest request)
        {
            request = request ?? new MfCommonApprovalRequest();
            if (IsAmcMaster(request.MasterName))
            {
                return EmptyDataSet();
            }

            request.Flag = "S";
            return RemoveAmcMasterRows(ExecuteApproval(request));
        }

        public DataSet GetMasters()
        {
            return RemoveAmcMasterRows(ExecuteApproval(new MfCommonApprovalRequest { Flag = "FM" }));
        }

        public DataSet GetPendingDetails(MfCommonApprovalDetailRequest request)
        {
            request = request ?? new MfCommonApprovalDetailRequest();
            if (IsAmcMaster(request.MasterName))
            {
                return MessageDataSet("AMC Master is not part of PDF Common Approval.");
            }

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
            if (IsAmcMaster(request.MasterName))
            {
                return MessageDataSet("AMC Master is not part of PDF Common Approval.");
            }

            request.Flag = "A";
            return ExecuteApproval(request);
        }

        public DataSet Reject(MfCommonApprovalRequest request)
        {
            request = request ?? new MfCommonApprovalRequest();
            if (IsAmcMaster(request.MasterName))
            {
                return MessageDataSet("AMC Master is not part of PDF Common Approval.");
            }

            request.Flag = "R";
            return ExecuteApproval(request);
        }

        private DataSet ExecuteApproval(MfCommonApprovalRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Flag))
            {
                throw new ArgumentException("PDF Common Approval flag is required.");
            }

            string commonApprovalId = request.Auto_Id;
            string tableAutoId = request.Tbl_Auto_Id;
            if (IsDecisionFlag(request.Flag) && !string.IsNullOrWhiteSpace(tableAutoId))
            {
                commonApprovalId = null;
            }
            else if (IsDecisionFlag(request.Flag) && string.IsNullOrWhiteSpace(tableAutoId))
            {
                tableAutoId = request.Auto_Id;
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", request.Flag),
                InputVarchar("p_Auto_Id", commonApprovalId),
                InputVarchar("p_tbl_Auto_Id", tableAutoId),
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

        private static bool IsDecisionFlag(string flag)
        {
            return string.Equals(flag, "A", StringComparison.OrdinalIgnoreCase)
                || string.Equals(flag, "APPROVE", StringComparison.OrdinalIgnoreCase)
                || string.Equals(flag, "R", StringComparison.OrdinalIgnoreCase)
                || string.Equals(flag, "REJECT", StringComparison.OrdinalIgnoreCase);
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

        private static bool IsAmcMaster(string masterName)
        {
            return string.Equals(masterName, ExcludedAmcMasterName, StringComparison.OrdinalIgnoreCase);
        }

        private static DataSet EmptyDataSet()
        {
            var dataSet = new DataSet();
            dataSet.Tables.Add(new DataTable());
            return dataSet;
        }

        private static DataSet MessageDataSet(string message)
        {
            var table = new DataTable();
            table.Columns.Add("MESSAGE", typeof(string));
            table.Columns.Add("ERRMSG", typeof(string));
            table.Rows.Add(message, message);

            var dataSet = new DataSet();
            dataSet.Tables.Add(table);
            return dataSet;
        }

        private static DataSet RemoveAmcMasterRows(DataSet dataSet)
        {
            if (dataSet == null)
            {
                return EmptyDataSet();
            }

            foreach (DataTable table in dataSet.Tables)
            {
                RemoveAmcMasterRows(table);
            }

            return dataSet;
        }

        private static void RemoveAmcMasterRows(DataTable table)
        {
            var masterColumn = FindColumn(table, "MASTERNAME")
                ?? FindColumn(table, "MASTER_NAME")
                ?? FindColumn(table, "MasterName")
                ?? FindColumn(table, "masterName")
                ?? FindColumn(table, "NAME")
                ?? FindColumn(table, "Name");

            if (masterColumn == null)
            {
                return;
            }

            for (var index = table.Rows.Count - 1; index >= 0; index--)
            {
                var value = Convert.ToString(table.Rows[index][masterColumn], System.Globalization.CultureInfo.InvariantCulture);
                if (IsAmcMaster(value))
                {
                    table.Rows.RemoveAt(index);
                }
            }
        }

        private static DataColumn FindColumn(DataTable table, string columnName)
        {
            return table.Columns.Contains(columnName) ? table.Columns[columnName] : null;
        }
    }
}
