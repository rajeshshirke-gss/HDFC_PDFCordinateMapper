using System;
using System.IO;
using System.Text;
using System.Web;
using HDFC.PDFCoordinateMapper.Api.Configuration;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    /// <summary>Thread-safe daily file logger suitable for a lightweight application.</summary>
    public static class Logger
    {
        private static readonly object SyncRoot = new object();

        public static void Info(string message) => Write("INFO", message);
        public static void Error(Exception exception, string correlationId) =>
            Write("ERROR", $"CorrelationId={correlationId}{Environment.NewLine}{exception}");

        private static void Write(string level, string message)
        {
            var basePath = HttpContext.Current?.Server.MapPath("~/" + AppSettings.LogPath)
                ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, AppSettings.LogPath);
            Directory.CreateDirectory(basePath);
            var line = $"{DateTime.UtcNow:O} [{level}] {message}{Environment.NewLine}";
            lock (SyncRoot)
                File.AppendAllText(Path.Combine(basePath, $"{DateTime.UtcNow:yyyyMMdd}.log"), line, Encoding.UTF8);
        }
    }
}
