using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    public static class JsonHelper
    {
        private static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore
        };
        public static string Serialize(object value) => JsonConvert.SerializeObject(value, Settings);
        public static T Deserialize<T>(string json) => JsonConvert.DeserializeObject<T>(json, Settings);
    }
}
