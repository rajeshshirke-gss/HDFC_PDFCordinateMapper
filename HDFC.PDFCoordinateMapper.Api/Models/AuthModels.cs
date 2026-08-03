using System.Collections.Generic;
using System.Data;

namespace HDFC.PDFCoordinateMapper.Api.Models
{
    public sealed class LoginRequest
    {
        public string UserName { get; set; }
        public string UserId { get; set; }
        public string User_Id { get; set; }
        public string Password { get; set; }
        public string Flag { get; set; }
        public string SystemIP { get; set; }
        public string GUID { get; set; }
    }

    public sealed class LoginResponse
    {
        public string AccessToken { get; set; }
        public string TokenType { get; set; }
        public int ExpiresInSeconds { get; set; }
        public string UserName { get; set; }
        public string SessionId { get; set; }
        public IEnumerable<string> Roles { get; set; }
        public DataSet Data { get; set; }
    }

    public sealed class CurrentUserResponse
    {
        public string UserName { get; set; }
        public IEnumerable<string> Roles { get; set; }
    }
}
