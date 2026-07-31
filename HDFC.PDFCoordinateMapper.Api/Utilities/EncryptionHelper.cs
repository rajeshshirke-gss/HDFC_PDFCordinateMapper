using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using HDFC.PDFCoordinateMapper.Api.Configuration;

namespace HDFC.PDFCoordinateMapper.Api.Utilities
{
    /// <summary>AES encryption with a random IV prepended to every encrypted payload.</summary>
    public static class EncryptionHelper
    {
        public static string Encrypt(string plainText)
        {
            if (plainText == null) throw new ArgumentNullException(nameof(plainText));
            using (var aes = Aes.Create())
            {
                aes.Key = DeriveKey();
                aes.GenerateIV();
                using (var output = new MemoryStream())
                {
                    output.Write(aes.IV, 0, aes.IV.Length);
                    using (var crypto = new CryptoStream(output, aes.CreateEncryptor(), CryptoStreamMode.Write))
                    using (var writer = new StreamWriter(crypto, Encoding.UTF8))
                        writer.Write(plainText);
                    return Convert.ToBase64String(output.ToArray());
                }
            }
        }

        public static string Decrypt(string cipherText)
        {
            var bytes = Convert.FromBase64String(cipherText);
            using (var aes = Aes.Create())
            {
                aes.Key = DeriveKey();
                var iv = new byte[aes.BlockSize / 8];
                if (bytes.Length <= iv.Length) throw new CryptographicException("Invalid encrypted payload.");
                Buffer.BlockCopy(bytes, 0, iv, 0, iv.Length);
                aes.IV = iv;
                using (var input = new MemoryStream(bytes, iv.Length, bytes.Length - iv.Length))
                using (var crypto = new CryptoStream(input, aes.CreateDecryptor(), CryptoStreamMode.Read))
                using (var reader = new StreamReader(crypto, Encoding.UTF8))
                    return reader.ReadToEnd();
            }
        }

        private static byte[] DeriveKey()
        {
            using (var sha = SHA256.Create()) return sha.ComputeHash(Encoding.UTF8.GetBytes(AppSettings.EncryptionKey));
        }
    }
}
