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
const pancakeRoute = require("./routes/pancake");
const ghlMc = require("./routes/ghlMC");
const instantlyRoute = require("./routes/instantly");
const openaiRoute = require("./routes/openai");
const itemRoutes = require("./routes/itemTest");
const Whmcs = require("./routes/Whmcs");
const googlesheet = require("./routes/googlesheet");
const wikivenderflowRoute = require("./routes/wikivenderflow");
const supportvenderflow = require("./routes/supportVenderflow");
const baseRoute = require("./routes/baseRoute");
const outlook = require("./routes/premier/webhookoutlook");

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
app.use("/pancake", pancakeRoute);
app.use("/ghlMCRoute", ghlMc);
app.use("/instantly", instantlyRoute);
app.use("/openai", openaiRoute);
app.use("/itemdynamo", itemRoutes);
app.use("/whmcs", Whmcs);
app.use("/googlesheet", googlesheet);
app.use("/supportvenderflow", supportvenderflow);
app.use("/outlook", outlook);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

// 404 error handler
app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// In your main app file
cron.schedule("0 * * * *", async () => {
  console.log("Running cron job to fetch conversations...");
  await fetchConversations();
});

cron.schedule(
  "*/10 21-22 * * *",
  async () => {
    console.log("🔁 Part 1 running every 10 minutes between 9–11 PM");
    try {
      await processScrapeWorkflow();
    } catch (error) {
      console.error("❌ Error in Part 1:", error.message);
    }
  },
  {
    timezone: "Asia/Manila",
  }
);

cron.schedule(
  "5-59/10 21-22 * * *",
  async () => {
    console.log(
      "🔁 Part 2 running every 10 minutes (offset by 5 mins) between 9–11 PM"
    );
    try {
      await processScrapeWorkflowconvotab();
    } catch (error) {
      console.error("❌ Error in Part 2:", error.message);
    }
  },
  {
    timezone: "Asia/Manila",
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`The Server is running on http://localhost:${PORT}`);
});
