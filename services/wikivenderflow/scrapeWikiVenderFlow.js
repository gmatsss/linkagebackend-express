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
    .replace(/[‘’“”"'"`]/g, "") // smart quotes and apostrophes
    .replace(/[–—−]/g, "-") // dashes
    .replace(/[.,!?;:(){}\[\]]/g, "") // punctuation
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const createBrowser = async () => {
  return await puppeteer.launch({
    headless: true,
    protocolTimeout: 180000,
    // Puppeteer will use its bundled Chrome automatically
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--enable-webgl",
    ],
  });
};

const setupPage = async (browser) => {
  const page = await browser.newPage();
  page.on("error", (err) => console.error("Page error:", err));
  page.on("pageerror", (pageErr) =>
    console.error("Page console error:", pageErr)
  );
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );
  page.setDefaultNavigationTimeout(180000);
  page.setDefaultTimeout(180000);
  return page;
};

// const createBrowser = async () => {
//   return await puppeteer.launch({
//     headless: false,
//     args: ["--no-sandbox"],
//     // Optionally, specify your local Chrome executable path:
//     // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
//   });
// };

// const setupPage = async (browser) => {
//   const page = await browser.newPage();
//   page.on("error", (err) => console.error("Page error:", err));
//   page.on("pageerror", (pageErr) =>
//     console.error("Page console error:", pageErr)
//   );
//   page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
//   // Removed setUserAgent to match local code
//   page.setDefaultNavigationTimeout(180000);
//   page.setDefaultTimeout(180000);
//   return page;
// };

const scrapeWikiVenderFlowFromConversations = async function* () {
  let browser;
  const batchBoundariesRaw = [
    "lead connector mobile app",
    "conversations tab",
    "e-commerce",
    "subscription products",
  ];
  const batchBoundaries = batchBoundariesRaw.map(normalizeTitle);
  let currentBatchIndex = 0;
  let finalResults = [];
  let scrapingStarted = false;
  try {
    console.log("🚀 [SCRAPER PART 2] Starting browser...");
    browser = await createBrowser();
    console.log("✅ [SCRAPER PART 2] Browser launched successfully");
    const mainPage = await setupPage(browser);
    console.log("🌐 [SCRAPER PART 2] Loading main solutions page...");
    try {
      await mainPage.goto(
        "https://help.leadconnectorhq.com/support/solutions",
        {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        }
      );
    } catch (err) {
      console.error("❌ [SCRAPER PART 2] Failed to load main solutions page:", err.message);
      await sendDiscordMessage({
        title: "⚠️ Page Load Timeout",
        statusCode: 408,
        message: `Could not load: https://help.leadconnectorhq.com/support/solutions\nError: ${err.message}`,
        channelId,
      });
      return;
    }
    await mainPage.goto("https://help.leadconnectorhq.com/support/solutions", {
      waitUntil: "networkidle2",
    });
    const mainCategories = await mainPage.evaluate(() => {
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
    console.log(`📋 [SCRAPER PART 2] Found ${mainCategories.length} main categories`);
    await mainPage.close();
    let categoryIndex = 0;
    for (const mainCat of mainCategories) {
      categoryIndex++;
      const catPage = await setupPage(browser);
      await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
      await catPage.waitForSelector(".fc-solution-category", {
        timeout: 180000,
      });
      const categoryTitle = await catPage.evaluate(() => {
        const heading = document.querySelector(
          ".fc-solution-category h2.heading"
        );
        return heading ? heading.innerText.trim() : "";
      });
      const currentCategoryNormalized = normalizeTitle(
        categoryTitle || mainCat.title
      );
      if (!scrapingStarted) {
        if (!currentCategoryNormalized.includes("lead connector mobile app")) {
          console.log(`⏭️  [SCRAPER PART 2] Skipping category: "${categoryTitle || mainCat.title}"`);
          await catPage.close();
          continue;
        } else {
          scrapingStarted = true;
          console.log(`🎯 [SCRAPER PART 2] Starting from category: "${categoryTitle || mainCat.title}"`);
        }
      } else {
        console.log(`📂 [SCRAPER PART 2] Processing category ${categoryIndex}: "${categoryTitle || mainCat.title}"`);
      }
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
      console.log(`   └─ Found ${subCategories.length} subcategories`);
      let subResults = [];
      let subCategoryIndex = 0;
      for (const subCat of subCategories) {
        subCategoryIndex++;
        console.log(`   📁 [SCRAPER PART 2] Processing subcategory ${subCategoryIndex}/${subCategories.length}: "${subCat.title}"`);
        const subPage = await setupPage(browser);
        let allArticles = [];
        let currentUrl = subCat.url;
        let hasNextPage = true;
        while (hasNextPage) {
          await subPage.goto(currentUrl, { waitUntil: "networkidle2" });
          await subPage
            .waitForSelector("section.article-list.c-list", {
              timeout: 180000,
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
        console.log(`      └─ Found ${allArticles.length} articles to scrape`);
        let articleDetails = [];
        let articleIndex = 0;
        for (const article of allArticles) {
          articleIndex++;
          console.log(`      📄 [SCRAPER PART 2] Scraping article ${articleIndex}/${allArticles.length}: "${article.title}"`);
          const articlePage = await setupPage(browser);
          await articlePage.goto(article.url, { waitUntil: "networkidle2" });
          await articlePage
            .waitForSelector("h2.heading", { timeout: 180000 })
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
      if (
        currentBatchIndex < batchBoundaries.length &&
        currentCategoryNormalized.includes(batchBoundaries[currentBatchIndex])
      ) {
        const batchDetails = finalResults
          .map((catData) => {
            const subCount = catData.subCategories.length;
            return `Category: "${
              catData.category
            }" with ${subCount} subcategor${subCount === 1 ? "y" : "ies"}`;
          })
          .join("; ");
        await sendDiscordMessage({
          title: "Batch Process",
          statusCode: 200,
          message: `Reached boundary for batch ${currentBatchIndex + 1}: "${
            batchBoundariesRaw[currentBatchIndex]
          }". Yielding batch. ${batchDetails}`,
          channelId,
        });
        yield finalResults;
        finalResults = [];
        currentBatchIndex++;
      }
    }
    await browser.close();
    if (finalResults.length) {
      const batchDetails = finalResults
        .map((catData) => {
          const subCount = catData.subCategories.length;
          return `Category: "${catData.category}" with ${subCount} subcategor${
            subCount === 1 ? "y" : "ies"
          }`;
        })
        .join("; ");
      await sendDiscordMessage({
        title: "Batch Process",
        statusCode: 200,
        message: `Yielding final batch. ${batchDetails}`,
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

const scrapeWikiVenderFlow = async function* () {
  let browser;
  const batchBoundariesRaw = [
    "conversation ai bot",
    "funnels & websites",
    "surveys, forms, qr codes and quizzes",
    "whatsapp integration",
  ];
  const batchBoundaries = batchBoundariesRaw.map(normalizeTitle);
  let currentBatchIndex = 0;
  let finalResults = [];
  try {
    console.log("🚀 [SCRAPER PART 1] Starting browser...");
    browser = await createBrowser();
    console.log("✅ [SCRAPER PART 1] Browser launched successfully");
    const mainPage = await setupPage(browser);
    console.log("🌐 [SCRAPER PART 1] Loading main solutions page...");
    try {
      await mainPage.goto(
        "https://help.leadconnectorhq.com/support/solutions",
        {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        }
      );
    } catch (err) {
      console.error("❌ [SCRAPER PART 1] Failed to load main solutions page:", err.message);
      await sendDiscordMessage({
        title: "⚠️ Page Load Timeout",
        statusCode: 408,
        message: `Could not load: https://help.leadconnectorhq.com/support/solutions\nError: ${err.message}`,
        channelId,
      });
      return;
    }
    await mainPage.goto("https://help.leadconnectorhq.com/support/solutions", {
      waitUntil: "networkidle2",
    });
    const mainCategories = await mainPage.evaluate(() => {
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
    console.log(`📋 [SCRAPER PART 1] Found ${mainCategories.length} main categories`);
    await mainPage.close();
    let categoryIndex = 0;
    for (const mainCat of mainCategories) {
      categoryIndex++;
      console.log(`📂 [SCRAPER PART 1] Processing category ${categoryIndex}/${mainCategories.length}: "${mainCat.title}"`);
      const catPage = await setupPage(browser);
      await catPage.goto(mainCat.url, { waitUntil: "networkidle2" });
      await catPage.waitForSelector(".fc-solution-category", {
        timeout: 180000,
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
      console.log(`   └─ Found ${subCategories.length} subcategories`);
      let subResults = [];
      let subCategoryIndex = 0;
      for (const subCat of subCategories) {
        subCategoryIndex++;
        console.log(`   📁 [SCRAPER PART 1] Processing subcategory ${subCategoryIndex}/${subCategories.length}: "${subCat.title}"`);
        const subPage = await setupPage(browser);
        let allArticles = [];
        let currentUrl = subCat.url;
        let hasNextPage = true;
        while (hasNextPage) {
          await subPage.goto(currentUrl, { waitUntil: "networkidle2" });
          await subPage
            .waitForSelector("section.article-list.c-list", {
              timeout: 180000,
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
        console.log(`      └─ Found ${allArticles.length} articles to scrape`);
        let articleDetails = [];
        let articleIndex = 0;
        for (const article of allArticles) {
          articleIndex++;
          console.log(`      📄 [SCRAPER PART 1] Scraping article ${articleIndex}/${allArticles.length}: "${article.title}"`);
          const articlePage = await setupPage(browser);
          await articlePage.goto(article.url, { waitUntil: "networkidle2" });
          await articlePage
            .waitForSelector("h2.heading", { timeout: 180000 })
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
        const batchDetails = finalResults
          .map((catData) => {
            const subCount = catData.subCategories.length;
            return `Category: "${
              catData.category
            }" with ${subCount} subcategor${subCount === 1 ? "y" : "ies"}`;
          })
          .join("; ");
        await sendDiscordMessage({
          title: "Batch Process",
          statusCode: 200,
          message: `Reached boundary for batch ${currentBatchIndex + 1}: "${
            batchBoundariesRaw[currentBatchIndex]
          }". Yielding batch. ${batchDetails}`,
          channelId,
        });
        yield finalResults;
        finalResults = [];
        if (batchBoundariesRaw[currentBatchIndex] === "whatsapp integration") {
          break;
        }
        currentBatchIndex++;
      }
    }
    await browser.close();
    if (finalResults.length) {
      const batchDetails = finalResults
        .map((catData) => {
          const subCount = catData.subCategories.length;
          return `Category: "${catData.category}" with ${subCount} subcategor${
            subCount === 1 ? "y" : "ies"
          }`;
        })
        .join("; ");
      await sendDiscordMessage({
        title: "Batch Process",
        statusCode: 200,
        message: `Yielding final batch. ${batchDetails}`,
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

module.exports = {
  scrapeWikiVenderFlow,
  scrapeWikiVenderFlowFromConversations,
};
