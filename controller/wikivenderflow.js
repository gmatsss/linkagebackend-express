const axios = require("axios");
const {
  scrapeWikiVenderFlow,
  scrapeWikiVenderFlowFromConversations,
} = require("../services/wikivenderflow/scrapeWikiVenderFlow");

const checkArticlesToUpdate = require("../services/wikivenderflow/checkArticlesToUpdate");
const checkArticlesToCreate = require("../services/wikivenderflow/checkArticlesToCreate");

async function processScrapeWorkflow() {
  try {
    // Fetch WP articles once (assumed to be a small list)
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

    let aggregatedArticlesToUpdate = [];
    let aggregatedNewDataForWp = [];

    // Iterate over each batch yielded by the scraper generator
    for await (const batch of scrapeWikiVenderFlow()) {
      console.log("Processing a new batch with", batch.length, "categories.");

      const articleneedtoupdateBatch = await checkArticlesToUpdate(
        batch,
        wpArticles
      );

      for (const category of batch) {
        for (const subCategory of category.subCategories || []) {
          for (const article of subCategory.articles || []) {
            const normalizedScrapedTitle = normalizeTitle(article.title);
            const potentialDup = wpArticles.find(
              (wp) => normalizeTitle(wp.title) === normalizedScrapedTitle
            );
            if (!potentialDup) {
              const softMatch = wpArticles.find((wp) =>
                normalizeTitle(wp.title).includes(normalizedScrapedTitle)
              );
              if (softMatch) {
                console.warn(
                  `[Possible False Negative] "${article.title}" vs "${softMatch.title}"`
                );
              }
            }
          }
        }
      }

      const newDataForWpBatch = await checkArticlesToCreate(batch, wpArticles);

      aggregatedArticlesToUpdate = aggregatedArticlesToUpdate.concat(
        articleneedtoupdateBatch
      );
      aggregatedNewDataForWp = aggregatedNewDataForWp.concat(newDataForWpBatch);

      console.log("Batch processed:", {
        updates: articleneedtoupdateBatch.length,
        newArticles: newDataForWpBatch.length,
      });
    }

    return {
      articleneedtoupdate: aggregatedArticlesToUpdate,
      newDataForWp: aggregatedNewDataForWp,
    };
  } catch (err) {
    console.error("Error in processScrapeWorkflow:", err);
    throw new Error(err.message);
  }
}

const getScrapeAndWpartcile = async (req, res) => {
  try {
    const result = await processScrapeWorkflow();
    res.json(result);
  } catch (err) {
    console.error("Error in getScrapeAndWpartcile:", err);
    res.status(500).json({ error: err.message });
  }
};

async function processScrapeWorkflowconvotab() {
  try {
    // Fetch WP articles once (assumed to be a small list)
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

    let aggregatedArticlesToUpdate = [];
    let aggregatedNewDataForWp = [];

    // Iterate over each batch yielded by the scraper generator
    for await (const batch of scrapeWikiVenderFlowFromConversations()) {
      console.log("Processing a new batch with", batch.length, "categories.");

      const articleneedtoupdateBatch = await checkArticlesToUpdate(
        batch,
        wpArticles
      );
      const newDataForWpBatch = await checkArticlesToCreate(batch, wpArticles);

      aggregatedArticlesToUpdate = aggregatedArticlesToUpdate.concat(
        articleneedtoupdateBatch
      );
      aggregatedNewDataForWp = aggregatedNewDataForWp.concat(newDataForWpBatch);

      console.log("Batch processed:", {
        updates: articleneedtoupdateBatch.length,
        newArticles: newDataForWpBatch.length,
      });
    }

    return {
      articleneedtoupdate: aggregatedArticlesToUpdate,
      newDataForWp: aggregatedNewDataForWp,
    };
  } catch (err) {
    console.error("Error in processScrapeWorkflow:", err);
    throw new Error(err.message);
  }
}

const getScrapeAndWpartcileconvotab = async (req, res) => {
  try {
    const result = await processScrapeWorkflowconvotab();
    res.json(result);
  } catch (err) {
    console.error("Error in getScrapeAndWpartcile:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getScrapeAndWpartcile,
  processScrapeWorkflow,
  getScrapeAndWpartcileconvotab,
  processScrapeWorkflowconvotab,
};
