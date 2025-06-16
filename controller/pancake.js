/*const axios = require("axios");
const fetchConversations = require("../cron/cron");
require("dotenv").config();

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
  try {
    const result = await fetchConversations();

    res.status(200).json({
      message: "Cron job executed successfully",
      data: result.postResults,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to execute cron job",
      error: error.message,
    });
  }
};

module.exports = {
  getPages,
  getConversations,
};
*/