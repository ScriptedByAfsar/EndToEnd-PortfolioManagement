using System.Collections.Generic;

namespace Server.Models
{
    public class SaveDetailsRequest
    {
        public List<InvestedDetail> InvestedDetails { get; set; } // Marked as nullable
        public List<GoalDetail> GoalsDetails { get; set; } // Marked as nullable
    }
}