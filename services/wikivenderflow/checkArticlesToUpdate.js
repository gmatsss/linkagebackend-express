const he = require("he");
const axios = require("axios");
const { sendDiscordMessage } = require("../discordBotService");

const channelId = "1359430417027039354";
const userMention = "<@336794456063737857>";

const normalizeTitle = (title) => {
  if (!title) return "";
  return he
    .decode(title)
    .replace(/\n|&nbsp;|\u00A0/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/leadconnector/gi, "venderflow")
    .replace(/\bprint\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const getReadableTitle = (title) => {
  if (!title) return "";
  return title
    .replace(/\n|&nbsp;|\u00A0/g, " ")
    .replace(/[–—−]/g, "–")
    .replace(/\s+/g, " ")
    .replace(/print$/i, "")
    .trim();
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanedStr = dateStr.replace(/at/g, "").replace(/,/g, "");
  const parsed = new Date(Date.parse(cleanedStr));
  return isNaN(parsed) ? null : parsed;
};

const checkArticlesToUpdate = async (scrapedData, wpArticles) => {
  const articlesNeedToUpdate = [];

  for (const category of scrapedData) {
    for (const subCategory of category.subCategories || []) {
      for (const article of subCategory.articles || []) {
        const normalizedScrapedTitle = normalizeTitle(article.title);
        const matchingWP = wpArticles.find(
          (wp) => normalizeTitle(wp.title) === normalizedScrapedTitle
        );

        if (matchingWP) {
          const scrapedModifiedDate = parseDate(article.modifiedDate);
          const wpPublishedDate = parseDate(matchingWP.date);
          const wpModifiedDate = parseDate(matchingWP.modified_date);

          const latestWPDate = [wpPublishedDate, wpModifiedDate]
            .filter(Boolean)
            .sort((a, b) => b - a)[0];

          const shouldUpdate =
            scrapedModifiedDate &&
            latestWPDate &&
            scrapedModifiedDate > latestWPDate;

          if (shouldUpdate) {
            const wpCategoryName = matchingWP.categories?.[0]?.name || null;
            const wpSubCategoryName =
              matchingWP.categories?.[1]?.name || wpCategoryName;

            const titleToUpdate = getReadableTitle(article.title);
            const contentToUpdate = article.content;

            try {
              await axios.post(
                "https://wiki.venderflow.com/wp-json/custom/v1/update-kb",
                {
                  title: titleToUpdate,
                  content: contentToUpdate,
                },
                {
                  auth: {
                    username: process.env.WP_ADMIN_USERNAME,
                    password: process.env.WP_ADMIN_PASSWORD,
                  },
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log(`[✓] Updated: ${titleToUpdate}`);
              await sendDiscordMessage({
                title: "🔄 Article Updated",
                statusCode: 200,
                message: `**Title:** ${titleToUpdate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}`,
                channelId,
              });
            } catch (error) {
              const errorMsg = error.response?.data || error.message;
              console.error(`[✗] Failed to update: ${titleToUpdate}`);
              console.error(errorMsg);

              await sendDiscordMessage({
                title: "❌ Failed to Update Article",
                statusCode: 500,
                message: `${userMention}\n**Title:** ${titleToUpdate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}\n**Error:** ${errorMsg}`,
                channelId,
              });
            }

            articlesNeedToUpdate.push({
              title: titleToUpdate,
              category: category.category,
              subCategory: subCategory.subCategory,
              wp: {
                date: matchingWP.date,
                modified_date: matchingWP.modified_date,
                content: matchingWP.content,
                category: wpCategoryName,
                subCategory: wpSubCategoryName,
              },
              scraped: {
                date: article.modifiedDate,
                content: article.content,
              },
            });
          }
        }
      }
    }
  }

  return articlesNeedToUpdate;
};

module.exports = checkArticlesToUpdate;
