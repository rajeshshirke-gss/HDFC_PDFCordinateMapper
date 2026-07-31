using System.ComponentModel.DataAnnotations;

namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class PdfCoordinate
    {
        public long Id { get; set; }
        [Required, StringLength(200)] public string FieldName { get; set; }
        [Range(0, double.MaxValue)] public decimal X { get; set; }
        [Range(0, double.MaxValue)] public decimal Y { get; set; }
        [Range(1, int.MaxValue)] public int PageNumber { get; set; }
        [Required, StringLength(200)] public string TemplateName { get; set; }
    }
}
