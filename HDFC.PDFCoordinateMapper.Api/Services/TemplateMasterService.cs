using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Web;
using HDFC.PDFCoordinateMapper.Api.Configuration;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface ITemplateMasterService
    {
        DataSet SaveTemplateMaster(TemplateMasterRequest request);
        DataSet GetTemplateMaster();
        DataSet GetTemplateMasterById(string autoId);
        DataSet DeleteTemplateMaster(TemplateMasterRequest request);
        TemplateUploadResult UploadTemplatePdf(HttpPostedFile file);
        string ResolveTemplateFilePath(string templateId);
    }

    public sealed class TemplateMasterService : ITemplateMasterService
    {
        private const string ProcedureName = "MF_TEMPLATE_MASTER_IUDS";

        private readonly IDbHelper db;

        public TemplateMasterService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet SaveTemplateMaster(TemplateMasterRequest request)
        {
            request = request ?? new TemplateMasterRequest();
            return ExecuteTemplateMaster(request, request.Flag);
        }

        public DataSet GetTemplateMaster()
        {
            return ExecuteTemplateMaster(new TemplateMasterRequest(), "S");
        }

        public DataSet GetTemplateMasterById(string autoId)
        {
            return ExecuteTemplateMaster(new TemplateMasterRequest { Auto_Id = autoId }, "GETBYID");
        }

        public DataSet DeleteTemplateMaster(TemplateMasterRequest request)
        {
            request = request ?? new TemplateMasterRequest();
            return ExecuteTemplateMaster(request, "D");
        }

        public TemplateUploadResult UploadTemplatePdf(HttpPostedFile file)
        {
            if (file == null || file.ContentLength <= 0)
            {
                throw new InvalidOperationException("PDF file is required.");
            }

            string extension = Path.GetExtension(file.FileName);
            if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Only PDF files are allowed.");
            }

            byte[] bytes;
            using (var input = file.InputStream)
            using (var memory = new MemoryStream())
            {
                input.CopyTo(memory);
                bytes = memory.ToArray();
            }

            if (!HasPdfHeader(bytes))
            {
                throw new InvalidOperationException("The uploaded file is not a valid PDF.");
            }

            string templateFolder = HttpContext.Current.Server.MapPath(Path.Combine(AppSettings.UploadPath, "Templates"));
            Directory.CreateDirectory(templateFolder);

            string originalName = Path.GetFileName(file.FileName);
            string storedName = string.Format(
                CultureInfo.InvariantCulture,
                "{0:yyyyMMddHHmmssfff}_{1:N}.pdf",
                DateTime.UtcNow,
                Guid.NewGuid());
            string fullPath = Path.Combine(templateFolder, storedName);
            File.WriteAllBytes(fullPath, bytes);

            return new TemplateUploadResult
            {
                OriginalFileName = originalName,
                StoredFileName = storedName,
                FilePath = Path.Combine("Templates", storedName).Replace("\\", "/"),
                FileHash = Sha256(bytes),
                FileSizeBytes = bytes.LongLength,
                MimeType = "application/pdf",
                PdfPageCount = CountPdfPages(bytes)
            };
        }

        public string ResolveTemplateFilePath(string templateId)
        {
            DataSet dataSet = GetTemplateMasterById(templateId);
            if (dataSet.Tables.Count == 0 || dataSet.Tables[0].Rows.Count == 0)
            {
                throw new FileNotFoundException("Template record was not found.");
            }

            DataRow row = dataSet.Tables[0].Rows[0];
            string storedFileName = Value(row, "STORED_FILE_NAME", "storedFileName", "StoredFileName");
            if (string.IsNullOrWhiteSpace(storedFileName))
            {
                throw new FileNotFoundException("Template PDF is not available.");
            }

            string templateFolder = HttpContext.Current.Server.MapPath(Path.Combine(AppSettings.UploadPath, "Templates"));
            string fullPath = Path.Combine(templateFolder, Path.GetFileName(storedFileName));
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException("Template PDF file was not found.");
            }

            return fullPath;
        }

        private DataSet ExecuteTemplateMaster(TemplateMasterRequest request, string flag)
        {
            request = request ?? new TemplateMasterRequest();
            if (string.IsNullOrWhiteSpace(flag))
            {
                throw new ArgumentException("Template Master flag/process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", flag),
                InputNumber("p_Auto_Id", request.Auto_Id),
                InputNumber("p_Mst_Col_Id", request.Mst_Col_Id),
                InputVarchar("p_Template_Code", request.Template_Code),
                InputVarchar("p_Template_Name", request.Template_Name),
                InputVarchar("p_Template_Description", request.Template_Description),
                InputVarchar("p_Original_File_Name", request.Original_File_Name),
                InputVarchar("p_Stored_File_Name", request.Stored_File_Name),
                InputVarchar("p_File_Path", request.File_Path),
                InputVarchar("p_File_Hash", request.File_Hash),
                InputNumber("p_File_Size_Bytes", request.File_Size_Bytes),
                InputVarchar("p_Mime_Type", request.Mime_Type),
                InputNumber("p_Pdf_Page_Count", request.Pdf_Page_Count),
                InputVarchar("p_Mapping_Page_Numbers", request.Mapping_Page_Numbers),
                InputVarchar("p_Print_Page_Numbers", request.Print_Page_Numbers),
                InputNumber("p_Repeat_Rows_Per_Page", request.Repeat_Rows_Per_Page),
                InputVarchar("p_Is_Digitally_Signed", request.Is_Digitally_Signed),
                InputVarchar("p_Digital_Signature_Details", request.Digital_Signature_Details),
                InputVarchar("p_IsActive", request.IsActive),
                InputVarchar("p_UserId", request.CurrentUserId),
                InputVarchar("p_Remark", request.Remark),
                new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output },
                new OracleParameter("cur1", OracleDbType.RefCursor) { Direction = ParameterDirection.Output }
            };

            return db.ExecuteDataSet(ProcedureName, parameters);
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter InputNumber(string name, string value)
        {
            decimal parsed;
            return new OracleParameter(name, OracleDbType.Decimal)
            {
                Direction = ParameterDirection.Input,
                Value = decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out parsed)
                    ? (object)parsed
                    : DBNull.Value
            };
        }

        private static bool HasPdfHeader(byte[] bytes)
        {
            if (bytes == null || bytes.Length < 5)
            {
                return false;
            }

            return bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46 && bytes[4] == 0x2D;
        }

        private static string Sha256(byte[] bytes)
        {
            using (var sha = SHA256.Create())
            {
                return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", string.Empty).ToLowerInvariant();
            }
        }

        private static int CountPdfPages(byte[] bytes)
        {
            string text = System.Text.Encoding.ASCII.GetString(bytes);
            int matches = Regex.Matches(text, @"/Type\s*/Page\b").Count;
            return Math.Max(matches, 1);
        }

        private static string Value(DataRow row, params string[] names)
        {
            foreach (string name in names)
            {
                if (row.Table.Columns.Contains(name) && row[name] != DBNull.Value)
                {
                    return Convert.ToString(row[name], CultureInfo.InvariantCulture);
                }
            }

            foreach (DataColumn column in row.Table.Columns)
            {
                foreach (string name in names)
                {
                    if (string.Equals(column.ColumnName, name, StringComparison.OrdinalIgnoreCase) && row[column] != DBNull.Value)
                    {
                        return Convert.ToString(row[column], CultureInfo.InvariantCulture);
                    }
                }
            }

            return string.Empty;
        }
    }
}
