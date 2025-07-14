using System.Text.Json.Serialization;

namespace Server.Models
{
    public class MasterGoal
    {
        public int Id { get; set; }
        [JsonPropertyName("name")]
        public string GoalName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}