using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using Integration.Data.Models;
using Oracle.ManagedDataAccess.Client;

namespace Integration.Data.Services
{
    public interface IMasterImportService
    {
        IReadOnlyList<MasterOption> GetMasters();
        DataSet GetMasterData(string masterKey);
        DataSet GetImportLog(string masterKey);
        MasterImportResult ImportMaster(string masterKey, string importedBy);
        IReadOnlyList<MasterImportResult> ImportAll(string importedBy);
    }

    public sealed class MasterImportService : IMasterImportService
    {
        private const int MaxStagingColumns = 50;
        private readonly IMasterDefinitionProvider definitions;

        public MasterImportService()
            : this(new DatabaseMasterDefinitionProvider())
        {
        }

        public MasterImportService(IMasterDefinitionProvider definitions)
        {
            this.definitions = definitions;
        }

        public IReadOnlyList<MasterOption> GetMasters()
        {
            return definitions.GetDefinitions()
                .Select(item => new MasterOption { Key = item.Key, Name = item.DisplayName })
                .ToArray();
        }

        public DataSet GetMasterData(string masterKey)
        {
            var definition = definitions.GetDefinition(masterKey);

            using (var connection = Open(definition.TargetConnectionStringName))
            using (var command = new OracleCommand("MF_USP_GET_MASTER_DATA", connection))
            using (var adapter = new OracleDataAdapter(command))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();
                command.Parameters.Add(new OracleParameter("p_Master_Id", OracleDbType.Decimal) { Value = definition.MasterId });
                command.Parameters.Add(new OracleParameter("p_data_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output });
                command.Parameters.Add(new OracleParameter("p_status_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output });

                var dataSet = new DataSet(definition.Key);
                adapter.Fill(dataSet);
                return dataSet;
            }
        }

        public DataSet GetImportLog(string masterKey)
        {
            var definition = definitions.GetDefinition(masterKey);

            using (var connection = Open(definition.TargetConnectionStringName))
            using (var command = connection.CreateCommand())
            using (var adapter = new OracleDataAdapter(command))
            {
                command.BindByName = true;
                command.CommandText = "MF_USP_GET_IMPORT_LOG";
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();

                command.Parameters.Add(
                    new OracleParameter(
                        "p_Master_Id",
                        OracleDbType.Decimal)
                    {
                        Direction = ParameterDirection.Input,
                        Value = definition.MasterId
                    });

                command.Parameters.Add(
                    new OracleParameter(
                        "cur",
                        OracleDbType.RefCursor)
                    {
                        Direction = ParameterDirection.Output
                    });

                var dataSet = new DataSet(definition.Key + "_IMPORT_LOG");
                adapter.Fill(dataSet);
                return dataSet;
            }
        }

        public MasterImportResult ImportMaster(string masterKey, string importedBy)
        {
            return ImportDefinition(definitions.GetDefinition(masterKey), importedBy);
        }

        public IReadOnlyList<MasterImportResult> ImportAll(string importedBy)
        {
            var results = new List<MasterImportResult>();
            foreach (var definition in definitions.GetDefinitions())
            {
                results.Add(ImportDefinition(definition, importedBy));
            }

            return results;
        }

        private MasterImportResult ImportDefinition(MasterDefinition definition, string importedBy)
        {
            var startedAt = DateTime.Now;
            var result = new MasterImportResult
            {
                MasterKey = definition.Key,
                MasterName = definition.DisplayName,
                StartedAt = startedAt
            };

            try
            {
                ValidateDefinition(definition);
                var sourceData = LoadSourceData(definition);

                using (var connection = Open(definition.TargetConnectionStringName))
                {
                    ClearStaging(connection, definition.MasterId);
                    InsertStagingRows(connection, definition.MasterId, sourceData);
                    var processResult = ProcessMaster(connection, definition.MasterId, importedBy);

                    result.Success = processResult.Success;
                    result.RecordCount = processResult.RecordCount;
                    result.Message = definition.DisplayName + " import " + (processResult.Success ? "completed" : "failed") + ": " + processResult.Message;
                }
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.RecordCount = 0;
                result.Message = definition.DisplayName + " import failed: " + ex.Message;
            }
            finally
            {
                result.CompletedAt = DateTime.Now;
            }

            return result;
        }

        private static DataTable LoadSourceData(MasterDefinition definition)
        {
            using (var connection = Open(definition.SourceConnectionStringName))
            using (var command = connection.CreateCommand())
            using (var adapter = new OracleDataAdapter(command))
            {
                command.CommandText = definition.SourceQuery;
                command.CommandType = CommandType.Text;
                command.CommandTimeout = CommandTimeout();

                var table = new DataTable(definition.Key + "_SOURCE");
                adapter.Fill(table);

                if (table.Columns.Count > MaxStagingColumns)
                {
                    throw new InvalidOperationException(definition.DisplayName + " source returned more than " + MaxStagingColumns + " columns.");
                }

                return table;
            }
        }

        private static void ClearStaging(OracleConnection connection, decimal masterId)
        {
            using (var command = new OracleCommand("MF_USP_CLEAR_MASTER_STAGING_DATA", connection))
            using (var adapter = new OracleDataAdapter(command))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();
                command.Parameters.Add(new OracleParameter("p_Master_Id", OracleDbType.Decimal) { Value = masterId });
                command.Parameters.Add(new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output });

                var result = new DataTable();
                adapter.Fill(result);
                EnsureProcedureSuccess(result, "Unable to clear master staging data.");
            }
        }

        private static void InsertStagingRows(OracleConnection connection, decimal masterId, DataTable sourceData)
        {
            foreach (DataRow sourceRow in sourceData.Rows)
            {
                using (var command = new OracleCommand("MF_USP_INSERT_MASTER_STAGING_DATA", connection))
                using (var adapter = new OracleDataAdapter(command))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.CommandTimeout = CommandTimeout();
                    command.Parameters.Add(new OracleParameter("p_Master_Id", OracleDbType.Decimal) { Value = masterId });

                    for (var index = 0; index < MaxStagingColumns; index++)
                    {
                        object value = DBNull.Value;
                        if (index < sourceData.Columns.Count)
                        {
                            value = sourceRow[index] == DBNull.Value ? (object)DBNull.Value : Convert.ToString(sourceRow[index]);
                        }

                        command.Parameters.Add(new OracleParameter("p_col" + (index + 1), OracleDbType.Varchar2) { Value = value });
                    }

                    command.Parameters.Add(new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output });

                    var result = new DataTable();
                    adapter.Fill(result);
                    EnsureProcedureSuccess(result, "Unable to insert master staging data.");
                }
            }
        }

        private static ProcedureResult ProcessMaster(OracleConnection connection, decimal masterId, string importedBy)
        {
            using (var command = new OracleCommand("MF_USP_PROCESS_MASTER", connection))
            using (var adapter = new OracleDataAdapter(command))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();
                command.Parameters.Add(new OracleParameter("p_Master_Id", OracleDbType.Decimal) { Value = masterId });
                command.Parameters.Add(new OracleParameter("p_Source_Table", OracleDbType.Varchar2) { Value = "MF_MASTER_DATA_STAGING" });
                command.Parameters.Add(new OracleParameter("p_Backup_Flag", OracleDbType.Varchar2) { Value = "Y" });
                command.Parameters.Add(new OracleParameter("p_Imported_By", OracleDbType.Varchar2) { Value = string.IsNullOrWhiteSpace(importedBy) ? "System" : importedBy });
                command.Parameters.Add(new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output });

                var table = new DataTable();
                adapter.Fill(table);
                return ToProcedureResult(table);
            }
        }

        private static void EnsureProcedureSuccess(DataTable table, string fallback)
        {
            var result = ToProcedureResult(table);
            if (!result.Success)
            {
                throw new InvalidOperationException(string.IsNullOrWhiteSpace(result.Message) ? fallback : result.Message);
            }
        }

        private static ProcedureResult ToProcedureResult(DataTable table)
        {
            if (table.Rows.Count == 0)
            {
                return new ProcedureResult { Success = true, Message = "Success", RecordCount = 0 };
            }

            var row = table.Rows[0];
            var status = Value(row, "STATUS");
            var message = Value(row, "MSG");
            if (string.IsNullOrWhiteSpace(message))
            {
                message = Value(row, "MESSAGE");
            }

            int recordCount;
            int.TryParse(Value(row, "RECORDCOUNT"), out recordCount);

            return new ProcedureResult
            {
                Success = status == "1" || status.Equals("Success", StringComparison.OrdinalIgnoreCase),
                Message = message,
                RecordCount = recordCount
            };
        }

        private static void ValidateDefinition(MasterDefinition definition)
        {
            if (string.IsNullOrWhiteSpace(definition.SourceQuery))
            {
                throw new InvalidOperationException(definition.DisplayName + " source query is not configured.");
            }

            if (definition.Mappings == null || definition.Mappings.Count == 0)
            {
                throw new InvalidOperationException(definition.DisplayName + " column mappings are not configured.");
            }
        }

        private static OracleConnection Open(string connectionStringName)
        {
            return DatabaseMasterDefinitionProvider.Open(connectionStringName);
        }

        private static int CommandTimeout()
        {
            int timeout;
            return int.TryParse(ConfigurationManager.AppSettings["Integration.CommandTimeoutSeconds"], out timeout) ? timeout : 120;
        }

        private static string Value(DataRow row, string columnName)
        {
            if (!row.Table.Columns.Contains(columnName) || row[columnName] == DBNull.Value)
            {
                return string.Empty;
            }

            return Convert.ToString(row[columnName]);
        }

        private sealed class ProcedureResult
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public int RecordCount { get; set; }
        }
    }
}
