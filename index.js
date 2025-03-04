require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use(bodyParser.json({ limit: "150mb" }));
app.use(bodyParser.urlencoded({ limit: "150mb", extended: true }));

// API routes
app.use("/discordnotif", discordnotifRoute);
app.use("/test", helloRoute);
app.use("/woo", woocomerceRoute);
app.use("/pancake", pancakeRoute);
app.use("/ghlMCRoute", ghlMc);
app.use("/instantly", instantlyRoute);
app.use("/openai", openaiRoute);
app.use("/itemdynamo", itemRoutes);
app.use("/whmcs", Whmcs);

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
