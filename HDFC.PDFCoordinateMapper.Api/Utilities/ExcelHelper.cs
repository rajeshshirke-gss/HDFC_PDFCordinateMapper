using System;
using System.Data;
using System.IO;
using System.Linq;
using System.Xml;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    /// <summary>Creates Excel-readable XML without adding a heavyweight spreadsheet dependency.</summary>
    public static class ExcelHelper
    {
        public static byte[] ToSpreadsheetXml(DataTable table)
        {
            if (table == null) throw new ArgumentNullException(nameof(table));
            using (var stream = new MemoryStream())
            using (var writer = XmlWriter.Create(stream, new XmlWriterSettings { Encoding = System.Text.Encoding.UTF8 }))
            {
                writer.WriteStartDocument();
                writer.WriteStartElement("Workbook", "urn:schemas-microsoft-com:office:spreadsheet");
                writer.WriteAttributeString("xmlns", "ss", null, "urn:schemas-microsoft-com:office:spreadsheet");
                writer.WriteStartElement("Worksheet"); writer.WriteAttributeString("ss", "Name", null, "Data");
                writer.WriteStartElement("Table");
                WriteRow(writer, table.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToArray());
                foreach (DataRow row in table.Rows) WriteRow(writer, row.ItemArray);
                writer.WriteEndElement(); writer.WriteEndElement(); writer.WriteEndElement();
                writer.WriteEndDocument(); writer.Flush();
                return stream.ToArray();
            }
        }

        private static void WriteRow(XmlWriter writer, object[] values)
        {
            writer.WriteStartElement("Row");
            foreach (var value in values)
            {
                writer.WriteStartElement("Cell"); writer.WriteStartElement("Data");
                writer.WriteAttributeString("ss", "Type", null, "String");
                writer.WriteString(Convert.ToString(value)); writer.WriteEndElement(); writer.WriteEndElement();
            }
            writer.WriteEndElement();
        }
    }
}
