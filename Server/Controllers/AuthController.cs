using Microsoft.AspNetCore.Mvc;
using Server.Data;
using Server.Models;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly string HardcodedUsername = "Afsar";
        private static readonly string HardcodedPasswordHash = "CryptographicLock";
        private const int MaxProfilePhotoSize = 5 * 1024 * 1024; // 5MB

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
            if (user == null)
            {
                user = new User
                {
                    Username = HardcodedUsername,
                    PasswordHash = HardcodedPasswordHash,
                    FailedLoginAttempts = 0,
                    LockoutEnd = null,
                    Email = "",
                    Mobile = "",
                    LastUpdated = DateTime.UtcNow
                };
                _context.Users.Add(user);
                _context.SaveChanges();
            }

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
                response = new() { Message = $"Invalid credentials. You have {3 - user.FailedLoginAttempts} attempts left before account gets locked." };
                return Unauthorized(response);
            }

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
            _context.SaveChanges();

            // Convert profile photo to base64 if it exists
            if (user.ProfilePhoto != null)
            {
                user.ProfilePhotoBase64 = $"data:{user.ProfilePhotoContentType};base64,{Convert.ToBase64String(user.ProfilePhoto)}";
            }

            // Remove sensitive data from response
            var userResponse = new
            {
                user.Username,
                user.Email,
                user.Mobile,
                user.ProfilePhotoBase64,
                user.LastUpdated
            };

            response = new() 
            { 
                IsSuccess = true, 
                Message = "Login successful.",
                Data = userResponse
            }; 
            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var response = new CommonResponse() { IsSuccess = true, Message = "Logged out successfully" };
            return Ok(response);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == HardcodedUsername);
            if (user == null)
            {
                return NotFound(new CommonResponse { Message = "User not found" });
            }

            // Convert profile photo to base64 if it exists
            if (user.ProfilePhoto != null)
            {
                user.ProfilePhotoBase64 = $"data:{user.ProfilePhotoContentType};base64,{Convert.ToBase64String(user.ProfilePhoto)}";
            }

            // Remove sensitive data
            user.PasswordHash = null;
            user.ProfilePhoto = null;

            return Ok(new CommonResponse 
            { 
                IsSuccess = true, 
                Data = user 
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] ProfileUpdateRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == HardcodedUsername);
            if (user == null)
            {
                return NotFound(new CommonResponse { Message = "User not found" });
            }

            // Update basic info
            user.Email = request.Email;
            user.Mobile = request.Mobile;

            // Handle profile photo
            if (request.ProfilePhoto != null)
            {
                if (request.ProfilePhoto.Length > MaxProfilePhotoSize)
                {
                    return BadRequest(new CommonResponse { Message = "Profile photo must be less than 5MB" });
                }

                using var memoryStream = new MemoryStream();
                await request.ProfilePhoto.CopyToAsync(memoryStream);
                user.ProfilePhoto = memoryStream.ToArray();
                user.ProfilePhotoContentType = request.ProfilePhoto.ContentType;
            }

            user.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new CommonResponse 
            { 
                IsSuccess = true, 
                Message = "Profile updated successfully" 
            });
        }

        [HttpPost("clear-all-data")]
        public async Task<IActionResult> ClearAllData()
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Clear all transaction history
                _context.InvestmentTransactions.RemoveRange(_context.InvestmentTransactions);
                _context.GoalTransactions.RemoveRange(_context.GoalTransactions);

                // Clear all details
                _context.InvestedDetails.RemoveRange(_context.InvestedDetails);
                _context.GoalsDetails.RemoveRange(_context.GoalsDetails);

                // Soft delete all master data
                var assets = await _context.MasterAssets.ToListAsync();
                foreach (var asset in assets)
                {
                    asset.IsActive = false;
                }

                var goals = await _context.MasterGoals.ToListAsync();
                foreach (var goal in goals)
                {
                    goal.IsActive = false;
                }

                // Reset totals
                var totals = await _context.Totals.FirstOrDefaultAsync();
                if (totals != null)
                {
                    totals.TotalInvested = 0;
                    totals.TotalGoals = 0;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new CommonResponse 
                { 
                    IsSuccess = true, 
                    Message = "All data has been cleared successfully" 
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new CommonResponse 
                { 
                    IsSuccess = false, 
                    Message = "Error clearing data: " + ex.Message 
                });
            }
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