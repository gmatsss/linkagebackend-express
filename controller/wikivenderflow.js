const axios = require("axios");
const scrapeWikiVenderFlow = require("../services/wikivenderflow/scrapeWikiVenderFlow");
const checkArticlesToUpdate = require("../services/wikivenderflow/checkArticlesToUpdate");
const checkArticlesToCreate = require("../services/wikivenderflow/checkArticlesToCreate");

exports.getScrapeAndWpartcile = async (req, res) => {
  try {
    const scrapedData = await scrapeWikiVenderFlow();

    const wpResponse = await axios.get(
      "https://wiki.venderflow.com/wp-json/custom/v1/get-hkbs",
      {
        auth: {
          username: process.env.WP_ADMIN_USERNAME,
          password: process.env.WP_ADMIN_PASSWORD,
        },
      }
    );

    const wpArticles = wpResponse.data;
    const articleneedtoupdate = await checkArticlesToUpdate(
      scrapedData,
      wpArticles
    );
    const newDataForWp = await checkArticlesToCreate(scrapedData, wpArticles);

    res.json({
      articleneedtoupdate,
      newDataForWp,
    });
  } catch (err) {
    console.error("Error in getScrapeAndWpartcile:", err);
    res.status(500).json({ error: err.message });
  }
};
