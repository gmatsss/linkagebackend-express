const axios = require("axios");
const fetchConversations = require("../cron/cron");
require("dotenv").config();

const { sendDiscordMessage } = require("../services/discordBotService");

const discordChannelId = "1328533603163967661";

const getPages = async (req, res) => {
  const accessToken = process.env.ACCESS_TOKENPANCAKE;

  try {
    const response = await axios.get("https://pages.fm/api/v1/pages", {
      params: {
        access_token: accessToken,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = error.response ? error.response.data : error.message;
    console.error("Error fetching pages:", errorMessage);

    res.status(500).json({ error: "Failed to fetch pages" });
  }
};

const getConversations = async (req, res) => {
  const title = "Get Conversations";

  try {
    const result = await fetchConversations();

    // Send success message to Discord
    await sendDiscordMessage({
      title,
      statusCode: 200,
      message: `✅ Cron Job Executed Successfully\nData: ${JSON.stringify(
        result.postResults
      )}`,
      channelId: discordChannelId, // Pass channel ID
    });

    res.status(200).json({
      message: "Cron job executed successfully",
      data: result.postResults,
    });
  } catch (error) {
    // Send error message to Discord
    await sendDiscordMessage({
      title,
      statusCode: 500,
      message: `❌ Cron Job Failed\nError: ${error.message}`,
      channelId: discordChannelId, // Pass channel ID
    });

    res.status(500).json({
      message: "Failed to execute cron job",
      error: error.message,
    });
  }
};

module.exports = { getConversations };

module.exports = { getConversations };

module.exports = {
  getPages,
  getConversations,
};
