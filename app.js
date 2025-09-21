import "dotenv/config";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Bot ready event
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Handle slash commands
  const { commandName } = interaction;

  if (commandName === "test") {
    await interaction.reply({
      content: "🎉 Test command works!",
      flags: [4096], // EPHEMERAL flag
    });
  }

  if (commandName === "ask") {
    try {
      // Get the message parameter
      const userMessage = interaction.options.getString("message");

      // Defer reply for longer processing
      await interaction.deferReply();

      // Call your API with the user's message
      const response = await fetch(process.env.MCP_CLIENT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage,
        }),
      });

      const apiData = await response.json();
      console.log("API Response:", apiData);

      // Create a simple embed with the API response
      const embed = new EmbedBuilder()
        .setColor(0x6943e8)
        .setTitle("🏛️ GovLink Response")
        .setDescription(apiData.response)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error fetching API data:", error);
      try {
        await interaction.editReply({
          content: "Sorry, there was an error fetching data from the API.",
        });
      } catch (editError) {
        console.error("Error editing reply:", editError);
        // If edit fails, try to reply (in case defer failed)
        try {
          await interaction.reply({
            content: "Sorry, there was an error processing your request.",
            flags: [4096], // EPHEMERAL flag
          });
        } catch (replyError) {
          console.error("Error sending reply:", replyError);
        }
      }
    }
  }
});

// Error handling
client.on("error", console.error);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
