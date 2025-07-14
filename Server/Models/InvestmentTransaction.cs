namespace Server.Models
{
    public class InvestmentTransaction
    {
        public int Id { get; set; }
        public string PlanName { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public DateTime Timestamp { get; set; }
    }
}