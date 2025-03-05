const express = require("express");
const router = express.Router();
const { receiveEstimateGhl } = require("../controller/Whmcs");

// Define route for estimate processing
router.post("/receiveEstimateGhl", receiveEstimateGhl);

module.exports = router;
