require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const proxy = require("express-http-proxy");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: "150mb" }));
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }));

const WHMCS_API_URL = "https://my.murphyconsulting.us"; // 🔥 Hardcoded WHMCS API URL

const whmcsProxy = proxy(WHMCS_API_URL, {
  proxyReqPathResolver: () => "/includes/api.php",
  proxyReqOptDecorator: (proxyReqOpts) => {
    proxyReqOpts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    return proxyReqOpts;
  },
  proxyReqBodyDecorator: (bodyContent) => {
    return new URLSearchParams(bodyContent).toString();
  },
});

app.use("/whmcs-api", whmcsProxy);

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

const fetchConversations = require("./cron/cron");

// API routes
app.use("/discordnotif", discordnotifRoute);
app.use("/test", helloRoute);
app.use("/woo", woocomerceRoute);
app.use("/pancake", pancakeRoute);
app.use("/ghlMCRoute", ghlMc);
app.use("/instantly", instantlyRoute);
app.use("/openai", openaiRoute);
app.use("/itemdynamo", itemRoutes);
app.use("/whmcs", Whmcs); // 🔥 Correctly includes WHMCS routes

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

// Base route
app.get("/", (req, res) => {
  res.send("Hello from Node.js Express!");
});

// 404 error handler
app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// Cron job
cron.schedule("0 * * * *", async () => {
  console.log("Running cron job to fetch conversations...");
  await fetchConversations();
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`The Server is running on http://localhost:${PORT}`);
});
