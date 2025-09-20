import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { createEmbed } from "./card_embed.js";

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// To keep track of paginated data
const paginatedData = {};

// Bot ready event
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  // Handle button interactions (pagination)
  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith("prev_page_") || customId.startsWith("next_page_")) {
      const gameId = customId.replace("prev_page_", "").replace("next_page_", "");
      const isPrevious = customId.startsWith("prev_page_");

      if (paginatedData[gameId]) {
        const currentData = paginatedData[gameId];

        // Update the current page
        if (isPrevious && currentData.currentPage > 0) {
          currentData.currentPage--;
        } else if (!isPrevious && currentData.currentPage < currentData.items.length - 1) {
          currentData.currentPage++;
        }

        // Get current person
        const currentItem = currentData.items[currentData.currentPage];
        const totalPages = currentData.items.length;

        // Create embed using your createEmbed function
        const embed = createEmbed(
          currentItem.uuid,
          currentItem.first_name,
          currentItem.last_name,
          currentItem.birthday,
          currentData.currentPage,
          totalPages
        );

        // Create navigation buttons
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_page_${gameId}`)
            .setLabel("◀ Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentData.currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`next_page_${gameId}`)
            .setLabel("Next ▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentData.currentPage >= totalPages - 1)
        );

        try {
          await interaction.update({
            embeds: [embed],
            components: [row],
          });
        } catch (error) {
          console.error("Error updating message:", error);
        }
      }
    }
    return;
  }

  // Handle slash commands
  const { commandName } = interaction;

  if (commandName === "test") {
    await interaction.reply({
      content: "🎉 Test command works!",
      ephemeral: true,
    });
  }

  if (commandName === "ask") {
    try {
      // Defer reply for longer processing
      await interaction.deferReply();

      // Fetch data from the API
      const apiUrl =
        "https://fakerapi.it/api/v2/custom?_quantity=10&_locale=en_US&uuid=uuid&first_name=firstName&last_name=lastName&birthday=date";
      const response = await fetch(apiUrl);
      const apiData = await response.json();

      console.log("API Response:", apiData);

      if (apiData && apiData.data && apiData.data.length > 0) {
        // Store the data with pagination info using interaction ID
        const gameId = interaction.id;
        paginatedData[gameId] = {
          items: apiData.data,
          currentPage: 0,
        };

        // Get first person for initial display
        const firstPerson = apiData.data[0];
        const totalPages = apiData.data.length;

        // Create embed using your createEmbed function
        const embed = createEmbed(
          firstPerson.uuid,
          firstPerson.first_name,
          firstPerson.last_name,
          firstPerson.birthday,
          0, // currentPage
          totalPages
        );

        const components = [];

        // Add navigation buttons if there are multiple pages
        if (totalPages > 1) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`prev_page_${gameId}`)
              .setLabel("◀ Previous")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true), // First page, so prev is disabled
            new ButtonBuilder()
              .setCustomId(`next_page_${gameId}`)
              .setLabel("Next ▶")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(totalPages === 1)
          );
          components.push(row);
        }

        await interaction.editReply({
          embeds: [embed],
          components: components,
        });
      } else {
        await interaction.editReply({
          content: "Sorry, couldn't fetch data from the API.",
        });
      }
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
            ephemeral: true,
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
