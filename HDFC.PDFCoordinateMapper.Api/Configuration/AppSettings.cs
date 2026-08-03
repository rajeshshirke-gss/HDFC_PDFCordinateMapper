using System;
using System.Configuration;

namespace HDFC.PDFCoordinateMapper.Api.Configuration
{
    /// <summary>Provides strongly typed, fail-fast access to Web.config settings.</summary>
    public static class AppSettings
    {
        public static string OracleConnectionString => RequiredConnectionString("OracleDb");
        public static string JwtIssuer => Required("JwtIssuer");
        public static string JwtAudience => Required("JwtAudience");
        public static string JwtSecret => Required("JwtSecret");
        public static int JwtExpiryMinutes => PositiveInt("JwtExpiryMinutes");
        public static string EncryptionKey => Required("EncryptionKey");
        public static string LogPath => Required("LogPath");
        public static string UploadPath => Required("UploadPath");
        public static string AllowedCorsOrigins => Required("AllowedCorsOrigins");
        public static bool EnableJwtAuthorization => OptionalBool("EnableJwtAuthorization", false);
        public static string SpValidateUser => Required("SpValidateUser");
        public static string SpGetCoordinates => Required("SpGetCoordinates");
        public static string SpSaveCoordinate => Required("SpSaveCoordinate");

        private static string Required(string key)
        {
            var value = ConfigurationManager.AppSettings[key];
            if (string.IsNullOrWhiteSpace(value)) throw new ConfigurationErrorsException($"AppSetting '{key}' is required.");
            return value;
        }

        private static string RequiredConnectionString(string name)
        {
            var setting = ConfigurationManager.ConnectionStrings[name];
            if (setting == null || string.IsNullOrWhiteSpace(setting.ConnectionString))
                throw new ConfigurationErrorsException($"Connection string '{name}' is required.");
            return setting.ConnectionString;
        }

        private static int PositiveInt(string key)
        {
            int value;
            if (!int.TryParse(Required(key), out value) || value <= 0)
                throw new ConfigurationErrorsException($"AppSetting '{key}' must be a positive integer.");
            return value;
        }

        private static bool OptionalBool(string key, bool defaultValue)
        {
            var value = ConfigurationManager.AppSettings[key];
            if (string.IsNullOrWhiteSpace(value)) return defaultValue;

            bool parsed;
            if (!bool.TryParse(value, out parsed))
                throw new ConfigurationErrorsException($"AppSetting '{key}' must be true or false.");

            return parsed;
        }
    }
}
