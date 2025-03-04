const puppeteer = require("puppeteer");
const { sendDiscordMessage } = require("./discordBotService");

const DISCORD_CHANNEL_ID = "1345967280605102120";
const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const scrapeEstimate = async (estimateUrl) => {
  try {
    if (!estimateUrl) {
      throw new Error("Estimate URL is missing.");
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(estimateUrl, { waitUntil: "networkidle2" });
    await page.waitForSelector(".flex.hover\\:bg-gray-50", { timeout: 10000 });

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
          productDescription: productDescription,
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

    let messages = [];
    let currentMessage = `**🔹 Estimate Scraped Successfully**\n🔗 [View Estimate](${estimateUrl})\n\n**📌 Line Items:**\n`;

    lineItems.forEach((item, index) => {
      let itemText = `**${index + 1}. ${item.productName}**\n   - 💬 ${
        item.productDescription
      }\n   - 💰 Price: ${item.price}\n   - 🏷️ Total: ${item.total}\n\n`;

      if (
        currentMessage.length + itemText.length >
        MAX_DISCORD_MESSAGE_LENGTH
      ) {
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
        message: message,
        channelId: DISCORD_CHANNEL_ID,
      });
    }

    return lineItems;
  } catch (error) {
    await sendDiscordMessage({
      title: "⚠️ Scraper Error",
      statusCode: 500,
      message: `<@336794456063737857> Error occurred while scraping: ${error.message}\n🔗 [Check Estimate](${estimateUrl})`,
      channelId: DISCORD_CHANNEL_ID,
    });

    throw error;
  }
};

module.exports = { scrapeEstimate };
