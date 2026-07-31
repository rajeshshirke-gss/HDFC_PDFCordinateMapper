using System.Web.Http;
using Swashbuckle.Application;

namespace HDFC.PDFCoordinateMapper.Api.App_Start
{
    /// <summary>Configures generated OpenAPI documentation and the interactive Swagger UI.</summary>
    public static class SwaggerConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config
                .EnableSwagger(swagger =>
                {
                    swagger.SingleApiVersion(
                        "v1",
                        "HDFC PDF Coordinate Mapper API");

                    swagger.DescribeAllEnumsAsStrings();

                    // Swagger UI displays an Authorize dialog for JWT-protected endpoints.
                    // Enter only the token value; the UI sends it through the Authorization header.
                    swagger.ApiKey("Bearer")
                        .Description("JWT authorization. Enter: Bearer {token}")
                        .Name("Authorization")
                        .In("header");
                })
                .EnableSwaggerUi(ui =>
                {
                    ui.DocumentTitle("HDFC PDF Coordinate Mapper API");
                    ui.EnableApiKeySupport("Authorization", "header");
                });
        }
    }
}
