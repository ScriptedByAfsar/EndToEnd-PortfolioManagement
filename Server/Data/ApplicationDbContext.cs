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

            // Configure decimal properties for InvestedDetail
            modelBuilder.Entity<InvestedDetail>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<InvestedDetail>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);
            modelBuilder.Entity<InvestedDetail>()
                .Property(e => e.Target)
                .HasPrecision(18, 2);

            // Configure decimal properties for GoalDetail
            modelBuilder.Entity<GoalDetail>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<GoalDetail>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);
            modelBuilder.Entity<GoalDetail>()
                .Property(e => e.Target)
                .HasPrecision(18, 2);

            // Configure decimal properties for InvestmentTransaction
            modelBuilder.Entity<InvestmentTransaction>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<InvestmentTransaction>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);

            // Configure decimal properties for GoalTransaction
            modelBuilder.Entity<GoalTransaction>()
                .Property(e => e.Amount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<GoalTransaction>()
                .Property(e => e.Percentage)
                .HasPrecision(5, 2);

            // Configure decimal properties for Totals
            modelBuilder.Entity<Totals>()
                .Property(e => e.TotalInvested)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Totals>()
                .Property(e => e.TotalGoals)
                .HasPrecision(18, 2);
        }
    }
}