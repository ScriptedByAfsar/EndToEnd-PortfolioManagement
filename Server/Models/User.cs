using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public string Email { get; set; }
        public string Mobile { get; set; }
        public byte[] ProfilePhoto { get; set; }
        public string ProfilePhotoContentType { get; set; }
        public DateTime? LastUpdated { get; set; }

        [NotMapped]
        public string Password { get; set; } // For incoming login requests only
        
        [NotMapped]
        public string ProfilePhotoBase64 { get; set; } // For API responses
    }
}