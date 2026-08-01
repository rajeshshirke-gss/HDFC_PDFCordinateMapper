using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Newtonsoft.Json;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface ITemplateMappingService
    {
        DataSet GetTemplateMappings();
        DataSet GetTemplateMappingById(string autoId);
        DataSet SaveTemplateMapping(TemplateMappingRequest request);
        DataSet DeleteTemplateMapping(TemplateMappingRequest request);
    }

    public sealed class TemplateMappingService : ITemplateMappingService
    {
        private const string ProcedureName = "MF_TEMPLATE_MAPPING_MASTER_IUDS";

        private readonly IDbHelper db;

        public TemplateMappingService(IDbHelper db)
        {
            this.db = db;
        }

        public DataSet GetTemplateMappings()
        {
            return ExecuteTemplateMapping(new TemplateMappingRequest(), "S");
        }

        public DataSet GetTemplateMappingById(string autoId)
        {
            return ExecuteTemplateMapping(new TemplateMappingRequest { Auto_Id = autoId }, "GETBYID");
        }

        public DataSet SaveTemplateMapping(TemplateMappingRequest request)
        {
            request = request ?? new TemplateMappingRequest();
            ValidateRequest(request);
            NormalizeFields(request);
            return ExecuteTemplateMapping(request, string.IsNullOrWhiteSpace(request.Flag) ? "INSERT" : request.Flag);
        }

        public DataSet DeleteTemplateMapping(TemplateMappingRequest request)
        {
            request = request ?? new TemplateMappingRequest();
            return ExecuteTemplateMapping(request, "D");
        }

        private DataSet ExecuteTemplateMapping(TemplateMappingRequest request, string flag)
        {
            if (string.IsNullOrWhiteSpace(flag))
            {
                throw new ArgumentException("Template Mapping flag/process name is required.");
            }

            var parameters = new List<OracleParameter>
            {
                InputVarchar("p_Qflag", flag),
                InputNumber("p_Auto_Id", request.Auto_Id),
                InputNumber("p_Mst_Col_Id", request.Mst_Col_Id),
                InputNumber("p_Template_Id", request.Template_Id),
                InputVarchar("p_Mapping_Code", request.Mapping_Code),
                InputVarchar("p_Mapping_Name", request.Mapping_Name),
                InputVarchar("p_Mapping_Description", request.Mapping_Description),
                InputNumber("p_Page_Width", request.Page_Width),
                InputNumber("p_Page_Height", request.Page_Height),
                InputVarchar("p_Coordinate_Origin", request.Coordinate_Origin),
                InputVarchar("p_IsActive", string.IsNullOrWhiteSpace(request.IsActive) ? "Y" : request.IsActive),
                InputVarchar("p_UserId", request.CurrentUserId),
                InputVarchar("p_Remark", request.Remark),
                InputClob("p_Fields_Json", JsonConvert.SerializeObject(request.Fields ?? new List<TemplateMappingFieldRequest>())),
                new OracleParameter("cur", OracleDbType.RefCursor) { Direction = ParameterDirection.Output },
                new OracleParameter("cur1", OracleDbType.RefCursor) { Direction = ParameterDirection.Output },
                new OracleParameter("cur2", OracleDbType.RefCursor) { Direction = ParameterDirection.Output }
            };

            return db.ExecuteDataSet(ProcedureName, parameters);
        }

        private static void ValidateRequest(TemplateMappingRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Template_Id))
            {
                throw new ArgumentException("Template is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Mapping_Code))
            {
                throw new ArgumentException("Mapping Code is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Mapping_Name))
            {
                throw new ArgumentException("Mapping Name is required.");
            }

            if (request.Fields == null || request.Fields.Count == 0)
            {
                throw new ArgumentException("At least one mapped field is required.");
            }
        }

        private static void NormalizeFields(TemplateMappingRequest request)
        {
            if (request.Fields == null)
            {
                return;
            }

            for (int index = 0; index < request.Fields.Count; index++)
            {
                TemplateMappingFieldRequest field = request.Fields[index];
                field.Field_Type = NormalizeFieldType(field.Field_Type);
                field.Is_Required = NormalizeYesNo(field.Is_Required, "Y");
                field.Snap_To_Grid = NormalizeYesNo(field.Snap_To_Grid, "N");
                field.Is_Repeatable = NormalizeYesNo(field.Is_Repeatable, "N");
                field.Is_Repeat_Group_Owner = NormalizeYesNo(field.Is_Repeat_Group_Owner, "N");
                field.IsActive = NormalizeYesNo(field.IsActive, "Y");
                if (string.IsNullOrWhiteSpace(field.Display_Sequence))
                {
                    field.Display_Sequence = (index + 1).ToString(CultureInfo.InvariantCulture);
                }

                if (field.Configs == null)
                {
                    continue;
                }

                for (int configIndex = 0; configIndex < field.Configs.Count; configIndex++)
                {
                    TemplateMappingFieldConfigRequest config = field.Configs[configIndex];
                    if (string.IsNullOrWhiteSpace(config.Config_Sequence))
                    {
                        config.Config_Sequence = (configIndex + 1).ToString(CultureInfo.InvariantCulture);
                    }

                    config.Is_Multiline = NormalizeYesNo(config.Is_Multiline, "N");
                    config.Wrap_Text = NormalizeYesNo(config.Wrap_Text, "N");
                    config.Ignore_Date_Separator = NormalizeYesNo(config.Ignore_Date_Separator, "N");
                    config.IsActive = NormalizeYesNo(config.IsActive, "Y");
                }
            }
        }

        private static string NormalizeFieldType(string value)
        {
            string normalized = string.IsNullOrWhiteSpace(value)
                ? "TEXT_FIELD"
                : value.Trim().ToUpperInvariant();

            switch (normalized)
            {
                case "TEXT_FIELD":
                case "CHAR_GRID":
                case "DATE_GRID":
                case "OPTION_GROUP":
                case "COMPUTED_FIELD":
                    return normalized;
                default:
                    return "TEXT_FIELD";
            }
        }

        private static string NormalizeYesNo(string value, string fallback)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return fallback;
            }

            string normalized = value.Trim().ToUpperInvariant();
            return normalized == "TRUE" || normalized == "1" || normalized == "Y" ? "Y" : "N";
        }

        private static OracleParameter InputVarchar(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Varchar2)
            {
                Direction = ParameterDirection.Input,
                Value = string.IsNullOrWhiteSpace(value) ? (object)DBNull.Value : value
            };
        }

        private static OracleParameter InputClob(string name, string value)
        {
            return new OracleParameter(name, OracleDbType.Clob)
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
    }
}
