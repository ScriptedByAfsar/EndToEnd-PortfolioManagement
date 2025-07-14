using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class updateMasterData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AssetName",
                table: "MasterAssets",
                newName: "Name");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "MasterGoals",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "MasterGoals",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "MasterAssets",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "MasterAssets",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "MasterGoals");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "MasterGoals");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "MasterAssets");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "MasterAssets");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "MasterAssets",
                newName: "AssetName");
        }
    }
}
