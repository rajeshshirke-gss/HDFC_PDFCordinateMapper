using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    /// <summary>Matches the AES payload format used by the existing Angular/DAL controller flow.</summary>
    public static class LegacyAesHelper
    {
        public static string DecryptMenuValue(string cipherText)
        {
            return Decrypt(cipherText, "8080808080808080", "8080808080808080");
        }

        public static string DecryptUserMasterValue(string cipherText)
        {
            return Decrypt(cipherText, "80808080808080808080808054312343", "8080808080543123");
        }

        private static string Decrypt(string cipherText, string key, string iv)
        {
            if (cipherText == null) return null;

            try
            {
                var encrypted = Convert.FromBase64String(cipherText);
                using (var aes = Aes.Create())
                {
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;
                    aes.Key = Encoding.UTF8.GetBytes(key);
                    aes.IV = Encoding.UTF8.GetBytes(iv);

                    using (var input = new MemoryStream(encrypted))
                    using (var crypto = new CryptoStream(input, aes.CreateDecryptor(), CryptoStreamMode.Read))
                    using (var reader = new StreamReader(crypto, Encoding.UTF8))
                        return reader.ReadToEnd();
                }
            }
            catch (FormatException)
            {
                return cipherText;
            }
            catch (CryptographicException)
            {
                return cipherText;
            }
        }
    }
}
