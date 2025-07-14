using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        CommonResponse commonResponse;

        public PortfolioController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("totals")]
        public IActionResult GetTotals()
        {
            var totals = _context.Totals.FirstOrDefault();
            if (totals == null)
            {
                return NotFound("Totals not found.");
            }
            return Ok(totals);
        }

        [HttpGet("transaction-history/{type}")]
        public IActionResult GetTransactionHistory(TransactionType type)
        {
            try
            {
                switch (type)
                {
                    case TransactionType.Investment:
                        var investmentTransactions = _context.InvestmentTransactions
                            .OrderByDescending(t => t.Timestamp)
                            .ToList();
                        return Ok(investmentTransactions);
                    
                    case TransactionType.Goal:
                        var goalTransactions = _context.GoalTransactions
                            .OrderByDescending(t => t.Timestamp)
                            .ToList();
                        return Ok(goalTransactions);
                    
                    default:
                        return BadRequest("Invalid transaction type");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error retrieving transaction history: " + ex.Message);
            }
        }

        [HttpPost("save-investment-transaction")]
        public IActionResult SaveInvestmentTransaction([FromBody] InvestmentTransaction transaction)
        {
            try
            {
                transaction.Timestamp = DateTime.UtcNow;
                _context.InvestmentTransactions.Add(transaction);
                _context.SaveChanges();
                return Ok(new { message = "Investment transaction saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error saving investment transaction: " + ex.Message);
            }
        }

        [HttpPost("save-goal-transaction")]
        public IActionResult SaveGoalTransaction([FromBody] GoalTransaction transaction)
        {
            try
            {
                transaction.Timestamp = DateTime.UtcNow;
                _context.GoalTransactions.Add(transaction);
                _context.SaveChanges();
                return Ok(new { message = "Goal transaction saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error saving goal transaction: " + ex.Message);
            }
        }

        [HttpPost("update-totals")]
        public IActionResult UpdateTotals([FromBody] Totals updatedTotals)
        {
            var totals = _context.Totals.FirstOrDefault();
            if (totals == null)
            {
                totals = new Totals();
                //return NotFound("Totals not found.");
            }

            totals.TotalInvested += updatedTotals.TotalInvested;
            totals.TotalGoals += updatedTotals.TotalGoals;
            _context.SaveChanges();
            commonResponse = new CommonResponse() { IsSuccess = true, Message = "Totals saved successfully." };

            return Ok(commonResponse);
        }

        [HttpPost("save-details")]
        public IActionResult SaveDetails([FromBody] SaveDetailsRequest request)
        {
            foreach (var invested in request.InvestedDetails)
            {
                _context.InvestedDetails.Add(invested);
            }

            foreach (var goal in request.GoalsDetails)
            {
                _context.GoalsDetails.Add(goal);
            }

            commonResponse = new CommonResponse() { IsSuccess = true, Message = "Details saved successfully." };
            _context.SaveChanges();
            return Ok(commonResponse);
        }
    }
}