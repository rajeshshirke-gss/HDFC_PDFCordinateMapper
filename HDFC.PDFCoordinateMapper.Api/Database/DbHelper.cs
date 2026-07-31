using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Constants;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Database
{
    public interface IDbHelper
    {
        DataSet ExecuteDataSet(string procedureName, IEnumerable<OracleParameter> parameters = null);
        DataTable ExecuteDataTable(string procedureName, IEnumerable<OracleParameter> parameters = null);
        object ExecuteScalar(string procedureName, IEnumerable<OracleParameter> parameters = null);
        int ExecuteNonQuery(string procedureName, IEnumerable<OracleParameter> parameters = null);
        void ExecuteReader(string procedureName, Action<OracleDataReader> read, IEnumerable<OracleParameter> parameters = null);
    }

    /// <summary>The application's single gateway to Oracle. It accepts stored procedures only.</summary>
    public sealed class DbHelper : IDbHelper
    {
        private readonly IConnectionFactory connectionFactory;
        public DbHelper(IConnectionFactory connectionFactory) { this.connectionFactory = connectionFactory; }

        public DataSet ExecuteDataSet(string procedureName, IEnumerable<OracleParameter> parameters = null)
        {
            using (var connection = connectionFactory.Create())
            using (var command = CreateCommand(connection, procedureName, parameters))
            using (var adapter = new OracleDataAdapter(command))
            {
                var result = new DataSet();
                adapter.Fill(result);
                return result;
            }
        }

        public DataTable ExecuteDataTable(string procedureName, IEnumerable<OracleParameter> parameters = null)
        {
            var dataSet = ExecuteDataSet(procedureName, parameters);
            return dataSet.Tables.Count == 0 ? new DataTable() : dataSet.Tables[0];
        }

        public object ExecuteScalar(string procedureName, IEnumerable<OracleParameter> parameters = null)
        {
            using (var connection = connectionFactory.Create())
            using (var command = CreateCommand(connection, procedureName, parameters))
            {
                connection.Open();
                return command.ExecuteScalar();
            }
        }

        public int ExecuteNonQuery(string procedureName, IEnumerable<OracleParameter> parameters = null)
        {
            using (var connection = connectionFactory.Create())
            using (var command = CreateCommand(connection, procedureName, parameters))
            {
                connection.Open();
                return command.ExecuteNonQuery();
            }
        }

        public void ExecuteReader(string procedureName, Action<OracleDataReader> read, IEnumerable<OracleParameter> parameters = null)
        {
            if (read == null) throw new ArgumentNullException(nameof(read));
            using (var connection = connectionFactory.Create())
            using (var command = CreateCommand(connection, procedureName, parameters)) 
            {
                connection.Open();
                using (var reader = command.ExecuteReader()) read(reader);
            }
        }

        private static OracleCommand CreateCommand(OracleConnection connection, string procedureName, IEnumerable<OracleParameter> parameters)
        {
            if (string.IsNullOrWhiteSpace(procedureName)) throw new ArgumentException("Stored procedure name is required.", nameof(procedureName));
            var command = connection.CreateCommand();
            command.CommandText = procedureName;
            command.CommandType = CommandType.StoredProcedure;
            command.CommandTimeout = ApiConstants.DefaultCommandTimeoutSeconds;
            command.BindByName = true;
            if (parameters != null)
                foreach (var parameter in parameters) 
                    command.Parameters.Add(parameter);
            return command;
        }
    }
}
