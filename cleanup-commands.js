import "dotenv/config";

async function cleanupCommands() {
  try {
    console.log("🧹 Starting command cleanup...");

    // Delete all global commands by setting empty array
    console.log("Clearing all global commands...");
    const response = await fetch(
      `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
        method: "PUT",
        body: JSON.stringify([]), // Empty array removes all commands
      }
    );

    if (response.ok) {
      console.log("✅ All global commands deleted successfully!");
    } else {
      console.log("❌ Error deleting global commands:", await response.text());
    }

    // Clear guild commands if GUILD_ID is set
    if (process.env.GUILD_ID) {
      console.log("Clearing all guild commands...");
      const guildResponse = await fetch(
        `https://discord.com/api/v10/applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
          method: "PUT",
          body: JSON.stringify([]), // Empty array removes all commands
        }
      );

      if (guildResponse.ok) {
        console.log("✅ All guild commands deleted successfully!");
      } else {
        console.log("❌ Error deleting guild commands:", await guildResponse.text());
      }
    }

    console.log("🎉 Cleanup complete! Now run: node commands.js");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

cleanupCommands();
