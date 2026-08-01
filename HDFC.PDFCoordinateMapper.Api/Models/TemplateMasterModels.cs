namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class TemplateMasterRequest
    {
        public string Flag { get; set; }
        public string Auto_Id { get; set; }
        public string Mst_Col_Id { get; set; }
        public string Template_Code { get; set; }
        public string Template_Name { get; set; }
        public string Template_Description { get; set; }
        public string Original_File_Name { get; set; }
        public string Stored_File_Name { get; set; }
        public string File_Path { get; set; }
        public string File_Hash { get; set; }
        public string File_Size_Bytes { get; set; }
        public string Mime_Type { get; set; }
        public string Pdf_Page_Count { get; set; }
        public string Mapping_Page_Numbers { get; set; }
        public string Print_Page_Numbers { get; set; }
        public string Repeat_Rows_Per_Page { get; set; }
        public string Is_Digitally_Signed { get; set; }
        public string Digital_Signature_Details { get; set; }
        public string IsActive { get; set; }
        public string CurrentUserId { get; set; }
        public string Remark { get; set; }
    }

    public sealed class TemplateUploadResult
    {
        public string OriginalFileName { get; set; }
        public string StoredFileName { get; set; }
        public string FilePath { get; set; }
        public string FileHash { get; set; }
        public long FileSizeBytes { get; set; }
        public string MimeType { get; set; }
        public int PdfPageCount { get; set; }
    }
}
