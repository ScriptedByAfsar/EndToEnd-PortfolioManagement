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

        [NotMapped]
        public string Password { get; set; } // For incoming login requests only
    }
}