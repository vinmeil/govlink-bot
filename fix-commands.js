#!/usr/bin/env node
import "dotenv/config";

const DISCORD_API = "https://discord.com/api/v10";

// Updated command definitions
const commands = [
  {
    name: "test",
    description: "Basic command",
    type: 1,
  },
  {
    name: "ask",
    description:
      "Ask questions about Malaysian government services, summons, taxes, licenses, etc.",
    options: [
      {
        type: 3,
        name: "message",
        description: "Your question about government services",
        required: true,
      },
    ],
    type: 1,
  },
];

async function updateCommands() {
  const headers = {
    Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    console.log("🔄 Updating global commands...");

    const response = await fetch(`${DISCORD_API}/applications/${process.env.APP_ID}/commands`, {
      method: "PUT",
      headers,
      body: JSON.stringify(commands),
    });

    if (response.ok) {
      console.log("✅ Successfully updated global commands!");
      console.log("⏰ Changes may take up to 1 hour to appear in all servers.");

      const data = await response.json();
      console.log("📋 Registered commands:");
      data.forEach((cmd) => console.log(`  • ${cmd.name}: ${cmd.description}`));
    } else {
      const error = await response.text();
      console.error("❌ Failed to update commands:", error);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  process.exit(0);
}

updateCommands();
