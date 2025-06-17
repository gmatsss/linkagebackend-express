const axios = require("axios");
const he = require("he");

const {
  scrapeWikiVenderFlow,
  scrapeWikiVenderFlowFromConversations,
} = require("../services/wikivenderflow/scrapeWikiVenderFlow");

const checkArticlesToUpdate = require("../services/wikivenderflow/checkArticlesToUpdate");
const checkArticlesToCreate = require("../services/wikivenderflow/checkArticlesToCreate");

const normalizeTitle = (title) => {
  if (!title) return "";
  return he
    .decode(title)
    .replace(/\n|&nbsp;|\u00A0/g, " ")
    .replace(/[''"""'"`]/g, "")
    .replace(/[–—−]/g, "-")
    .replace(/[.,!?;:(){}\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

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
      // Titles that need updates
      const updateTitles = new Set(
        articleneedtoupdateBatch.map((art) => normalizeTitle(art.title))
      );

      // Remove from batch any articles already flagged for update
      const filteredBatch = JSON.parse(JSON.stringify(batch)); // Deep clone

      for (const category of filteredBatch) {
        category.subCategories = category.subCategories
          .map((subCategory) => {
            subCategory.articles = subCategory.articles.filter((article) => {
              const normTitle = normalizeTitle(article.title);
              return !updateTitles.has(normTitle);
            });
            return subCategory;
          })
          .filter((sub) => sub.articles.length > 0);
      }

      // Only call checkArticlesToCreate with articles not needing update
      const newDataForWpBatch = await checkArticlesToCreate(
        filteredBatch,
        wpArticles
      );

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
