using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using Integration.Data.Models;
using Oracle.ManagedDataAccess.Client;

namespace Integration.Data.Services
{
    public interface IMasterDefinitionProvider
    {
        IReadOnlyList<MasterDefinition> GetDefinitions();
        MasterDefinition GetDefinition(string key);
    }

    public sealed class DatabaseMasterDefinitionProvider : IMasterDefinitionProvider
    {
        public IReadOnlyList<MasterDefinition> GetDefinitions()
        {
            var definitions = new List<MasterDefinition>();
            using (var connection = Open(TargetConnectionStringName()))
            using (var command = connection.CreateCommand())
            {
                command.BindByName = true;
                command.CommandText = "MF_USP_DROPDOWN_DATA";
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();

                command.Parameters.Add(
                    new OracleParameter(
                        "p_process_name",
                        OracleDbType.Varchar2)
                    {
                        Direction = ParameterDirection.Input,
                        Value = "ALLDROPDOWN_DATA"
                    });

                command.Parameters.Add(
                    new OracleParameter(
                        "cur",
                        OracleDbType.RefCursor)
                    {
                        Direction = ParameterDirection.Output
                    });

                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var sourceType = Value(reader, "SOURCETYPE");
                        definitions.Add(new MasterDefinition
                        {
                            MasterId = Convert.ToDecimal(reader["AUTOID"]),
                            Key = KeyFor(Value(reader, "MASTERNAME")),
                            DisplayName = Value(reader, "MASTERNAME"),
                            SourceType = sourceType,
                            DbType = Value(reader, "DBTYPE"),
                            SourceConnectionStringName = SourceConnectionStringName(sourceType),
                            TargetConnectionStringName = TargetConnectionStringName(),
                            SourceQuery = Value(reader, "QUERY"),
                            TargetTable = Value(reader, "TARGETTABLE"),
                            BackupTable = Value(reader, "BACKUPTABLE"),
                            BackupFrequency = Value(reader, "BACKUPFREQUENCY")
                        });
                    }
                }
            }

            foreach (var definition in definitions)
            {
                definition.Mappings = GetMappings(definition.MasterId);
            }

            return definitions;
        }

        public MasterDefinition GetDefinition(string key)
        {
            var definition = GetDefinitions().FirstOrDefault(item =>
                string.Equals(item.Key, key, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.MasterId.ToString("0"), key, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.DisplayName, key, StringComparison.OrdinalIgnoreCase));

            if (definition == null)
            {
                throw new InvalidOperationException("Active master configuration was not found for " + key + ".");
            }

            return definition;
        }

        private static IReadOnlyList<MasterColumnMapping> GetMappings(decimal masterId)
        {
            var mappings = new List<MasterColumnMapping>();
            using (var connection = Open(TargetConnectionStringName()))
            using (var command = connection.CreateCommand())
            {
                command.BindByName = true;
                command.CommandText = "MF_USP_GET_MASTER_MAPPINGS";
                command.CommandType = CommandType.StoredProcedure;
                command.CommandTimeout = CommandTimeout();

                command.Parameters.Add(
                    new OracleParameter(
                        "p_Master_Id",
                        OracleDbType.Decimal)
                    {
                        Direction = ParameterDirection.Input,
                        Value = masterId
                    });

                command.Parameters.Add(
                    new OracleParameter(
                        "cur",
                        OracleDbType.RefCursor)
                    {
                        Direction = ParameterDirection.Output
                    });

                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        mappings.Add(new MasterColumnMapping
                        {
                            SourceColumn = Value(reader, "SOURCECOLUMN"),
                            DestinationColumn = Value(reader, "DESTINATIONCOLUMN"),
                            DataType = Value(reader, "DATATYPE"),
                            IsMandatory = Value(reader, "ISMANDATORY"),
                            DefaultValue = Value(reader, "DEFAULTVALUE")
                        });
                    }
                }
            }

            return mappings;
        }

        private static string SourceConnectionStringName(string sourceType)
        {
            if (string.IsNullOrWhiteSpace(sourceType))
            {
                return DefaultSourceConnectionStringName();
            }

            var direct = ConfigurationManager.ConnectionStrings[sourceType];
            if (direct != null)
            {
                return sourceType;
            }

            var prefixed = (ConfigurationManager.AppSettings["Integration.SourceConnectionPrefix"] ?? "MasterRefresh") + "." + sourceType;
            if (ConfigurationManager.ConnectionStrings[prefixed] != null)
            {
                return prefixed;
            }

            return DefaultSourceConnectionStringName();
        }

        private static string TargetConnectionStringName()
        {
            return ConfigurationManager.AppSettings["Integration.TargetConnectionStringName"] ?? "OracleDb";
        }

        private static string DefaultSourceConnectionStringName()
        {
            return ConfigurationManager.AppSettings["Integration.DefaultSourceConnectionStringName"] ?? "ExternalMasterSource";
        }

        internal static OracleConnection Open(string connectionStringName)
        {
            var setting = ConfigurationManager.ConnectionStrings[connectionStringName];
            if (setting == null || string.IsNullOrWhiteSpace(setting.ConnectionString))
            {
                throw new InvalidOperationException("Missing connection string: " + connectionStringName);
            }

            var connection = new OracleConnection(setting.ConnectionString);
            connection.Open();
            return connection;
        }

        internal static int CommandTimeout()
        {
            int timeout;
            return int.TryParse(ConfigurationManager.AppSettings["Integration.CommandTimeoutSeconds"], out timeout) ? timeout : 120;
        }

        private static string KeyFor(string masterName)
        {
            if (masterName == null) return string.Empty;
            return masterName.Replace(" Master", string.Empty).Replace(" ", string.Empty).ToUpperInvariant();
        }

        private static string Value(IDataRecord reader, string columnName)
        {
            var value = reader[columnName];
            return value == DBNull.Value ? string.Empty : Convert.ToString(value);
        }
    }
}
