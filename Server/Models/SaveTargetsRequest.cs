using System.Collections.Generic;

namespace Server.Models
{
    public class SaveTargetsRequest
    {
        public List<TargetItem> Goals { get; set; } = new List<TargetItem>();
        public List<TargetItem> Assets { get; set; } = new List<TargetItem>();
    }

    public class TargetItem
    {
        public string Name { get; set; }
        public decimal Target { get; set; }
    }
}
