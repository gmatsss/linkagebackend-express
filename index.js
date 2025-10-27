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

cron.schedule("0 18 * * *", async () => {
  console.log("\n🕛 Running daily scraper sequence (02:00 AM Manila / 18:00 UTC)");
  console.log("=".repeat(60));

  try {
    // Run PART 1
    console.log("▶️  Running PART 1...");
    await processScrapeWorkflow();
    console.log("✅ PART 1 completed!\n");

    // Wait 1 hour before running PART 2
    console.log("⏳ Waiting 1 hour before starting PART 2...");
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000)); // 1 hour

    // Run PART 2
    console.log("▶️  Running PART 2 (1 hour after PART 1 completed)...");
    await processScrapeWorkflowconvotab();
    console.log("✅ PART 2 completed!\n");

    console.log("=".repeat(60));
    console.log("🎉 Daily scraper sequence finished!\n");
  } catch (error) {
    console.error("❌ Error running daily scraper sequence:", error.message);
  }
});
console.log("✅ Cron job scheduled: Daily scraper sequence at 02:00 AM Manila / 18:00 UTC (PART 1 → wait 1 hour → PART 2)");

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("✅ All routes and cron jobs are active");
  console.log("=".repeat(60) + "\n");
});
