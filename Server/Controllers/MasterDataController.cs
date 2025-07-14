using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MasterDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MasterDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Get all active assets
        [HttpGet("assets")]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.MasterAssets
                .Where(a => a.IsActive)
                .OrderBy(a => a.Name)
                .ToListAsync();
            return Ok(assets);
        }

        // Get all active goals
        [HttpGet("goals")]
        public async Task<IActionResult> GetGoals()
        {
            var goals = await _context.MasterGoals
                .Where(g => g.IsActive)
                .OrderBy(g => g.GoalName)
                .ToListAsync();
            return Ok(goals);
        }

        // Add new asset
        [HttpPost("assets")]
        public async Task<IActionResult> AddAsset([FromBody] MasterAsset asset)
        {
            asset.CreatedAt = DateTime.UtcNow;
            asset.IsActive = true;
            _context.MasterAssets.Add(asset);
            await _context.SaveChangesAsync();
            return Ok(asset);
        }

        // Add new goal
        [HttpPost("goals")]
        public async Task<IActionResult> AddGoal([FromBody] MasterGoal goal)
        {
            goal.CreatedAt = DateTime.UtcNow;
            goal.IsActive = true;
            _context.MasterGoals.Add(goal);
            await _context.SaveChangesAsync();
            return Ok(goal);
        }

        // Update asset
        [HttpPut("assets/{id}")]
        public async Task<IActionResult> UpdateAsset(int id, [FromBody] MasterAsset asset)
        {
            var existingAsset = await _context.MasterAssets.FindAsync(id);
            if (existingAsset == null)
                return NotFound();

            existingAsset.Name = asset.Name;
            existingAsset.IsActive = asset.IsActive;
            await _context.SaveChangesAsync();
            return Ok(existingAsset);
        }

        // Update goal
        [HttpPut("goals/{id}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] MasterGoal goal)
        {
            var existingGoal = await _context.MasterGoals.FindAsync(id);
            if (existingGoal == null)
                return NotFound();

            existingGoal.GoalName = goal.GoalName;
            existingGoal.IsActive = goal.IsActive;
            await _context.SaveChangesAsync();
            return Ok(existingGoal);
        }

        // Delete asset (soft delete)
        [HttpDelete("assets/{id}")]
        public async Task<IActionResult> DeleteAsset(int id)
        {
            var asset = await _context.MasterAssets.FindAsync(id);
            if (asset == null)
                return NotFound();

            asset.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Delete goal (soft delete)
        [HttpDelete("goals/{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var goal = await _context.MasterGoals.FindAsync(id);
            if (goal == null)
                return NotFound();

            goal.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
