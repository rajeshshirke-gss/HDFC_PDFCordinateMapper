namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class RoleModuleMappingRequest
    {
        public string ProcessName { get; set; }
        public string UserId { get; set; }
        public string AutoId { get; set; }
        public string RoleId { get; set; }
        public string RoleName { get; set; }
        public string MenuAccess { get; set; }
        public string Groupid { get; set; }
        public string GroupId { get; set; }
        public string CreatedDate { get; set; }
        public string ApprovedBy { get; set; }
        public string ApprovedDate { get; set; }
    }
}
