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

const checkArticlesToCreate = async (scrapedData, wpArticles) => {
  const createdArticles = [];

  for (const category of scrapedData) {
    for (const subCategory of category.subCategories || []) {
      for (const article of subCategory.articles || []) {
        const normalizedScrapedTitle = normalizeTitle(article.title);
        const matchingWP = wpArticles.find(
          (wp) => normalizeTitle(wp.title) === normalizedScrapedTitle
        );

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
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log(`[+] Created: ${titleToCreate}`);
            createdArticles.push(titleToCreate);

            await sendDiscordMessage({
              title: "🆕 Article Created",
              statusCode: 201,
              message: `**Title:** ${titleToCreate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}`,
              channelId,
            });
          } catch (error) {
            const errorMsg = error.response?.data || error.message;
            console.error(`[✗] Failed to create: ${titleToCreate}`);
            console.error(errorMsg);

            await sendDiscordMessage({
              title: "❌ Failed to Create Article",
              statusCode: 500,
              message: `${userMention}\n**Title:** ${titleToCreate}\n**Category:** ${category.category}\n**Subcategory:** ${subCategory.subCategory}\n**Error:** ${errorMsg}`,
              channelId,
            });
          }
        }
      }
    }
  }

  return createdArticles;
};

module.exports = checkArticlesToCreate;
