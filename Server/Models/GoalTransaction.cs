namespace Server.Models
{
    public class GoalTransaction
    {
        public int Id { get; set; }
        public string GoalName { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
