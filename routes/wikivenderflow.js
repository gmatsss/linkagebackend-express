const express = require("express");
const router = express.Router();
const wikivenderflowController = require("../controller/wikivenderflow");

// Define the route using the exported function
router.get("/getwiki", wikivenderflowController.getScrapeAndWpartcile);

module.exports = router;
