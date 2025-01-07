const axios = require("axios");
require("dotenv").config();

const getPages = async (req, res) => {
  const accessToken = process.env.ACCESS_TOKENPANCAKE;

  try {
    const response = await axios.get("https://pages.fm/api/v1/pages", {
      params: {
        access_token: accessToken,
      },
    });

    console.log("Response:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error fetching pages:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to fetch pages" });
  }
};

module.exports = {
  getPages,
};
