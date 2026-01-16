const puppeteer = require("puppeteer");
const { sendDiscordMessage } = require("../discordBotService");

const DISCORD_CHANNEL_ID = "1345967280605102120";
const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const sendEstimateToDiscord = async (estimateUrl, lineItems, metaData) => {
  let messages = [];
  // Build the initial message header with meta data.
  let currentMessage = `**🔹 Estimate Scraped Successfully**\n🔗 [View Estimate](${estimateUrl})\n`;
  if (metaData) {
    currentMessage += `**🗓 Issue Date:** ${metaData.issueDate || "N/A"}\n`;
    currentMessage += `**🗓 Expiry Date:** ${metaData.expiryDate || "N/A"}\n\n`;
  }
  currentMessage += `**📌 Line Items:**\n`;

  lineItems.forEach((item, index) => {
    // Include quantity in the message
    let itemText =
      `**${index + 1}. ${item.productName}**\n` +
      `   - 💬 ${item.productDescription}\n` +
      `   - 📦 Quantity: ${item.quantity}\n` +
      `   - 💰 Price: ${item.price}\n` +
      `   - 🏷️ Total: ${item.total}\n\n`;

    if (currentMessage.length + itemText.length > MAX_DISCORD_MESSAGE_LENGTH) {
      messages.push(currentMessage);
      currentMessage = "";
    }
    currentMessage += itemText;
  });

  if (currentMessage) {
    messages.push(currentMessage);
  }

  for (const message of messages) {
    await sendDiscordMessage({
      title: "Estimate Scraped",
      statusCode: 200,
      message,
      channelId: DISCORD_CHANNEL_ID,
    });
  }
};

const scrapeEstimateLocal = async (estimateUrl) => {
  let browser;
  try {
    if (!estimateUrl) {
      throw new Error("Estimate URL is missing.");
    }

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
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

    console.log(`Navigating to: ${estimateUrl}`);
    await page.goto(estimateUrl, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    });

    // Wait for the meta information container.
    await page.waitForSelector("div.grid.grid-cols-1.md\\:grid-cols-3.py-2", {
      timeout: 30000,
    });

    // Extract meta information (Issue Date and Expiry Date)
    const metaData = await page.evaluate(() => {
      let issueDate = null,
        expiryDate = null;
      const gridContainer = document.querySelector(
        "div.grid.grid-cols-1.md\\:grid-cols-3.py-2"
      );
      if (gridContainer) {
        const containers = Array.from(
          gridContainer.querySelectorAll("div.flex.justify-between.md\\:block")
        );
        containers.forEach((container) => {
          const labelDiv = container.querySelector("div.text-sm.font-medium");
          const valueDiv = container.querySelector("div.text-sm.text-gray-600");
          if (labelDiv && valueDiv) {
            const label = labelDiv.innerText.trim();
            const value = valueDiv.innerText.trim();
            if (label.includes("Issue Date")) {
              issueDate = value;
            }
            if (label.includes("Expiry Date")) {
              expiryDate = value;
            }
          }
        });
      }
      return { issueDate, expiryDate };
    });

    // Wait for line items to load
    let lineItems = [];
    try {
      await page.waitForSelector("div.w-full", { timeout: 10000 });

      lineItems = await page.evaluate(() => {
        console.log("[Scraper] Starting extraction with hover:bg-gray-50 selector...");

        // The actual class is "w-full hover:bg-gray-50" - find these rows
        const rows = Array.from(document.querySelectorAll('.w-full.hover\\:bg-gray-50'));
        console.log(`[Scraper] Found ${rows.length} line item rows`);

        const items = rows.map((row, index) => {
          console.log(`[Scraper] Processing row ${index + 1}`);

          // Get the first child div which contains product name
          const firstChild = row.querySelector('.flex.max-md\\:pb-0.pr-1.justify-between');
          const productName = firstChild?.firstElementChild?.innerText?.trim() || "N/A";
          console.log(`  - Product Name: "${productName}"`);

          // Find divs with text-right class for prices
          const textRightDivs = Array.from(row.querySelectorAll('div')).filter(d =>
            d.className.includes('text-right') && d.innerText?.includes('$')
          );

          let price = "N/A";
          let total = "N/A";

          if (textRightDivs.length > 0) {
            price = textRightDivs[0]?.innerText?.trim() || "N/A";
            total = textRightDivs[textRightDivs.length - 1]?.innerText?.trim() || price;
          }
          console.log(`  - Price: "${price}", Total: "${total}"`);

          // Get quantity - look for text-center div
          const qtyDiv = row.querySelector('div.text-center');
          const quantity = qtyDiv?.innerText?.trim() || "1";
          console.log(`  - Quantity: "${quantity}"`);

          // Get description from sibling element
          let productDescription = "N/A";
          const nextSibling = row.nextElementSibling;
          if (nextSibling && !nextSibling.classList.contains('hover:bg-gray-50')) {
            productDescription = nextSibling.innerText?.trim() || "N/A";
          }

          return {
            productName,
            productDescription,
            quantity,
            price,
            total,
          };
        });

        console.log(`[Scraper] Extraction complete. Found ${items.length} items`);
        return items;
      });
    } catch (lineErr) {
      console.warn(
        "No line items found or selector not available, proceeding with meta data only.",
        lineErr.message
      );
    }

    await browser.close();

    if (lineItems.length === 0) {
      console.warn(`No line items found for ${estimateUrl}`);
    }

    console.log(`Scraped ${lineItems.length} line items successfully.`);

    // Send a Discord message with both meta data and line items.
    await sendEstimateToDiscord(estimateUrl, lineItems, metaData);

    // Return both line items and metaData for further processing.
    return { lineItems, metaData };
  } catch (error) {
    console.error("Puppeteer Error:", error.message);
    await sendDiscordMessage({
      title: "⚠️ Scraper Error",
      statusCode: 500,
      message: `<@336794456063737857> Error occurred while scraping: ${error.message}\n🔗 [Check Estimate](${estimateUrl})`,
      channelId: DISCORD_CHANNEL_ID,
    });
    if (browser) await browser.close();
    throw error;
  }
};

let useLocal = false;
let showBrowser = false;

const scrapeEstimate = async (estimateUrl) => {
  let browser;
  try {
    if (!estimateUrl) throw new Error("Estimate URL is missing.");
    browser = await puppeteer.launch({
      headless: !showBrowser,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      ...(useLocal
        ? {}
        : {
            executablePath:
              process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
          }),
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

    console.log(`Navigating to: ${estimateUrl}`);
    await page.goto(estimateUrl, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    });

    await page.waitForSelector("div.grid.grid-cols-1.md\\:grid-cols-3.py-2", {
      timeout: 30000,
    });

    const metaData = await page.evaluate(() => {
      let issueDate = null,
        expiryDate = null;
      const gridContainer = document.querySelector(
        "div.grid.grid-cols-1.md\\:grid-cols-3.py-2"
      );
      if (gridContainer) {
        const containers = Array.from(
          gridContainer.querySelectorAll("div.flex.justify-between.md\\:block")
        );
        containers.forEach((container) => {
          const labelDiv = container.querySelector("div.text-sm.font-medium");
          const valueDiv = container.querySelector("div.text-sm.text-gray-600");
          if (labelDiv && valueDiv) {
            const label = labelDiv.innerText.trim();
            const value = valueDiv.innerText.trim();
            if (label.includes("Issue Date")) issueDate = value;
            if (label.includes("Expiry Date")) expiryDate = value;
          }
        });
      }
      return { issueDate, expiryDate };
    });

    let lineItems = [];
    try {
      await page.waitForSelector("div.w-full", { timeout: 10000 });

      lineItems = await page.evaluate(() => {
        console.log("[Scraper] Starting extraction with hover:bg-gray-50 selector...");

        // The actual class is "w-full hover:bg-gray-50" - find these rows
        const rows = Array.from(document.querySelectorAll('.w-full.hover\\:bg-gray-50'));
        console.log(`[Scraper] Found ${rows.length} line item rows`);

        const items = rows.map((row, index) => {
          console.log(`[Scraper] Processing row ${index + 1}`);

          // Get the first child div which contains product name
          const firstChild = row.querySelector('.flex.max-md\\:pb-0.pr-1.justify-between');
          const productName = firstChild?.firstElementChild?.innerText?.trim() || "N/A";
          console.log(`  - Product Name: "${productName}"`);

          // Find divs with text-right class for prices
          const textRightDivs = Array.from(row.querySelectorAll('div')).filter(d =>
            d.className.includes('text-right') && d.innerText?.includes('$')
          );

          let price = "N/A";
          let total = "N/A";

          if (textRightDivs.length > 0) {
            price = textRightDivs[0]?.innerText?.trim() || "N/A";
            total = textRightDivs[textRightDivs.length - 1]?.innerText?.trim() || price;
          }
          console.log(`  - Price: "${price}", Total: "${total}"`);

          // Get quantity - look for text-center div
          const qtyDiv = row.querySelector('div.text-center');
          const quantity = qtyDiv?.innerText?.trim() || "1";
          console.log(`  - Quantity: "${quantity}"`);

          // Get description from sibling element
          let productDescriptions = "N/A";
          const nextSibling = row.nextElementSibling;
          if (nextSibling && !nextSibling.classList.contains('hover:bg-gray-50')) {
            productDescriptions = nextSibling.innerText?.trim() || "N/A";
          }

          return {
            productName,
            productDescriptions,
            quantity,
            price,
            total,
          };
        });

        console.log(`[Scraper] Extraction complete. Found ${items.length} items`);
        return items;
      });
    } catch (lineErr) {
      console.warn(
        "No line items found or selector not available, proceeding with meta data only."
      );
    }

    await browser.close();

    if (lineItems.length === 0)
      console.warn(`No line items found for ${estimateUrl}`);
    console.log(`Scraped ${lineItems.length} line items successfully.`);

    // Format for Discord
    const lineItemsFormatted = lineItems.map((item) => ({
      productName: item.productName,
      productDescriptions:
        `${item.productName}\n${item.productDescriptions}`.trim(),
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }));

    await sendDiscordMessage({
      title: "Estimate Scraped",
      statusCode: 200,
      message: `Estimate: ${estimateUrl}\nMeta Data: ${JSON.stringify(
        metaData
      )}\nLine Items: ${JSON.stringify(lineItemsFormatted)}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    return { lineItems, metaData };
  } catch (error) {
    console.error("Puppeteer Error:", error.message);
    await sendDiscordMessage({
      title: "⚠️ Scraper Error",
      statusCode: 500,
      message: `<@336794456063737857> Error occurred while scraping: ${error.message}\n🔗 [Check Estimate](${estimateUrl})`,
      channelId: DISCORD_CHANNEL_ID,
    });
    if (browser) await browser.close();
    throw error;
  }
};

module.exports = { scrapeEstimate, scrapeEstimateLocal };
