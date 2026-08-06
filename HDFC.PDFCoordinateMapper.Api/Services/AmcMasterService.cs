using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IAmcMasterService
    {
        DataSet SaveAmcMaster(AmcMasterRequest request);
        DataSet GetAmcMaster();
        DataSet GetAmcMasterById(string autoId);
        DataSet DeleteAmcMaster(AmcMasterRequest request);
    }

    public sealed class AmcMasterService : IAmcMasterService
    {
        private const string ProcedureName = "MF_AMC_MASTER_IUDS";

        private readonly IDbHelper db;

        public AmcMasterService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet SaveAmcMaster(AmcMasterRequest request)
        {
            return ReadOnlyMessage();
        }

        public DataSet GetAmcMaster()
        {
            return ExecuteAmcMaster(new AmcMasterRequest(), "S");
        }

        public DataSet GetAmcMasterById(string autoId)
        {
            return ExecuteAmcMaster(new AmcMasterRequest { Auto_Id = autoId }, "GETBYID");
        }

        public DataSet DeleteAmcMaster(AmcMasterRequest request)
        {
            return ReadOnlyMessage();
        }

        private DataSet ExecuteAmcMaster(AmcMasterRequest request, string flag)
        {
            request = request ?? new AmcMasterRequest();
            if (string.IsNullOrWhiteSpace(flag))
            {
                throw new ArgumentException("AMC Master flag/process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", flag),
                InputNumber("p_Auto_Id", request.Auto_Id),
                InputNumber("p_Mst_Col_Id", request.Mst_Col_Id),
                InputVarchar("p_Amc_Code", request.Amc_Code),
                InputVarchar("p_Amc_Name", request.Amc_Name),
                InputVarchar("p_Amc_Description", request.Amc_Description),
                InputVarchar("p_IsActive", request.IsActive),
                InputVarchar("p_UserId", request.CurrentUserId),
                InputVarchar("p_Remark", request.Remark),
                new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output },
                new OracleParameter("cur1", OracleDbType.RefCursor) { Direction = ParameterDirection.Output }
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

        private static OracleParameter InputNumber(string name, string value)
        {
            decimal parsed;
            return new OracleParameter(name, OracleDbType.Decimal)
            {
                Direction = ParameterDirection.Input,
                Value = decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsed)
                    ? (object)parsed
                    : DBNull.Value
            };
        }

        private static DataSet ReadOnlyMessage()
        {
            var table = new DataTable();
            table.Columns.Add("MESSAGE", typeof(string));
            table.Columns.Add("ERRMSG", typeof(string));
            table.Rows.Add("AMC Master maintenance is not part of PDF Common Approval.", "AMC Master maintenance is not part of PDF Common Approval.");

            var dataSet = new DataSet();
            dataSet.Tables.Add(table);
            return dataSet;
        }
    }
}
