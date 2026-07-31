using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Database
{
    public interface IConnectionFactory { OracleConnection Create(); }

    /// <summary>Centralizes Oracle connection construction without opening it prematurely.</summary>
    public sealed class ConnectionFactory : IConnectionFactory
    {
        private readonly string connectionString;
        public ConnectionFactory(string connectionString) { this.connectionString = connectionString; }
        public OracleConnection Create() => new OracleConnection(connectionString);
    }
}
