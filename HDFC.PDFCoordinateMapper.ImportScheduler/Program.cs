using System;
using System.Linq;
using Integration.Data.Services;

namespace HDFC.PDFCoordinateMapper.ImportScheduler
{
    internal static class Program
    {
        private static int Main()
        {
            try
            {
                var service = new MasterImportService();
                var results = service.ImportAll("System");

                foreach (var result in results)
                {
                    Console.WriteLine("{0} -> {1} -> {2} records -> {3}",
                        result.MasterName,
                        result.Success ? "Success" : "Failed",
                        result.RecordCount,
                        result.Message);
                }

                return results.All(result => result.Success) ? 0 : 2;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);
                return 1;
            }
        }
    }
}
