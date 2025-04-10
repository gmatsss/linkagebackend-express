const puppeteer = require("puppeteer");
const he = require("he");
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

const scrapeWikiVenderFlow = async function* () {
  let browser;
  const batchBoundariesRaw = [
    "funnels & websites",
    "surveys, forms & chat",
    "whatsapp integration",
    "conversations tab",
    "e-commerce",
    "subscription products",
  ];
  const batchBoundaries = batchBoundariesRaw.map(normalizeTitle);
  let currentBatchIndex = 0;
  let finalResults = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome",
      protocolTimeout: 180000,
    });

    const page = await browser.newPage();
    page.on("error", (err) => console.error("Page error:", err));
    page.on("pageerror", (pageErr) =>
      console.error("Page console error:", pageErr)
    );
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );
    page.setDefaultNavigationTimeout(1800000);
    page.setDefaultTimeout(1800000);

    await page.goto("https://help.leadconnectorhq.com/support/solutions", {
      waitUntil: "networkidle2",
    });
    const mainCategories = await page.evaluate(() => {
      const nodes = document.querySelectorAll("div.cs-s");
      let cats = [];
      nodes.forEach((node) => {
        const link = node.querySelector("h3.heading a");
        if (link) {
          cats.push({ title: link.innerText.trim(), url: link.href });
        }
      });
      return cats;
    });

    for (const mainCat of mainCategories) {
      const catPage = await browser.newPage();
      catPage.setDefaultNavigationTimeout(1800000);
      catPage.setDefaultTimeout(1800000);
      await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
      await catPage.waitForSelector(".fc-solution-category", {
        timeout: 1800000,
      });
      const categoryTitle = await catPage.evaluate(() => {
        const heading = document.querySelector(
          ".fc-solution-category h2.heading"
        );
        return heading ? heading.innerText.trim() : "";
      });
      const subCategories = await catPage.evaluate(() => {
        const sections = Array.from(
          document.querySelectorAll(".cs-g-c > section.cs-g.article-list")
        );
        return sections
          .map((section) => {
            const link = section.querySelector(".list-lead a");
            return link
              ? { title: link.textContent.trim(), url: link.href }
              : null;
          })
          .filter(Boolean);
      });
      let subResults = [];
      for (const subCat of subCategories) {
        const subPage = await browser.newPage();
        subPage.setDefaultNavigationTimeout(1800000);
        subPage.setDefaultTimeout(1800000);
        let allArticles = [];
        let currentUrl = subCat.url;
        let hasNextPage = true;
        while (hasNextPage) {
          await subPage.goto(currentUrl, { waitUntil: "networkidle2" });
          await subPage
            .waitForSelector("section.article-list.c-list", {
              timeout: 1800000,
            })
            .catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const articlesOnPage = await subPage.evaluate(() => {
            const nodes = document.querySelectorAll(
              "section.article-list.c-list div.ellipsis.article-title a.c-link"
            );
            return Array.from(nodes).map((link) => ({
              title: link.textContent.trim(),
              url: link.href,
            }));
          });
          allArticles = allArticles.concat(articlesOnPage);
          const nextPageUrl = await subPage.evaluate(() => {
            const nextLink = document.querySelector(
              "div.pagination li.next:not(.disabled) a"
            );
            return nextLink ? nextLink.href : null;
          });
          hasNextPage = !!nextPageUrl;
          if (hasNextPage) currentUrl = nextPageUrl;
        }
        let articleDetails = [];
        for (const article of allArticles) {
          const articlePage = await browser.newPage();
          articlePage.setDefaultNavigationTimeout(1800000);
          articlePage.setDefaultTimeout(1800000);
          await articlePage.goto(article.url, { waitUntil: "networkidle2" });
          await articlePage
            .waitForSelector("h2.heading", { timeout: 1800000 })
            .catch(() => {});
          const articleData = await articlePage.evaluate(() => {
            const titleEl = document.querySelector("h2.heading");
            const modifiedDateEl = document.querySelector("h2.heading + p");
            let modifiedDate = "";
            if (
              modifiedDateEl &&
              modifiedDateEl.innerText.includes("Modified on:")
            ) {
              modifiedDate = modifiedDateEl.innerText
                .replace("Modified on:", "")
                .trim();
            }
            const contentEl = document.querySelector("article.article-body");
            let htmlContent = contentEl ? contentEl.outerHTML.trim() : "";
            let title = titleEl ? titleEl.innerText.trim() : "";
            title = title.replace(/LeadConnector/g, "Venderflow");
            htmlContent = htmlContent.replace(/LeadConnector/g, "Venderflow");
            return { title, modifiedDate, content: htmlContent };
          });
          articleDetails.push(articleData);
          await articlePage.close();
        }
        subResults.push({
          subCategory: subCat.title,
          totalArticles: allArticles.length,
          articles: articleDetails,
        });
        await subPage.close();
      }
      finalResults.push({
        category: categoryTitle || mainCat.title,
        subCategories: subResults,
      });
      await catPage.close();
      const currentCategoryNormalized = normalizeTitle(
        categoryTitle || mainCat.title
      );
      if (
        currentBatchIndex < batchBoundaries.length &&
        currentCategoryNormalized.includes(batchBoundaries[currentBatchIndex])
      ) {
        await sendDiscordMessage({
          title: "Batch Process",
          statusCode: 200,
          message: `Reached boundary for batch ${currentBatchIndex + 1}: "${
            batchBoundariesRaw[currentBatchIndex]
          }". Yielding batch.`,
          channelId,
        });
        yield finalResults;
        finalResults = [];
        currentBatchIndex++;
      }
    }
    await browser.close();
    if (finalResults.length) {
      await sendDiscordMessage({
        title: "Batch Process",
        statusCode: 200,
        message: "Yielding final batch.",
        channelId,
      });
      yield finalResults;
    }
  } catch (err) {
    if (browser) await browser.close();
    await sendDiscordMessage({
      title: "Scraper Error",
      statusCode: 500,
      message: `${userMention}\nError: ${err.message}`,
      channelId,
    });
    throw new Error(err.message);
  }
};

// const scrapeWikiVenderFlow = async function* () {
//   let browser;
//   const batchBoundariesRaw = [
//     "funnels & websites", // Batch 1
//     "surveys, forms & chat", // Batch 2
//     "whatsapp integration", // Batch 3
//     "conversations tab", // Batch 4
//     "e-commerce", // Batch 5
//     "subscription products", // Batch 6
//   ];
//   const batchBoundaries = batchBoundariesRaw.map(normalizeTitle);
//   let currentBatchIndex = 0;
//   let finalResults = [];

//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox"],
//     });
//     const page = await browser.newPage();
//     page.setDefaultNavigationTimeout(1800000);
//     page.setDefaultTimeout(1800000);
//     await page.goto("https://help.leadconnectorhq.com/support/solutions", {
//       waitUntil: "networkidle2",
//     });
//     const mainCategories = await page.evaluate(() => {
//       const nodes = document.querySelectorAll("div.cs-s");
//       let cats = [];
//       nodes.forEach((node) => {
//         const link = node.querySelector("h3.heading a");
//         if (link) {
//           cats.push({ title: link.innerText.trim(), url: link.href });
//         }
//       });
//       return cats;
//     });
//     for (const mainCat of mainCategories) {
//       const catPage = await browser.newPage();
//       catPage.setDefaultNavigationTimeout(1800000);
//       catPage.setDefaultTimeout(1800000);
//       await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
//       await catPage.waitForSelector(".fc-solution-category", {
//         timeout: 1800000,
//       });
//       const categoryTitle = await catPage.evaluate(() => {
//         const heading = document.querySelector(
//           ".fc-solution-category h2.heading"
//         );
//         return heading ? heading.innerText.trim() : "";
//       });
//       const subCategories = await catPage.evaluate(() => {
//         const sections = Array.from(
//           document.querySelectorAll(".cs-g-c > section.cs-g.article-list")
//         );
//         return sections
//           .map((section) => {
//             const link = section.querySelector(".list-lead a");
//             return link
//               ? { title: link.textContent.trim(), url: link.href }
//               : null;
//           })
//           .filter(Boolean);
//       });
//       let subResults = [];
//       for (const subCat of subCategories) {
//         const subPage = await browser.newPage();
//         subPage.setDefaultNavigationTimeout(1800000);
//         subPage.setDefaultTimeout(1800000);
//         let allArticles = [];
//         let currentUrl = subCat.url;
//         let hasNextPage = true;
//         while (hasNextPage) {
//           await subPage.goto(currentUrl, { waitUntil: "networkidle2" });
//           await subPage
//             .waitForSelector("section.article-list.c-list", {
//               timeout: 1800000,
//             })
//             .catch(() => {});
//           await new Promise((resolve) => setTimeout(resolve, 2000));
//           const articlesOnPage = await subPage.evaluate(() => {
//             const nodes = document.querySelectorAll(
//               "section.article-list.c-list div.ellipsis.article-title a.c-link"
//             );
//             return Array.from(nodes).map((link) => ({
//               title: link.textContent.trim(),
//               url: link.href,
//             }));
//           });
//           allArticles = allArticles.concat(articlesOnPage);
//           const nextPageUrl = await subPage.evaluate(() => {
//             const nextLink = document.querySelector(
//               "div.pagination li.next:not(.disabled) a"
//             );
//             return nextLink ? nextLink.href : null;
//           });
//           hasNextPage = !!nextPageUrl;
//           if (hasNextPage) currentUrl = nextPageUrl;
//         }
//         let articleDetails = [];
//         for (const article of allArticles) {
//           const articlePage = await browser.newPage();
//           articlePage.setDefaultNavigationTimeout(1800000);
//           articlePage.setDefaultTimeout(1800000);
//           await articlePage.goto(article.url, { waitUntil: "networkidle2" });
//           await articlePage
//             .waitForSelector("h2.heading", { timeout: 1800000 })
//             .catch(() => {});
//           const articleData = await articlePage.evaluate(() => {
//             const titleEl = document.querySelector("h2.heading");
//             const modifiedDateEl = document.querySelector("h2.heading + p");
//             let modifiedDate = "";
//             if (
//               modifiedDateEl &&
//               modifiedDateEl.innerText.includes("Modified on:")
//             ) {
//               modifiedDate = modifiedDateEl.innerText
//                 .replace("Modified on:", "")
//                 .trim();
//             }
//             const contentEl = document.querySelector("article.article-body");
//             let htmlContent = contentEl ? contentEl.outerHTML.trim() : "";
//             let title = titleEl ? titleEl.innerText.trim() : "";
//             title = title.replace(/LeadConnector/g, "Venderflow");
//             htmlContent = htmlContent.replace(/LeadConnector/g, "Venderflow");
//             return { title, modifiedDate, content: htmlContent };
//           });
//           articleDetails.push(articleData);
//           await articlePage.close();
//         }
//         subResults.push({
//           subCategory: subCat.title,
//           totalArticles: allArticles.length,
//           articles: articleDetails,
//         });
//         await subPage.close();
//       }
//       finalResults.push({
//         category: categoryTitle || mainCat.title,
//         subCategories: subResults,
//       });
//       await catPage.close();
//       const currentCategoryNormalized = normalizeTitle(
//         categoryTitle || mainCat.title
//       );
//       if (
//         currentBatchIndex < batchBoundaries.length &&
//         currentCategoryNormalized.includes(batchBoundaries[currentBatchIndex])
//       ) {
//         await sendDiscordMessage({
//           title: "Batch Process",
//           statusCode: 200,
//           message: `Reached boundary for batch ${currentBatchIndex + 1}: "${
//             batchBoundariesRaw[currentBatchIndex]
//           }". Yielding batch.`,
//           channelId,
//         });
//         yield finalResults;
//         finalResults = [];
//         currentBatchIndex++;
//       }
//     }
//     await browser.close();
//     if (finalResults.length) {
//       await sendDiscordMessage({
//         title: "Batch Process",
//         statusCode: 200,
//         message: "Yielding final batch.",
//         channelId,
//       });
//       yield finalResults;
//     }
//   } catch (err) {
//     if (browser) await browser.close();
//     await sendDiscordMessage({
//       title: "Scraper Error",
//       statusCode: 500,
//       message: `${userMention}\nError: ${err.message}`,
//       channelId,
//     });
//     throw new Error(err.message);
//   }
// };

module.exports = { scrapeWikiVenderFlow };

//v2
// const scrapeWikiVenderFlow = async () => {
//   let browser;
//   const visitedArticleUrls = new Set(); // <-- track scraped articles

//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//       ],
//       executablePath:
//         process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
//       protocolTimeout: 180000,
//     });

//     const page = await browser.newPage();

//     page.on("error", (err) => console.error("Page error:", err));
//     page.on("pageerror", (pageErr) =>
//       console.error("Page console error:", pageErr)
//     );
//     page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
//     );

//     page.setDefaultNavigationTimeout(1800000);
//     page.setDefaultTimeout(1800000);

//     await page.goto("https://help.leadconnectorhq.com/support/solutions", {
//       waitUntil: "networkidle2",
//     });

//     const mainCategories = await page.evaluate(() => {
//       const categoryNodes = document.querySelectorAll("div.cs-s");
//       let categories = [];
//       categoryNodes.forEach((node) => {
//         const catLink = node.querySelector("h3.heading a");
//         if (catLink) {
//           categories.push({
//             title: catLink.innerText.trim(),
//             url: catLink.href,
//           });
//         }
//       });
//       return categories;
//     });

//     let finalResults = [];

//     for (const mainCat of mainCategories) {
//       const catPage = await browser.newPage();
//       catPage.setDefaultNavigationTimeout(1800000);
//       catPage.setDefaultTimeout(1800000);
//       await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
//       await catPage.waitForSelector(".fc-solution-category", {
//         timeout: 1800000,
//       });

//       const categoryTitle = await catPage.evaluate(() => {
//         const heading = document.querySelector(
//           ".fc-solution-category h2.heading"
//         );
//         return heading ? heading.innerText.trim() : "";
//       });

//       const subCategories = await catPage.evaluate(() => {
//         const sections = Array.from(
//           document.querySelectorAll(".cs-g-c > section.cs-g.article-list")
//         );
//         return sections
//           .map((section) => {
//             const link = section.querySelector(".list-lead a");
//             return link
//               ? { title: link.textContent.trim(), url: link.href }
//               : null;
//           })
//           .filter(Boolean);
//       });

//       let subResults = [];

//       for (const subCat of subCategories) {
//         const subPage = await browser.newPage();
//         subPage.setDefaultNavigationTimeout(1800000);
//         subPage.setDefaultTimeout(1800000);
//         let allArticles = [];
//         let currentUrl = subCat.url;
//         let hasNextPage = true;

//         while (hasNextPage) {
//           await subPage.goto(currentUrl, { waitUntil: "networkidle2" });

//           await subPage
//             .waitForSelector("section.article-list.c-list", {
//               timeout: 1800000,
//             })
//             .catch(() => {});

//           await new Promise((resolve) => setTimeout(resolve, 2000));

//           const articlesOnPage = await subPage.evaluate(() => {
//             const articleNodes = document.querySelectorAll(
//               "section.article-list.c-list div.ellipsis.article-title a.c-link"
//             );
//             return Array.from(articleNodes).map((link) => ({
//               title: link.textContent.trim(),
//               url: link.href,
//             }));
//           });

//           allArticles = allArticles.concat(articlesOnPage);

//           const nextPageUrl = await subPage.evaluate(() => {
//             const nextLink = document.querySelector(
//               "div.pagination li.next:not(.disabled) a"
//             );
//             return nextLink ? nextLink.href : null;
//           });

//           hasNextPage = !!nextPageUrl;
//           if (hasNextPage) currentUrl = nextPageUrl;
//         }

//         let articleDetails = [];
//         for (const article of allArticles) {
//           if (visitedArticleUrls.has(article.url)) continue;
//           visitedArticleUrls.add(article.url);

//           console.log(
//             `[SCRAPING] ${categoryTitle || mainCat.title} > ${subCat.title} > ${
//               article.title
//             }`
//           );

//           const articlePage = await browser.newPage();
//           articlePage.setDefaultNavigationTimeout(1800000);
//           articlePage.setDefaultTimeout(1800000);
//           await articlePage.goto(article.url, { waitUntil: "networkidle2" });
//           await articlePage
//             .waitForSelector("h2.heading", { timeout: 1800000 })
//             .catch(() => {});

//           const articleData = await articlePage.evaluate(() => {
//             const titleEl = document.querySelector("h2.heading");
//             const modifiedDateEl = document.querySelector("h2.heading + p");
//             let modifiedDate = "";
//             if (
//               modifiedDateEl &&
//               modifiedDateEl.innerText.includes("Modified on:")
//             ) {
//               modifiedDate = modifiedDateEl.innerText
//                 .replace("Modified on:", "")
//                 .trim();
//             }

//             const contentEl = document.querySelector("article.article-body");
//             let htmlContent = contentEl ? contentEl.outerHTML.trim() : "";

//             let title = titleEl ? titleEl.innerText.trim() : "";
//             title = title.replace(/LeadConnector/g, "Venderflow");
//             htmlContent = htmlContent.replace(/LeadConnector/g, "Venderflow");

//             return {
//               title,
//               modifiedDate,
//               content: htmlContent,
//             };
//           });

//           await sendDiscordMessage({
//             title: `✅ Article Scraped`,
//             statusCode: 200,
//             message: `**Category:** ${
//               categoryTitle || mainCat.title
//             }\n**Subcategory:** ${subCat.title}\n**Title:** ${
//               articleData.title
//             }\n**Date:** ${articleData.modifiedDate}`,
//             channelId,
//           });

//           articleDetails.push(articleData);
//           await articlePage.close();
//         }

//         subResults.push({
//           subCategory: subCat.title,
//           totalArticles: allArticles.length,
//           articles: articleDetails,
//         });

//         await subPage.close();
//       }

//       finalResults.push({
//         category: categoryTitle || mainCat.title,
//         subCategories: subResults,
//       });

//       await catPage.close();

//       await sendDiscordMessage({
//         title: `📁 Finished Category`,
//         statusCode: 200,
//         message: `Category: **${
//           categoryTitle || mainCat.title
//         }** is fully scraped.`,
//         channelId,
//       });
//     }

//     await browser.close();
//     return finalResults;
//   } catch (err) {
//     if (browser) await browser.close();
//     await sendDiscordMessage({
//       title: "❌ Scraper Error",
//       statusCode: 500,
//       message: `${userMention}\n${err.message}`,
//       channelId,
//     });
//     throw new Error(err.message);
//   }
// };

module.exports = scrapeWikiVenderFlow;
