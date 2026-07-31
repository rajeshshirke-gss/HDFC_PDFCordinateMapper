using System;
using System.Data;
using System.Linq;
using System.Text;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    public static class CsvHelper
    {
        public static string ToCsv(DataTable table)
        {
            if (table == null) throw new ArgumentNullException(nameof(table));
            var output = new StringBuilder();
            output.AppendLine(string.Join(",", table.Columns.Cast<DataColumn>().Select(c => Escape(c.ColumnName))));
            foreach (DataRow row in table.Rows)
                output.AppendLine(string.Join(",", row.ItemArray.Select(value => Escape(Convert.ToString(value)))));
            return output.ToString();
        }

        private static string Escape(string value)
        {
            value = value ?? string.Empty;
            return value.IndexOfAny(new[] { ',', '"', '\r', '\n' }) >= 0 ? $"\"{value.Replace("\"", "\"\"")}\"" : value;
        }
    }
}
