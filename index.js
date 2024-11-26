// index.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Import the hello route
const helloRoute = require("./routes/helloRoute");

// Set up the route
app.use("/test", helloRoute);

// Root route
app.get("/", (req, res) => {
  res.send("Hello from Node.js Express!");
});

app.get("/health", (req, res) => {
  res.status(200).send("Healthy"); //health
});

app.listen(PORT, () => {
  console.log(`The Server is running on port ${PORT}`);
});
