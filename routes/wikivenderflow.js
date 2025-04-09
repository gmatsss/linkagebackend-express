const express = require("express");
const router = express.Router();
const { getScrapeAndWpartcile } = require("../controller/wikivenderflow");

router.get("/getwiki", getScrapeAndWpartcile);

module.exports = router;
