namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class RoleMasterRequest
    {
        public string ProcessName { get; set; }
        public string Role_Code { get; set; }
        public string Role_Name { get; set; }
        public string Description { get; set; }
        public string Auto_Id { get; set; }
        public string Flag { get; set; }
        public string User_Id { get; set; }
        public string UserRole { get; set; }
        public string groupidcheck { get; set; }
        public string Active { get; set; }
        public string MenuAccess { get; set; }
    }

    public sealed class ModuleMasterRequest
    {
        public string ProcessName { get; set; }
        public string UserId { get; set; }
        public string AutoId { get; set; }
    }
}
