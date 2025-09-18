namespace Server.Models
{
    public class InvestedDetail
    {
        public int Id { get; set; }
        public string AssetName { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
        public decimal Target { get; set; }
    }
}