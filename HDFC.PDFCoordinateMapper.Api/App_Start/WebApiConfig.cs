using System.Web.Http;
using HDFC.PDFCoordinateMapper.Api.Filters;
using HDFC.PDFCoordinateMapper.Api.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace HDFC.PDFCoordinateMapper.Api.App_Start
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();
            config.Routes.MapHttpRoute("DefaultApi", "api/{controller}/{id}", new { id = RouteParameter.Optional });

            SwaggerConfig.Register(config);

            // Attribute-based authorization works after this handler validates bearer tokens.
            config.MessageHandlers.Add(new JwtTokenHandler());
            config.Filters.Add(new GlobalExceptionFilter());

            config.Formatters.Remove(config.Formatters.XmlFormatter);
            //config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            config.Formatters.JsonFormatter.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
        }
    }
}
