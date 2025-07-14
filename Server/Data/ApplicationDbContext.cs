using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<InvestedDetail> InvestedDetails { get; set; }
        public DbSet<GoalDetail> GoalsDetails { get; set; }
        public DbSet<Totals> Totals { get; set; }
        public DbSet<MasterAsset> MasterAssets { get; set; }
        public DbSet<MasterGoal> MasterGoals { get; set; }
        public DbSet<InvestmentTransaction> InvestmentTransactions { get; set; }
        public DbSet<GoalTransaction> GoalTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure entity properties and relationships here if needed
        }
    }
}