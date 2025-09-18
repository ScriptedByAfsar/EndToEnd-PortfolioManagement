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

        [HttpGet("goals-details")]
        public IActionResult GetGoalsDetails()
        {
            try
            {
                var goalsDetails = _context.GoalsDetails.ToList();
                return Ok(goalsDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CommonResponse { IsSuccess = false, Message = "Error retrieving goals details: " + ex.Message });
            }
        }

        [HttpGet("invested-details")]
        public IActionResult GetInvestedDetails()
        {
            try
            {
                var investedDetails = _context.InvestedDetails.ToList();
                return Ok(investedDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CommonResponse { IsSuccess = false, Message = "Error retrieving invested details: " + ex.Message });
            }
        }

        [HttpGet("totals")]
        public IActionResult GetTotals()
        {
            try
            {
                // Calculate totals from GoalsDetails and InvestedDetails
                decimal totalGoals = _context.GoalsDetails.Sum(g => g.Amount);
                decimal totalInvested = _context.InvestedDetails.Sum(i => i.Amount);

                var totals = new Totals
                {
                    TotalGoals = totalGoals,
                    TotalInvested = totalInvested
                };

                return Ok(totals);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CommonResponse { IsSuccess = false, Message = "Error calculating totals: " + ex.Message });
            }
        }

        [HttpGet("transaction-history/{type}")]
        public IActionResult GetTransactionHistory(TransactionType type, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                IQueryable<dynamic> query;
                int totalCount;

                switch (type)
                {
                    case TransactionType.Investment:
                        query = _context.InvestmentTransactions
                            .OrderByDescending(t => t.Timestamp)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize);
                        totalCount = _context.InvestmentTransactions.Count();
                        break;
                    
                    case TransactionType.Goal:
                        query = _context.GoalTransactions
                            .OrderByDescending(t => t.Timestamp)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize);
                        totalCount = _context.GoalTransactions.Count();
                        break;
                    
                    default:
                        return BadRequest("Invalid transaction type");
                }

                var result = new
                {
                    items = query.ToList(),
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    currentPage = page,
                    pageSize = pageSize
                };

                return Ok(result);
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
            // Handle invested details
            foreach (var invested in request.InvestedDetails)
            {
                var existingInvested = _context.InvestedDetails
                    .FirstOrDefault(i => i.AssetName == invested.AssetName);

                if (existingInvested != null)
                {
                    existingInvested.Amount += invested.Amount;
                    existingInvested.Percentage = invested.Percentage;
                }
                else
                {
                    _context.InvestedDetails.Add(invested);
                }
            }

            // Handle goals details
            foreach (var goal in request.GoalsDetails)
            {
                var existingGoal = _context.GoalsDetails
                    .FirstOrDefault(g => g.GoalName == goal.GoalName);

                if (existingGoal != null)
                {
                    existingGoal.Amount += goal.Amount;
                    existingGoal.Percentage = goal.Percentage;
                }
                else
                {
                    _context.GoalsDetails.Add(goal);
                }
            }

            commonResponse = new CommonResponse() { IsSuccess = true, Message = "Details saved successfully." };
            _context.SaveChanges();
            return Ok(commonResponse);
        }

        [HttpPost("save-targets")]
        public IActionResult SaveTargets([FromBody] SaveTargetsRequest request)
        {
            try
            {
                // Update goals targets
                foreach (var goal in request.Goals)
                {
                    var existingGoal = _context.GoalsDetails.FirstOrDefault(g => g.GoalName == goal.Name);
                    if (existingGoal != null)
                    {
                        existingGoal.Target = goal.Target;
                    }
                }

                // Update investment targets
                foreach (var asset in request.Assets)
                {
                    var existingAsset = _context.InvestedDetails.FirstOrDefault(a => a.AssetName == asset.Name);
                    if (existingAsset != null)
                    {
                        existingAsset.Target = asset.Target;
                    }
                }

                _context.SaveChanges();
                return Ok(new CommonResponse { IsSuccess = true, Message = "Targets updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CommonResponse { IsSuccess = false, Message = "Error updating targets: " + ex.Message });
            }
        }
    }
}