using System;
using System.Net;
using System.Net.Http;
using System.Web.Http.Filters;
using HDFC.PDFCoordinateMapper.Api.Constants;
using HDFC.PDFCoordinateMapper.Api.Models;
using HDFC.PDFCoordinateMapper.Api.Utilities;

namespace HDFC.PDFCoordinateMapper.Api.Filters
{
    public sealed class GlobalExceptionFilter : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext context)
        {
            var correlationId = Guid.NewGuid().ToString("N");
            Logger.Error(context.Exception, correlationId);
            var body = ApiResponse<object>.Fail(ApiConstants.GenericErrorMessage, correlationId);
            context.Response = context.Request.CreateResponse(HttpStatusCode.InternalServerError, body);
        }
    }
}
