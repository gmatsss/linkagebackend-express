require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

const helloRoute = require("./routes/helloRoute");
const woocomerce = require("./routes/woocomerce");

app.use(bodyParser.json());

app.use("/test", helloRoute);
app.use("/woo", woocomerce);

app.get("/", (req, res) => {
  res.send("Hello from Node.js Express!");
});

app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

app.use((req, res) => {
  res.status(404).send({ error: "Route not found" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`The Server is running on the port ${PORT}`);
});
