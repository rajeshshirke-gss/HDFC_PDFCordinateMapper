namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class MfCommonApprovalRequest
    {
        public string Flag { get; set; }
        public string Auto_Id { get; set; }
        public string Tbl_Auto_Id { get; set; }
        public string MasterName { get; set; }
        public string CurrentUserId { get; set; }
        public string Remark { get; set; }
    }

    public sealed class MfCommonApprovalDetailRequest
    {
        public string MasterName { get; set; }
        public string UpdatedBy { get; set; }
        public string CurrentUserId { get; set; }
        public string AutoId { get; set; }
    }
}
