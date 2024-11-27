const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const helloRoute = require("./routes/helloRoute");
const woocomerce = require("./routes/woocomerce");

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Set up routes
app.use("/test", helloRoute); // Example route
app.use("/woo", woocomerce); // API route for products

// Root route
app.get("/", (req, res) => {
  res.send("Hello from Node.js Express!");
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

// Handle invalid routes
app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`The Server is running on the port ${PORT}`);
});
