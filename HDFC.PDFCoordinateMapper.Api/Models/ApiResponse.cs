namespace HDFC.PDFCoordinateMapper.Api.Models
{
    /// <summary>Consistent response envelope used by every API endpoint.</summary>
    public sealed class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public string CorrelationId { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Request completed successfully.") =>
            new ApiResponse<T> { Success = true, Message = message, Data = data };

        public static ApiResponse<T> Fail(string message, string correlationId = null) =>
            new ApiResponse<T> { Success = false, Message = message, CorrelationId = correlationId };
    }
}
