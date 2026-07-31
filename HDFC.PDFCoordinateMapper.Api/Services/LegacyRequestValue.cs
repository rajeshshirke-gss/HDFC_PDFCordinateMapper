using System;
using System.Net;
using HDFC.PDFCoordinateMapper.Api.Utilities;

namespace HDFC.PDFCoordinateMapper.Api.Services
{
    internal static class LegacyRequestValue
    {
        public static string Decode(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            string trimmedValue = value.Trim();
            string decodedValue = WebUtility.UrlDecode(trimmedValue);

            foreach (string candidate in string.Equals(trimmedValue, decodedValue, StringComparison.Ordinal)
                ? new[] { trimmedValue }
                : new[] { trimmedValue, decodedValue })
            {
                try
                {
                    string decryptedValue = LegacyAesHelper.DecryptMenuValue(candidate);

                    if (!string.IsNullOrWhiteSpace(decryptedValue))
                    {
                        return decryptedValue;
                    }
                }
                catch
                {
                    // The request may be plain text when tested from Swagger/Postman.
                }
            }

            return decodedValue;
        }
    }
}
