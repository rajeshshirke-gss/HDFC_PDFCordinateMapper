using System;
using System.Collections.Generic;
using System.Web.Http;
using System.Web.Http.Dependencies;
using HDFC.PDFCoordinateMapper.Api.Configuration;
using HDFC.PDFCoordinateMapper.Api.Database;
using HDFC.PDFCoordinateMapper.Api.Services;
using HDFC.PDFCoordinateMapper.Api.Utilities;
using Unity;

namespace HDFC.PDFCoordinateMapper.Api.App_Start
{
    public static class UnityConfig
    {
        public static void RegisterComponents(HttpConfiguration config)
        {
            var container = new UnityContainer();
            container.RegisterInstance<IConnectionFactory>(new ConnectionFactory(AppSettings.OracleConnectionString));
            container.RegisterType<IDbHelper, DbHelper>();
            container.RegisterType<IAmcMasterService, AmcMasterService>();
            container.RegisterType<IAuthService, AuthService>();
            container.RegisterType<ICommonApprovalService, CommonApprovalService>();
            container.RegisterType<IMenuService, MenuService>();
            container.RegisterType<IMfCommonApprovalService, MfCommonApprovalService>();
            container.RegisterType<IPdfCoordinateService, PdfCoordinateService>();
            container.RegisterType<IRoleMasterService, RoleMasterService>();
            container.RegisterType<IRoleModuleMappingService, RoleModuleMappingService>();
            container.RegisterType<ITemplateMappingService, TemplateMappingService>();
            container.RegisterType<ITemplateMasterService, TemplateMasterService>();
            container.RegisterType<IUserMasterService, UserMasterService>();
            container.RegisterType<IWelcomeService, WelcomeService>();
            container.RegisterType<IJwtTokenService, JwtTokenService>();
            config.DependencyResolver = new UnityDependencyResolver(container);
        }
    }

    /// <summary>Small Web API adapter keeps DI explicit and avoids framework-specific service locators.</summary>
    internal sealed class UnityDependencyResolver : IDependencyResolver
    {
        private readonly IUnityContainer container;
        public UnityDependencyResolver(IUnityContainer container) { this.container = container; }
        public object GetService(Type serviceType)
        {
            try { return container.Resolve(serviceType); }
            catch (ResolutionFailedException) { return null; }
        }
        public IEnumerable<object> GetServices(Type serviceType)
        {
            try { return container.ResolveAll(serviceType); }
            catch (ResolutionFailedException) { return new object[0]; }
        }
        public IDependencyScope BeginScope() => new UnityDependencyResolver(container.CreateChildContainer());
        public void Dispose() => container.Dispose();
    }
}
