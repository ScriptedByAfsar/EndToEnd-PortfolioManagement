using Microsoft.AspNetCore.Http;

namespace Server.Models
{
    public class ProfileUpdateRequest
    {
        public string Email { get; set; }
        public string Mobile { get; set; }
        public IFormFile ProfilePhoto { get; set; }
    }
}
