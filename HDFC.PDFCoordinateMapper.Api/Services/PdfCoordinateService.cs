using System;
using System.Collections.Generic;
using System.Data;
using HDFC.PDFCoordinateMapper.Api.Configuration;
using HDFC.PDFCoordinateMapper.Api.Constants;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Models;
using Oracle.ManagedDataAccess.Client;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    public interface IPdfCoordinateService
    {
        DataTable GetByTemplate(string templateName);
        int Save(PdfCoordinate coordinate, string userName);
    }

    public sealed class PdfCoordinateService : IPdfCoordinateService
    {
        private readonly IDbHelper db;
        public PdfCoordinateService(IDbHelper db) { this.db = db; }

        public DataTable GetByTemplate(string templateName)
        {
            var parameters = new[]
            {
                new OracleParameter("P_TEMPLATE_NAME", OracleDbType.Varchar2, templateName, ParameterDirection.Input),
                new OracleParameter(ApiConstants.CursorParameter, OracleDbType.RefCursor, ParameterDirection.Output)
            };
            return db.ExecuteDataTable(AppSettings.SpGetCoordinates, parameters);
        }

        public int Save(PdfCoordinate coordinate, string userName)
        {
            var parameters = new List<OracleParameter>
            {
                new OracleParameter("P_ID", OracleDbType.Int64, coordinate.Id, ParameterDirection.Input),
                new OracleParameter("P_FIELD_NAME", OracleDbType.Varchar2, coordinate.FieldName, ParameterDirection.Input),
                new OracleParameter("P_X", OracleDbType.Decimal, coordinate.X, ParameterDirection.Input),
                new OracleParameter("P_Y", OracleDbType.Decimal, coordinate.Y, ParameterDirection.Input),
                new OracleParameter("P_PAGE_NUMBER", OracleDbType.Int32, coordinate.PageNumber, ParameterDirection.Input),
                new OracleParameter("P_TEMPLATE_NAME", OracleDbType.Varchar2, coordinate.TemplateName, ParameterDirection.Input),
                new OracleParameter("P_MODIFIED_BY", OracleDbType.Varchar2, userName, ParameterDirection.Input)
            };
            return db.ExecuteNonQuery(AppSettings.SpSaveCoordinate, parameters);
        }
    }
}
