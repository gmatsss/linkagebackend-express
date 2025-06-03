const puppeteer = require("puppeteer");
const { sendDiscordMessage } = require("../discordBotService");

const DISCORD_CHANNEL_ID = "1345967280605102120";
const MAX_DISCORD_MESSAGE_LENGTH = 2000;

const formatDiscordMessage = (
  estimateUrl,
  lineItems,
  metaData,
  description
) => {
  console.log("=== DISCORD MESSAGE FORMATTING DEBUG ===");
  console.log("Description received:", description);
  console.log("Description type:", typeof description);
  console.log("Description length:", description ? description.length : "null");

  const messages = [];

  let headerMessage = `**🔹 Estimate Scraped Successfully**\n🔗 [View Estimate](${estimateUrl})\n\n`;

  if (metaData) {
    headerMessage += `**📅 Metadata:**\n`;
    headerMessage += `• Issue Date: ${metaData.issueDate || "N/A"}\n`;
    headerMessage += `• Expiry Date: ${metaData.expiryDate || "N/A"}\n\n`;
  }

  console.log("Checking description condition...");
  if (description) {
    console.log("Description exists, adding to message");
    headerMessage += `**📄 Description:**\n${description}\n\n`;
  } else {
    console.log("No description found or description is empty");
    headerMessage += `**📄 Description:**\nNo description available\n\n`;
  }

  headerMessage += `**📦 Line Items (${lineItems.length}):**\n`;

  console.log("Header message length:", headerMessage.length);
  console.log(
    "Header message preview:",
    headerMessage.substring(0, 300) + "..."
  );

  if (headerMessage.length > MAX_DISCORD_MESSAGE_LENGTH) {
    const basicHeader = `**🔹 Estimate Scraped Successfully**\n🔗 [View Estimate](${estimateUrl})\n\n`;
    messages.push(basicHeader);

    let metaMessage = "";
    if (metaData) {
      metaMessage += `**📅 Metadata:**\n• Issue Date: ${
        metaData.issueDate || "N/A"
      }\n• Expiry Date: ${metaData.expiryDate || "N/A"}\n\n`;
    }
    if (description) {
      metaMessage += `**📄 Description:**\n${description}\n\n`;
    } else {
      metaMessage += `**📄 Description:**\nNo description available\n\n`;
    }
    metaMessage += `**📦 Line Items (${lineItems.length}):**\n`;
    messages.push(metaMessage);
  } else {
    messages.push(headerMessage);
  }

  let currentMessage = "";
  lineItems.forEach((item, index) => {
    const itemText = formatLineItem(item, index + 1);

    if (currentMessage.length + itemText.length > MAX_DISCORD_MESSAGE_LENGTH) {
      if (currentMessage.trim()) {
        messages.push(currentMessage);
      }
      currentMessage = itemText;
    } else {
      currentMessage += itemText;
    }
  });

  if (currentMessage.trim()) {
    messages.push(currentMessage);
  }

  console.log("Total messages to send:", messages.length);
  messages.forEach((msg, index) => {
    console.log(`Message ${index + 1} preview:`, msg.substring(0, 100) + "...");
  });

  return messages;
};

const formatLineItem = (item, index) => {
  let itemText = `**${index}. ${item.productName || "N/A"}**\n`;

  if (
    item.productDescription &&
    item.productDescription !== "N/A" &&
    item.productDescription.trim()
  ) {
    itemText += `   💬 ${item.productDescription}\n`;
  }

  itemText += `   📦 Qty: ${item.quantity || "N/A"}\n`;
  itemText += `   💰 Price: ${item.price || "N/A"}\n`;

  if (item.tax && item.tax !== "N/A" && item.tax.trim()) {
    itemText += `   🏷️ Tax: ${item.tax}\n`;
  }

  itemText += `   💲 Total: ${item.total || "N/A"}\n\n`;

  return itemText;
};

const sendEstimateToDiscord = async (
  estimateUrl,
  lineItems,
  metaData,
  description
) => {
  try {
    const messages = formatDiscordMessage(
      estimateUrl,
      lineItems,
      metaData,
      description
    );

    for (const message of messages) {
      await sendDiscordMessage({
        title: "Estimate Scraped",
        statusCode: 200,
        message,
        channelId: DISCORD_CHANNEL_ID,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error("Error sending Discord message:", error);
    throw error;
  }
};

// Extract general description (Technique 1)
const extractDescription = async (page) => {
  try {
    await page.waitForSelector(".estimate-preview-desc", { timeout: 15000 });
  } catch {
    return null;
  }

  return await page.evaluate(() => {
    const descDiv = document.querySelector(".estimate-preview-desc");
    if (!descDiv) return null;

    const paras = Array.from(descDiv.querySelectorAll("p"));
    if (paras.length) {
      return paras
        .map((p) => p.textContent.trim())
        .filter((text) => text.length > 0)
        .join("\n\n");
    }

    const fullText = (descDiv.innerText || "").trim();
    return fullText.length ? fullText : null;
  });
};

// Extract item description (Technique 2) - Similar to scrapeEstimateLocal logic
const extractItemDescription = (element) => {
  try {
    const fullProductText =
      element
        .querySelector(
          ".flex-grow.py-1.text-sm.text-gray-600.text-left.break-word, .flex-grow.text-sm.text-gray-600.text-left.break-word"
        )
        ?.innerText.trim() || "";

    if (!fullProductText) return "N/A";

    const lines = fullProductText.split("\n");
    if (lines.length > 1) {
      // First line is product name, rest is description
      return lines.slice(1).join(" ").trim() || "N/A";
    }

    return "N/A";
  } catch (error) {
    console.warn("Error extracting item description:", error);
    return "N/A";
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

    // Technique 1: Extract general description
    const description = await extractDescription(page);

    let lineItems = [];
    try {
      await page.waitForSelector(".flex.hover\\:bg-gray-50", {
        timeout: 10000,
      });

      // Technique 2: Extract line items with individual descriptions
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
            quantity:
              el
                .querySelector(
                  ".flex-none.w-32.py-1.whitespace-nowrap.text-sm.text-gray-500.text-center"
                )
                ?.innerText.trim() || "N/A",
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

    if (lineItems.length === 0) {
      console.warn(`No line items found for ${estimateUrl}`);
    }

    console.log(`Scraped ${lineItems.length} line items successfully.`);
    if (description) {
      console.log(
        `Description found: ${description.substring(0, 100)}${
          description.length > 100 ? "..." : ""
        }`
      );
    } else {
      console.log("No description found");
    }

    await sendEstimateToDiscord(estimateUrl, lineItems, metaData, description);

    return { lineItems, metaData, description };
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

    // Technique 1: Extract general description
    const description = await extractDescription(page);

    let lineItems = [];
    try {
      await page.waitForSelector(".flex.hover\\:bg-gray-50", {
        timeout: 10000,
      });

      // Technique 2: Enhanced line item extraction with item descriptions
      lineItems = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("[index]"));
        return rows.map((row) => {
          const itemRow = row.querySelector(".flex.hover\\:bg-gray-50");

          // Get full product text and split into name and description
          const productElement = itemRow?.querySelector(
            ".flex-grow.text-sm.text-gray-600.text-left.break-word"
          );

          let productName = "N/A";
          let productDescription = "N/A";

          if (productElement) {
            // Try to get the first text node as product name
            const firstTextNode = productElement.childNodes[0];
            if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
              productName = firstTextNode.textContent.trim();
            }

            // Get full text and extract description
            const fullText = productElement.innerText.trim();
            const lines = fullText.split("\n");
            if (lines.length > 1) {
              productDescription = lines.slice(1).join(" ").trim() || "N/A";
            }

            // Fallback: if no description found, try alternative approach
            if (productDescription === "N/A" || !productDescription) {
              const allText = productElement.textContent.trim();
              if (allText.includes("\n")) {
                const parts = allText.split("\n");
                if (parts.length > 1) {
                  productName = parts[0].trim();
                  productDescription = parts.slice(1).join(" ").trim() || "N/A";
                }
              }
            }
          }

          const quantity =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.py-1.whitespace-nowrap.text-sm.text-gray-500.text-center"
              )
              ?.innerText.trim() || "N/A";

          const price =
            itemRow
              ?.querySelector(
                ".flex-none.w-32.pl-6.py-1.whitespace-nowrap.text-sm.text-gray-500.text-right.hidden.md\\:block"
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
            productDescription,
            quantity,
            price,
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

    if (lineItems.length === 0) {
      console.warn(`No line items found for ${estimateUrl}`);
    }

    console.log(`Scraped ${lineItems.length} line items successfully.`);

    if (description) {
      console.log(
        `General description found: ${description.substring(0, 100)}${
          description.length > 100 ? "..." : ""
        }`
      );
    } else {
      console.log("No general description found");
    }

    const itemsWithDesc = lineItems.filter(
      (item) =>
        item.productDescription &&
        item.productDescription !== "N/A" &&
        item.productDescription.trim()
    );
    console.log(`${itemsWithDesc.length} items have individual descriptions`);

    await sendEstimateToDiscord(estimateUrl, lineItems, metaData, description);

    return { lineItems, metaData, description };
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
