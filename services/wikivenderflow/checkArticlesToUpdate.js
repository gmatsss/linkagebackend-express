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
  let totalArticlesCount = 0;
  let updateCount = 0;
  const errors = [];

  for (const category of scrapedData) {
    for (const subCategory of category.subCategories || []) {
      for (const article of subCategory.articles || []) {
        totalArticlesCount++;
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
            const titleToUpdate = matchingWP.title;
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
                  headers: { "Content-Type": "application/json" },
                }
              );
              updateCount++;
            } catch (error) {
              let errorMsg = "";
              if (error.response?.data) {
                errorMsg = JSON.stringify(error.response.data, null, 2);
              } else {
                errorMsg = error.message;
              }
              errors.push(`Failed to update ${titleToUpdate}: ${errorMsg}`);
            }
            articlesNeedToUpdate.push({
              title: titleToUpdate,
              category: category.category,
              subCategory: subCategory.subCategory,
              wp: {
                date: matchingWP.date,
                modified_date: matchingWP.modified_date,
                content: matchingWP.content,
                category: matchingWP.categories?.[0]?.name || null,
                subCategory:
                  matchingWP.categories?.[1]?.name ||
                  matchingWP.categories?.[0]?.name,
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

  let summaryMessage = "";
  if (totalArticlesCount > 0 && updateCount === 0) {
    summaryMessage = `All ${totalArticlesCount} articles in this batch are already up-to-date.`;
  } else if (totalArticlesCount > 0) {
    summaryMessage = `${updateCount} out of ${totalArticlesCount} articles in this batch were updated.`;
    if (errors.length > 0) {
      summaryMessage += ` There were ${errors.length} error(s):\n${errors.join(
        "\n"
      )}`;
    }
  }
  if (totalArticlesCount > 0) {
    await sendDiscordMessage({
      title: "Batch Summary",
      statusCode: 200,
      message: summaryMessage,
      channelId,
    });
  }

  return articlesNeedToUpdate;
};

module.exports = checkArticlesToUpdate;
