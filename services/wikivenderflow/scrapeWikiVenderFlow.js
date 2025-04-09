const puppeteer = require("puppeteer");
const { sendDiscordMessage } = require("../discordBotService");

const channelId = "1359430417027039354";
const userMention = "<@336794456063737857>";

const scrapeWikiVenderFlow = async () => {
  let browser;
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
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
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
      const categoryNodes = document.querySelectorAll("div.cs-s");
      let categories = [];
      categoryNodes.forEach((node) => {
        const catLink = node.querySelector("h3.heading a");
        if (catLink) {
          categories.push({
            title: catLink.innerText.trim(),
            url: catLink.href,
          });
        }
      });
      return categories;
    });

    console.log("Main categories found:", mainCategories);

    let finalResults = [];

    for (const mainCat of mainCategories) {
      console.log(
        `\nProcessing main category: "${mainCat.title}" | URL: ${mainCat.url}`
      );
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

      console.log(
        `Sub-categories found for "${mainCat.title}":`,
        subCategories
      );

      let subResults = [];

      for (const subCat of subCategories) {
        console.log(`\n--> Processing sub-category: "${subCat.title}"`);
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
            .catch(() => {
              console.log(
                `No articles found on page: ${currentUrl} for sub-category: ${subCat.title}`
              );
            });

          await new Promise((resolve) => setTimeout(resolve, 2000));

          const articlesOnPage = await subPage.evaluate(() => {
            const articleNodes = document.querySelectorAll(
              "section.article-list.c-list div.ellipsis.article-title a.c-link"
            );
            return Array.from(articleNodes).map((link) => ({
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
            .catch(() => {
              console.log(`Article title not found for ${article.url}`);
            });

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

            return {
              title,
              modifiedDate,
              content: htmlContent,
            };
          });

          console.log(
            `[CATEGORY: ${categoryTitle || mainCat.title}] [SUBCATEGORY: ${
              subCat.title
            }] [TITLE: ${articleData.title}] [DATE: ${
              articleData.modifiedDate
            }]`
          );

          await sendDiscordMessage({
            title: `✅ Article Scraped`,
            statusCode: 200,
            message: `**Category:** ${
              categoryTitle || mainCat.title
            }\n**Subcategory:** ${subCat.title}\n**Title:** ${
              articleData.title
            }\n**Date:** ${articleData.modifiedDate}`,
            channelId,
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

      await sendDiscordMessage({
        title: `📁 Finished Category`,
        statusCode: 200,
        message: `Category: **${
          categoryTitle || mainCat.title
        }** is fully scraped.`,
        channelId,
      });

      const currentCategory = (categoryTitle || mainCat.title)
        .trim()
        .toLowerCase();
      if (currentCategory.includes("reputation & review management")) {
        console.log(
          "Found 'reputation & review management' category. Stopping further scraping."
        );
        break;
      }
    }

    await browser.close();
    return finalResults;
  } catch (err) {
    if (browser) await browser.close();
    await sendDiscordMessage({
      title: "❌ Scraper Error",
      statusCode: 500,
      message: `${userMention}\n${err.message}`,
      channelId,
    });
    throw new Error(err.message);
  }
};

// const scrapeWikiVenderFlow = async () => {
//     let browser;
//     try {
//       browser = await puppeteer.launch({
//         headless: true,
//         args: ["--no-sandbox"],
//       });

//       const page = await browser.newPage();
//       page.setDefaultNavigationTimeout(1800000);
//       page.setDefaultTimeout(1800000);

//       await page.goto("https://help.leadconnectorhq.com/support/solutions", {
//         waitUntil: "networkidle2",
//       });

//       const mainCategories = await page.evaluate(() => {
//         const categoryNodes = document.querySelectorAll("div.cs-s");
//         let categories = [];
//         categoryNodes.forEach((node) => {
//           const catLink = node.querySelector("h3.heading a");
//           if (catLink) {
//             categories.push({
//               title: catLink.innerText.trim(),
//               url: catLink.href,
//             });
//           }
//         });
//         return categories;
//       });

//       console.log("Main categories found:", mainCategories);

//       let finalResults = [];
//       for (const mainCat of mainCategories) {
//         console.log(
//           `\nProcessing main category: "${mainCat.title}" | URL: ${mainCat.url}`
//         );
//         const catPage = await browser.newPage();
//         catPage.setDefaultNavigationTimeout(1800000);
//         catPage.setDefaultTimeout(1800000);
//         await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
//         await catPage.waitForSelector(".fc-solution-category", {
//           timeout: 1800000,
//         });

//         const categoryTitle = await catPage.evaluate(() => {
//           const heading = document.querySelector(
//             ".fc-solution-category h2.heading"
//           );
//           return heading ? heading.innerText.trim() : "";
//         });

//         const subCategories = await catPage.evaluate(() => {
//           const sections = Array.from(
//             document.querySelectorAll(".cs-g-c > section.cs-g.article-list")
//           );
//           return sections
//             .map((section) => {
//               const link = section.querySelector(".list-lead a");
//               return link
//                 ? { title: link.textContent.trim(), url: link.href }
//                 : null;
//             })
//             .filter(Boolean);
//         });

//         console.log(
//           `Sub-categories found for "${mainCat.title}":`,
//           subCategories
//         );

//         let subResults = [];
//         for (const subCat of subCategories) {
//           console.log(`\n--> Processing sub-category: "${subCat.title}"`);
//           const subPage = await browser.newPage();
//           subPage.setDefaultNavigationTimeout(1800000);
//           subPage.setDefaultTimeout(1800000);
//           let allArticles = [];
//           let currentUrl = subCat.url;
//           let hasNextPage = true;

//           while (hasNextPage) {
//             await subPage.goto(currentUrl, { waitUntil: "networkidle2" });

//             await subPage
//               .waitForSelector("section.article-list.c-list", {
//                 timeout: 1800000,
//               })
//               .catch(() => {
//                 console.log(
//                   `No articles found on page: ${currentUrl} for sub-category: ${subCat.title}`
//                 );
//               });

//             await new Promise((resolve) => setTimeout(resolve, 2000));

//             const articlesOnPage = await subPage.evaluate(() => {
//               const articleNodes = document.querySelectorAll(
//                 "section.article-list.c-list div.ellipsis.article-title a.c-link"
//               );
//               return Array.from(articleNodes).map((link) => ({
//                 title: link.textContent.trim(),
//                 url: link.href,
//               }));
//             });

//             allArticles = allArticles.concat(articlesOnPage);

//             const nextPageUrl = await subPage.evaluate(() => {
//               const nextLink = document.querySelector(
//                 "div.pagination li.next:not(.disabled) a"
//               );
//               return nextLink ? nextLink.href : null;
//             });

//             hasNextPage = !!nextPageUrl;
//             if (hasNextPage) currentUrl = nextPageUrl;
//           }

//           let articleDetails = [];
//           for (const article of allArticles) {
//             const articlePage = await browser.newPage();
//             articlePage.setDefaultNavigationTimeout(1800000);
//             articlePage.setDefaultTimeout(1800000);
//             await articlePage.goto(article.url, { waitUntil: "networkidle2" });
//             await articlePage
//               .waitForSelector("h2.heading", { timeout: 1800000 })
//               .catch(() => {
//                 console.log(`Article title not found for ${article.url}`);
//               });

//             const articleData = await articlePage.evaluate(() => {
//               const titleEl = document.querySelector("h2.heading");
//               const modifiedDateEl = document.querySelector("h2.heading + p");
//               let modifiedDate = "";
//               if (
//                 modifiedDateEl &&
//                 modifiedDateEl.innerText.includes("Modified on:")
//               ) {
//                 modifiedDate = modifiedDateEl.innerText
//                   .replace("Modified on:", "")
//                   .trim();
//               }

//               const contentEl = document.querySelector("article.article-body");
//               let htmlContent = contentEl ? contentEl.outerHTML.trim() : "";

//               let title = titleEl ? titleEl.innerText.trim() : "";

//               title = title.replace(/LeadConnector/g, "Venderflow");
//               htmlContent = htmlContent.replace(/LeadConnector/g, "Venderflow");

//               return {
//                 title,
//                 modifiedDate,
//                 content: htmlContent,
//               };
//             });

//             console.log(
//               `[CATEGORY: ${categoryTitle || mainCat.title}] [SUBCATEGORY: ${
//                 subCat.title
//               }] [TITLE: ${articleData.title}] [DATE: ${
//                 articleData.modifiedDate
//               }]`
//             );

//             await sendDiscordMessage({
//               title: `✅ Article Scraped`,
//               statusCode: 200,
//               message: `**Category:** ${
//                 categoryTitle || mainCat.title
//               }\n**Subcategory:** ${subCat.title}\n**Title:** ${
//                 articleData.title
//               }\n**Date:** ${articleData.modifiedDate}`,
//               channelId,
//             });

//             articleDetails.push(articleData);
//             await articlePage.close();
//           }

//           subResults.push({
//             subCategory: subCat.title,
//             totalArticles: allArticles.length,
//             articles: articleDetails,
//           });

//           await subPage.close();
//         }

//         finalResults.push({
//           category: categoryTitle || mainCat.title,
//           subCategories: subResults,
//         });

//         await catPage.close();

//         await sendDiscordMessage({
//           title: `📁 Finished Category`,
//           statusCode: 200,
//           message: `Category: **${
//             categoryTitle || mainCat.title
//           }** is fully scraped.`,
//           channelId,
//         });

//         const currentCategory = (categoryTitle || mainCat.title)
//           .trim()
//           .toLowerCase();
//         if (currentCategory.includes("reputation & review management")) {
//           console.log(
//             "Found 'reputation & review management' category. Stopping further scraping."
//           );
//           break;
//         }
//       }

//       await browser.close();
//       return finalResults;
//     } catch (err) {
//       if (browser) await browser.close();
//       await sendDiscordMessage({
//         title: "❌ Scraper Error",
//         statusCode: 500,
//         message: `${userMention}\n${err.message}`,
//         channelId,
//       });
//       throw new Error(err.message);
//     }
//   };
module.exports = scrapeWikiVenderFlow;
