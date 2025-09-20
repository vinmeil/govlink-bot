import "dotenv/config";
import { capitalize, InstallGlobalCommands, InstallGuildCommands } from "./utils.js";

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ASK_COMMAND = {
  name: "ask",
  description: "Ask for birthday data - include a number in your message (e.g., 'get me 5 people')",
  options: [
    {
      type: 3, // STRING
      name: "message",
      description: "Your request (must include a number between 1-50)",
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, ASK_COMMAND];

console.log("APP_ID:", process.env.APP_ID ? "Set" : "Missing");
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "Set" : "Missing");
console.log(
  "Registering commands:",
  ALL_COMMANDS.map((cmd) => cmd.name)
);

// Use GUILD_ID environment variable if available for instant testing
if (process.env.GUILD_ID) {
  console.log("GUILD_ID found, installing as guild commands (instant)...");
  InstallGuildCommands(process.env.APP_ID, process.env.GUILD_ID, ALL_COMMANDS);
} else {
  console.log("Installing as global commands (may take up to 1 hour)...");
  InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
}
