const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let isBotReady = false;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  isBotReady = true;
});

client.login(process.env.DISCORD_BOT_TOKEN);

const sendDiscordMessage = async ({
  title,
  statusCode,
  message,
  channelId,
}) => {
  if (!isBotReady) {
    console.error("Bot is not ready yet!");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      const discordMessage = `**${title}**\nStatus Code: ${statusCode}\n${message}`;
      await channel.send(discordMessage);
    } else {
      console.error("Channel not found");
    }
  } catch (error) {
    console.error("Error sending message to Discord:", error.message);
  }
};

module.exports = { sendDiscordMessage };
