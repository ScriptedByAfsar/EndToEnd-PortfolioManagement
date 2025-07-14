using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Models;
using System.Security.Cryptography;
using System.Text;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly string HardcodedUsername = "Afsar";
        private static readonly string HardcodedPasswordHash = "CryptographicLock";

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] User loginRequest)
        {
            CommonResponse response;
            var user = _context.Users.FirstOrDefault(u => u.Username == HardcodedUsername);

            if (user.Username != HardcodedUsername)
            {
                response = new() { Message = "User not allowed!" };
                return Unauthorized();
            }
            //if (user == null)
            //{
            //    user = new User
            //    {
            //        Username = HardcodedUsername,
            //        PasswordHash = HardcodedPasswordHash,
            //        FailedLoginAttempts = 0,
            //        LockoutEnd = null
            //    };
            //    _context.Users.Add(user);
            //    _context.SaveChanges();
            //}

            if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            {
                response = new(){ Message = $"Account is locked. Try again after {user.LockoutEnd.Value - DateTime.UtcNow}."};
                return Unauthorized(response);
            }
            else if (user.FailedLoginAttempts >= 3)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                _context.SaveChanges();

            }

            if (user.PasswordHash != loginRequest.Password)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 3)
                {
                    user.LockoutEnd = DateTime.UtcNow.AddMinutes(30 * Math.Pow(2, user.FailedLoginAttempts / 3 - 1));
                }
                _context.SaveChanges();
                response = new() { Message = $"Invalid credentials. You have {user.FailedLoginAttempts} left before account gets locked." };
                return Unauthorized(response);
            }

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            _context.SaveChanges();

            response = new() { IsSuccess = true, Message = "Login successful." }; 
            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var response = new CommonResponse() { IsSuccess = true, Message = "Logged out successfully" };
            return Ok(response);
        }

        private static string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}