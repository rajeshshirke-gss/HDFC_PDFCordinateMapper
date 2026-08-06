using System;

namespace Integration.Data.Models
{
    public sealed class MasterImportResult
    {
        public string MasterKey { get; set; }
        public string MasterName { get; set; }
        public bool Success { get; set; }
        public int RecordCount { get; set; }
        public string Message { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
