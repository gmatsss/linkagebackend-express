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
    .replace(/[‘’“”"'"`]/g, "") // smart quotes and apostrophes
    .replace(/[–—−]/g, "-") // dashes
    .replace(/[.,!?;:(){}\[\]]/g, "") // punctuation
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

const checkArticlesToCreate = async (scrapedData, wpArticles) => {
  const createdArticles = [];
  let totalArticlesCount = 0;
  let alreadyExistsCount = 0;

  for (const category of scrapedData) {
    for (const subCategory of category.subCategories || []) {
      for (const article of subCategory.articles || []) {
        totalArticlesCount++;
        const normalizedScrapedTitle = normalizeTitle(article.title);
        const matchingWP = wpArticles.find(
          (wp) => normalizeTitle(wp.title) === normalizedScrapedTitle
        );

        if (matchingWP) {
          alreadyExistsCount++;
          // No individual Discord message is sent here.
        }

        if (!matchingWP) {
          const titleToCreate = getReadableTitle(article.title);
          const contentToCreate = article.content;
          const parentCategory = category.category
            .toLowerCase()
            .replace(/\s+/g, "-");
          const childCategory = subCategory.subCategory
            .replace(/\s+\d+$/, "")
            .toLowerCase()
            .replace(/\s+/g, "-");

          try {
            await axios.post(
              "https://wiki.venderflow.com/wp-json/custom/v1/create-kb",
              {
                title: titleToCreate,
                content: contentToCreate,
                parent_category: parentCategory,
                child_category: childCategory,
              },
              {
                auth: {
                  username: process.env.WP_ADMIN_USERNAME,
                  password: process.env.WP_ADMIN_PASSWORD,
                },
                headers: { "Content-Type": "application/json" },
              }
            );

            await sendDiscordMessage({
              title: "🆕 Article Created",
              statusCode: 201,
              message: `**Title:** ${titleToCreate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}`,
              channelId,
            });
            createdArticles.push(titleToCreate);
          } catch (error) {
            const knownSkipMessage =
              "KB article with this title already exists.";
            let rawError = "";

            if (error.response?.data?.error) {
              rawError = error.response.data.error;
            } else {
              rawError = error.message || "Unknown error";
            }

            if (rawError === knownSkipMessage) {
              alreadyExistsCount++;
              continue;
            }

            const errorMsg = error.response?.data
              ? JSON.stringify(error.response.data, null, 2)
              : rawError;

            await sendDiscordMessage({
              title: "❌ Failed to Create Article",
              statusCode: 500,
              message: `${userMention}\n**Title:** ${titleToCreate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}\n**Error:**\n\`\`\`json\n${errorMsg}\n\`\`\``,
              channelId,
            });
          }
        }
      }
    }
  }

  if (totalArticlesCount > 0 && createdArticles.length === 0) {
    await sendDiscordMessage({
      title: "Batch Summary",
      statusCode: 200,
      message: `All ${totalArticlesCount} articles in this batch already exist on the wiki.`,
      channelId,
    });
  } else if (totalArticlesCount > 0) {
    await sendDiscordMessage({
      title: "Batch Summary",
      statusCode: 200,
      message: `${alreadyExistsCount} out of ${totalArticlesCount} articles in this batch already exist on the wiki.\nCreated ${createdArticles.length} new article(s).`,
      channelId,
    });
  }

  return createdArticles;
};

module.exports = checkArticlesToCreate;
