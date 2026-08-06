using System.Collections.Generic;

namespace Integration.Data.Models
{
    public sealed class MasterDefinition
    {
        public decimal MasterId { get; set; }
        public string Key { get; set; }
        public string DisplayName { get; set; }
        public string SourceType { get; set; }
        public string DbType { get; set; }
        public string SourceConnectionStringName { get; set; }
        public string TargetConnectionStringName { get; set; }
        public string SourceQuery { get; set; }
        public string TargetTable { get; set; }
        public string BackupTable { get; set; }
        public string BackupFrequency { get; set; }
        public IReadOnlyList<MasterColumnMapping> Mappings { get; set; }
    }

    public sealed class MasterColumnMapping
    {
        public string SourceColumn { get; set; }
        public string DestinationColumn { get; set; }
        public string DataType { get; set; }
        public string IsMandatory { get; set; }
        public string DefaultValue { get; set; }
    }
}
