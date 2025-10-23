require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: "150mb" }));
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }));

// Import routes
const helloRoute = require("./routes/helloRoute");
const woocomerceRoute = require("./routes/woocomerce");
const discordnotifRoute = require("./routes/discordnotif");
//const pancakeRoute = require("./routes/pancake");
const ghlMc = require("./routes/ghlMC");
const instantlyRoute = require("./routes/instantly");
const openaiRoute = require("./routes/openai");
const itemRoutes = require("./routes/itemTest");
const Whmcs = require("./routes/Whmcs");
const googlesheet = require("./routes/googlesheet");
const wikivenderflowRoute = require("./routes/wikivenderflow");
const supportvenderflow = require("./routes/supportVenderflow");
const baseRoute = require("./routes/baseRoute");

// const serviceFusionRoutes = require("./routes/premier/serviceFusionRoutes");

const fetchConversations = require("./cron/cron");
const {
  processScrapeWorkflow,
  processScrapeWorkflowconvotab,
} = require("./controller/wikivenderflow");

// API routes
app.use("/", baseRoute);
app.use("/wikivenderflow", wikivenderflowRoute);
app.use("/discordnotif", discordnotifRoute);
app.use("/test", helloRoute);
app.use("/woo", woocomerceRoute);
//app.use("/pancake", pancakeRoute);
app.use("/ghlMCRoute", ghlMc);
app.use("/instantly", instantlyRoute);
app.use("/openai", openaiRoute);
app.use("/itemdynamo", itemRoutes);
app.use("/whmcs", Whmcs);
app.use("/googlesheet", googlesheet);
app.use("/supportvenderflow", supportvenderflow);

// app.use("/sf", serviceFusionRoutes);
// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

// 404 error handler
app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// In your main app file
console.log("\n⏰ Setting up cron jobs...");

cron.schedule("0 * * * *", async () => {
  console.log("⏰ Running hourly cron job to fetch conversations...");
  await fetchConversations();
});
console.log("✅ Cron job scheduled: Fetch conversations (every hour)");

cron.schedule("0 12 * * *", async () => {
  console.log("\n🕕 Running daily scrape PART 1 (12:00 PM daily)");
  console.log("=".repeat(60));
  try {
    const result = await processScrapeWorkflow();
    console.log("=".repeat(60));
    console.log("✅ Daily scrape PART 1 completed successfully!\n");
  } catch (error) {
    console.error("❌ Error running daily scrape PART 1:", error.message);
  }
});
console.log("✅ Cron job scheduled: Scrape PART 1 (daily at 12:00 PM)");

cron.schedule("0 18 * * *", async () => {
  console.log("\n🕕 Running daily scrape PART 2 (6:00 PM daily)");
  console.log("=".repeat(60));
  try {
    const result = await processScrapeWorkflowconvotab();
    console.log("=".repeat(60));
    console.log("✅ Daily scrape PART 2 completed successfully!\n");
  } catch (error) {
    console.error("❌ Error running daily scrape PART 2:", error.message);
  }
});
console.log("✅ Cron job scheduled: Scrape PART 2 (daily at 6:00 PM)");

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("✅ All routes and cron jobs are active");
  console.log("=".repeat(60) + "\n");

  // ONE-TIME TEST RUN on startup (for deployment testing)
  console.log("🧪 Starting ONE-TIME test scraper run...\n");

  try {
    // Run Part 1 immediately
    console.log("\n🕕 [TEST RUN] Running scrape PART 1");
    console.log("=".repeat(60));
    const result1 = await processScrapeWorkflow();
    console.log("=".repeat(60));
    console.log("✅ [TEST RUN] Scrape PART 1 completed successfully!\n");

    // Schedule Part 2 to run 1 hour after Part 1 completes
    console.log("⏰ [TEST RUN] Part 2 scheduled to run in 1 hour...\n");
    setTimeout(async () => {
      try {
        console.log("\n🕕 [TEST RUN] Running scrape PART 2 (1 hour after Part 1)");
        console.log("=".repeat(60));
        const result2 = await processScrapeWorkflowconvotab();
        console.log("=".repeat(60));
        console.log("✅ [TEST RUN] Scrape PART 2 completed successfully!\n");
        console.log("\n" + "=".repeat(60));
        console.log("🎉 [TEST RUN] All test scraper workflows completed!");
        console.log("💡 Regular cron schedules (12 PM & 6 PM) remain active");
        console.log("=".repeat(60) + "\n");
      } catch (error) {
        console.error("\n❌ [TEST RUN] Error running scrape PART 2:", error.message);
      }
    }, 60 * 60 * 1000); // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds
  } catch (error) {
    console.error("\n❌ [TEST RUN] Error running scrape PART 1:", error.message);
  }
});
