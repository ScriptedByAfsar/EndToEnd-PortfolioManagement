namespace Server.Models
{
    public class GoalDetail
    {
        public int Id { get; set; }
        public string GoalName { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public decimal Target { get; set; }
    }
}