const puppeteer = require("puppeteer");

const estimateUrl = "https://link.murphyconsulting.us/l/xv44Gl8IP";

(async () => {
  let browser;
  try {
    console.log("Launching browser (visible mode)...");
    browser = await puppeteer.launch({
      headless: false, // VISIBLE BROWSER
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      protocolTimeout: 180000,
    });

    const page = await browser.newPage();

    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    );

    console.log(`Navigating to: ${estimateUrl}`);
    await page.goto(estimateUrl, {
      waitUntil: "networkidle2",
      timeout: 180000,
    });

    // Wait a bit for JS to render
    console.log("Waiting for page to fully load...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take a screenshot
    await page.screenshot({ path: "screenshot.png", fullPage: true });
    console.log("Screenshot saved to screenshot.png");

    // Log the page title and URL
    console.log("Page title:", await page.title());
    console.log("Current URL:", page.url());

    // Try to find the meta selector, but don't fail if not found
    const hasMetaGrid = await page.$("div.grid.grid-cols-1.md\\:grid-cols-3.py-2");
    console.log("Meta grid found:", !!hasMetaGrid);

    // Extract meta information
    const metaData = await page.evaluate(() => {
      let issueDate = null, expiryDate = null;
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

    console.log("\n=== META DATA ===");
    console.log("Issue Date:", metaData.issueDate);
    console.log("Expiry Date:", metaData.expiryDate);

    // Extract line items
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

          // Get all children divs
          const children = Array.from(row.children);
          console.log(`  - Row has ${children.length} children`);

          // The structure is: [name div] [price] [qty] [tax] [total]
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

          // Get description - look for prod_desc or the description section
          // The description is in a sibling element after the row
          let productDescription = "N/A";
          const nextSibling = row.nextElementSibling;
          if (nextSibling && !nextSibling.classList.contains('hover:bg-gray-50')) {
            productDescription = nextSibling.innerText?.trim() || "N/A";
          }
          console.log(`  - Description: "${productDescription.substring(0, 50)}..."`);

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
      console.warn("No line items found:", lineErr.message);
    }

    console.log("\n=== LINE ITEMS ===");
    console.log(`Found ${lineItems.length} line items:\n`);

    lineItems.forEach((item, index) => {
      console.log(`--- Item ${index + 1} ---`);
      console.log("Product:", item.productName);
      console.log("Description:", item.productDescription);
      console.log("Quantity:", item.quantity);
      console.log("Price:", item.price);
      console.log("Total:", item.total);
      console.log("");
    });

    console.log("\n=== FULL JSON OUTPUT ===");
    console.log(JSON.stringify({ metaData, lineItems }, null, 2));

    // Keep browser open for 10 seconds so you can see
    console.log("\nBrowser will close in 10 seconds...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();
    console.log("Done!");

  } catch (error) {
    console.error("Error:", error.message);
    if (browser) await browser.close();
  }
})();
