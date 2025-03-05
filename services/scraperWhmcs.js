const puppeteer = require("puppeteer");

const scrapeEstimate = async (estimateUrl) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Fix ECS shared memory issue
        "--disable-gpu",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      protocolTimeout: 180000, // Increase timeout to 3 minutes
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    await page.goto(estimateUrl, {
      waitUntil: "domcontentloaded", // Use domcontentloaded instead of networkidle2
      timeout: 180000, // Increase timeout
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

    return lineItems;
  } catch (error) {
    console.error("Puppeteer Error:", error.message);
    throw error;
  }
};

module.exports = { scrapeEstimate };
