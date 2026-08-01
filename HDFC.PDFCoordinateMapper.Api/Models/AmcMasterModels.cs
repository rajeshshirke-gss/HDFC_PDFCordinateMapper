namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class AmcMasterRequest
    {
        public string Flag { get; set; }
        public string Auto_Id { get; set; }
        public string Mst_Col_Id { get; set; }
        public string Amc_Code { get; set; }
        public string Amc_Name { get; set; }
        public string Amc_Description { get; set; }
        public string IsActive { get; set; }
        public string CurrentUserId { get; set; }
        public string Remark { get; set; }
    }
}
