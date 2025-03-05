const puppeteer = require("puppeteer");
const { sendDiscordMessage } = require("./discordBotService");

const DISCORD_CHANNEL_ID = "1345967280605102120";
const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const scrapeEstimate = async (estimateUrl) => {
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
        "--disable-dev-shm-usage", // Prevents memory issues in Docker/ECS
        "--disable-gpu",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      protocolTimeout: 180000, // Extend timeout to prevent premature failures
    });

    const page = await browser.newPage();

    // Attach error listeners for debugging
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

    await page.waitForSelector(".flex.hover\\:bg-gray-50", { timeout: 30000 });

    const lineItems = await page.evaluate(() => {
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

    await browser.close();

    if (lineItems.length === 0) {
      throw new Error(
        `<@336794456063737857> No line items found for ${estimateUrl}`
      );
    }

    console.log(`Scraped ${lineItems.length} line items successfully.`);

    // Send estimate details to Discord
    await sendEstimateToDiscord(estimateUrl, lineItems);

    return lineItems;
  } catch (error) {
    console.error("Puppeteer Error:", error.message);

    // Send error message to Discord
    await sendDiscordMessage({
      title: "⚠️ Scraper Error",
      statusCode: 500,
      message: `<@336794456063737857> Error occurred while scraping: ${error.message}\n🔗 [Check Estimate](${estimateUrl})`,
      channelId: DISCORD_CHANNEL_ID,
    });

    if (browser) await browser.close(); // Ensure browser is closed on failure
    throw error;
  }
};

// Helper function to send formatted messages to Discord
const sendEstimateToDiscord = async (estimateUrl, lineItems) => {
  let messages = [];
  let currentMessage = `**🔹 Estimate Scraped Successfully**\n🔗 [View Estimate](${estimateUrl})\n\n**📌 Line Items:**\n`;

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

module.exports = { scrapeEstimate };
