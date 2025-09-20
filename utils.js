import "dotenv/config";

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v10/" + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    console.log(`Installing ${commands.length} commands to Discord...`);
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    const response = await DiscordRequest(endpoint, { method: "PUT", body: commands });
    console.log("Successfully installed commands!");
    console.log("Note: Global commands can take up to 1 hour to appear everywhere.");
    console.log("For instant testing, consider using guild-specific commands instead.");
    return response;
  } catch (err) {
    console.error("Error installing commands:", err);
    throw err;
  }
}

// Function to install commands to a specific guild (server) - updates instantly
export async function InstallGuildCommands(appId, guildId, commands) {
  // API endpoint to overwrite guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    console.log(`Installing ${commands.length} commands to guild ${guildId}...`);
    const response = await DiscordRequest(endpoint, { method: "PUT", body: commands });
    console.log("Successfully installed guild commands!");
    return response;
  } catch (err) {
    console.error("Error installing guild commands:", err);
    throw err;
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = [
    "😭",
    "😄",
    "😌",
    "🤓",
    "😎",
    "😤",
    "🤖",
    "😶‍🌫️",
    "🌏",
    "📸",
    "💿",
    "👋",
    "🌊",
    "✨",
  ];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
