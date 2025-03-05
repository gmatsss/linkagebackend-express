const express = require("express");
const router = express.Router();
const { receiveEstimateGhl, testConnectivity } = require("../controller/Whmcs");

// Define route for estimate processing
router.post("/receiveEstimateGhl", receiveEstimateGhl);
router.get("/testconnectivity", testConnectivity);

module.exports = router;
