import "dotenv/config";
import express from "express";
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomEmoji, DiscordRequest } from "./utils.js";
import { getShuffledOptions, getResult } from "./game.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};
// To keep track of paginated data
const paginatedData = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post("/interactions", verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith("accept_button_")) {
      // get the associated game ID
      const gameId = componentId.replace("accept_button_", "");
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL | InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: "What is your object of choice?",
              },
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else if (componentId.startsWith("select_choice_")) {
      // get the associated game ID
      const gameId = componentId.replace("select_choice_", "");

      if (activeGames[gameId]) {
        // Interaction context
        const context = req.body.context;
        // Get user ID and object choice for responding user
        // User ID is in user field for (G)DMs, and member for servers
        const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
        const objectName = data.values[0];
        // Calculate result from helper function
        const resultStr = getResult(activeGames[gameId], {
          id: userId,
          objectName,
        });

        // Remove game from storage
        delete activeGames[gameId];
        // Update message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

        try {
          // Send results
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: resultStr,
                },
              ],
            },
          });
          // Update ephemeral message
          await DiscordRequest(endpoint, {
            method: "PATCH",
            body: {
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: "Nice choice " + getRandomEmoji(),
                },
              ],
            },
          });
        } catch (err) {
          console.error("Error sending message:", err);
        }
      }
    } else if (componentId.startsWith("prev_page_") || componentId.startsWith("next_page_")) {
      // Handle pagination buttons
      const gameId = componentId.replace("prev_page_", "").replace("next_page_", "");
      const isPrevious = componentId.startsWith("prev_page_");

      if (paginatedData[gameId]) {
        const currentData = paginatedData[gameId];

        // Update the current page
        if (isPrevious && currentData.currentPage > 0) {
          currentData.currentPage--;
        } else if (
          !isPrevious &&
          currentData.currentPage <
            Math.ceil(currentData.items.length / currentData.itemsPerPage) - 1
        ) {
          currentData.currentPage++;
        }

        // Get current page items
        const startIndex = currentData.currentPage * currentData.itemsPerPage;
        const endIndex = startIndex + currentData.itemsPerPage;
        const currentItems = currentData.items.slice(startIndex, endIndex);

        // Format the current page items with nice styling
        let content = `## 📋 **Random People Data - Page ${
          currentData.currentPage + 1
        } of ${Math.ceil(currentData.items.length / currentData.itemsPerPage)}**\n\n`;

        currentItems.forEach((item, index) => {
          content += `### **${startIndex + index + 1}.** ${item.first_name} ${item.last_name}\n`;
          content += `> 📅 **Birthday:** ${item.birthday}\n`;
          content += `> 🆔 **UUID:** \`${item.uuid}\`\n`;
          content += `> ─────────────────────────────\n\n`;
        });

        const totalPages = Math.ceil(currentData.items.length / currentData.itemsPerPage);

        try {
          // Update the message
          return res.send({
            type: InteractionResponseType.UPDATE_MESSAGE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: content,
                },
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.BUTTON,
                      custom_id: `prev_page_${gameId}`,
                      label: "◀ Previous",
                      style: ButtonStyleTypes.SECONDARY,
                      disabled: currentData.currentPage === 0,
                    },
                    {
                      type: MessageComponentTypes.BUTTON,
                      custom_id: `next_page_${gameId}`,
                      label: "Next ▶",
                      style: ButtonStyleTypes.SECONDARY,
                      disabled: currentData.currentPage >= totalPages - 1,
                    },
                  ],
                },
              ],
            },
          });
        } catch (err) {
          console.error("Error updating message:", err);
        }
      }
    }

    return;
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    console.log("Command name:", name);
    // "test" command
    if (name === "test") {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `cock and ball ${getRandomEmoji()}`,
            },
          ],
        },
      });
    }

    if (name === "challenge" && id) {
      // Interaction context
      const context = req.body.context;
      // User ID is in user field for (G)DMs, and member for servers
      const userId = context === 0 ? req.body.member.user.id : req.body.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;

      // Create active game using message ID as the game ID
      activeGames[id] = {
        id: userId,
        objectName,
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `Rock papers scissors challenge from <@${userId}>`,
            },
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: "Accept",
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }

    console.log("Outside of ask, now checking if name is ask:", name === "ask");
    // "ask" command
    if (name === "ask") {
      try {
        // Fetch data from the API
        const apiUrl =
          "https://fakerapi.it/api/v2/custom?_quantity=10&_locale=en_US&uuid=uuid&first_name=firstName&last_name=lastName&birthday=date";
        const response = await fetch(apiUrl);
        const apiData = await response.json();

        console.log("API Response:", apiData);

        if (apiData && apiData.data && apiData.data.length > 0) {
          // Store the data with pagination info using interaction ID
          paginatedData[id] = {
            items: apiData.data,
            currentPage: 0,
            itemsPerPage: 3,
          };

          const currentData = paginatedData[id];
          const startIndex = currentData.currentPage * currentData.itemsPerPage;
          const endIndex = startIndex + currentData.itemsPerPage;
          const currentItems = currentData.items.slice(startIndex, endIndex);

          // Format the current page items with nice styling
          let content = `## 📋 **Random People Data - Page ${
            currentData.currentPage + 1
          } of ${Math.ceil(currentData.items.length / currentData.itemsPerPage)}**\n\n`;

          currentItems.forEach((item, index) => {
            content += `### **${startIndex + index + 1}.** ${item.first_name} ${item.last_name}\n`;
            content += `> 📅 **Birthday:** ${item.birthday}\n`;
            content += `> 🆔 **UUID:** \`${item.uuid}\`\n`;
            content += `> ─────────────────────────────\n\n`;
          });

          const totalPages = Math.ceil(currentData.items.length / currentData.itemsPerPage);
          const components = [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              content: content,
            },
          ];

          // Add navigation buttons if there are multiple pages
          if (totalPages > 1) {
            components.push({
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: `prev_page_${id}`,
                  label: "◀ Previous",
                  style: ButtonStyleTypes.SECONDARY,
                  disabled: currentData.currentPage === 0,
                },
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: `next_page_${id}`,
                  label: "Next ▶",
                  style: ButtonStyleTypes.SECONDARY,
                  disabled: currentData.currentPage >= totalPages - 1,
                },
              ],
            });
          }

          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: components,
            },
          });
        } else {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  content: "Sorry, couldn't fetch data from the API.",
                },
              ],
            },
          });
        }
      } catch (error) {
        console.error("Error fetching API data:", error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: "Sorry, there was an error fetching data from the API.",
              },
            ],
          },
        });
      }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: "unknown command" });
  }

  console.error("unknown interaction type", type);
  return res.status(400).json({ error: "unknown interaction type" });
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
