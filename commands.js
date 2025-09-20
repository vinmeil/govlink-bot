import "dotenv/config";
import { getRPSChoices } from "./game.js";
import { capitalize, InstallGlobalCommands, InstallGuildCommands } from "./utils.js";

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: "challenge",
  description: "Challenge to a match of rock paper scissors",
  options: [
    {
      type: 3,
      name: "object",
      description: "Pick your object",
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ASK_COMMAND = {
  name: "ask",
  description: "Ask a question and get it echoed back",
  options: [
    {
      type: 3,
      name: "query",
      description: "Your question or message",
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, ASK_COMMAND];

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
