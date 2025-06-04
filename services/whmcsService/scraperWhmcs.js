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
    let itemText = `**${index + 1}. ${item.productName}**\n   - 💬 ${
      item.productDescription
    }\n   - 💰 Price: ${item.price}\n   - 🏷️ Total: ${item.total}\n\n`;
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

    // Try waiting for the line items selector with a shorter timeout.
    let lineItems = [];
    try {
      await page.waitForSelector(".flex.hover\\:bg-gray-50", {
        timeout: 10000,
      });
      lineItems = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(".flex.hover\\:bg-gray-50")
        ).map((el) => {
          let fullProductText =
            el
              .querySelector(
                ".flex-grow.py-1.text-sm.text-gray-600.text-left.break-word"
              )
              ?.innerText.trim() || "N/A";
          let [productName, ...productDescriptionArr] =
            fullProductText.split("\n");
          let productDescription =
            productDescriptionArr.join(" ").trim() || "N/A";
          return {
            productName: productName.trim(),
            productDescription,
            price:
              el
                .querySelector(
                  ".flex-none.w-32.pl-6.py-1.whitespace-nowrap.text-sm.text-gray-500.text-left.hidden.md\\:block"
                )
                ?.innerText.trim() || "N/A",
            total:
              el
                .querySelector(
                  ".flex-none.w-32.py-1.whitespace-nowrap.text-sm.text-gray-500.text-right"
                )
                ?.innerText.trim() || "N/A",
          };
        });
      });
    } catch (lineErr) {
      console.warn(
        "No line items found or selector not available, proceeding with meta data only."
      );
    }

    await browser.close();

    // Optionally, if no line items are found, you could choose to throw an error or simply continue.
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
      await page.waitForSelector(".flex.hover\\:bg-gray-50", {
        timeout: 10000,
      });
      lineItems = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("[index]"));
        return rows.map((row) => {
          const itemRow = row.querySelector(".flex.hover\\:bg-gray-50");

          const productName =
            itemRow
              ?.querySelector(
                ".flex-grow.text-sm.text-gray-600.text-left.break-word"
              )
              ?.childNodes[0]?.textContent.trim() || "N/A";

          const pEls = document.querySelectorAll("#prod_desc");

          const rowIndex = Array.from(
            document.querySelectorAll("[index]")
          ).indexOf(row);
          const productDescriptions =
            pEls.length > rowIndex && pEls[rowIndex]
              ? pEls[rowIndex].innerText.trim()
              : "N/A";

          const price =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.pl-6.py-1.whitespace-nowrap.text-sm.text-gray-500.text-right.hidden.md\\:block"
              )
              ?.innerText.trim() || "N/A";
          const quantity =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.py-1.whitespace-nowrap.text-sm.text-gray-500.text-center.hidden\\md:block"
              )
              ?.innerText.trim() || "N/A";

          const tax =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.pr-16.py-1.whitespace-nowrap.text-sm.text-gray-500.text-left.hidden.md\\:flex"
              )
              ?.innerText.trim() || "N/A";

          const total =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.py-1.whitespace-nowrap.text-sm.text-gray-500.text-right"
              )
              ?.innerText.trim() || "N/A";

          return {
            productName,
            productDescriptions,
            price,
            quantity,
            tax,
            total,
          };
        });
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

    const lineItemsNoDesc = lineItems.map((item) => ({
      productName: item.productName,
      productDescriptions: item.productDescriptions,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    }));

    await sendDiscordMessage({
      title: "Estimate Scraped",
      statusCode: 200,
      message: `Estimate: ${estimateUrl}\nMeta Data: ${JSON.stringify(
        metaData
      )}\nLine Items: ${JSON.stringify(lineItemsNoDesc)}`,
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
