const express = require("express");
const router = express.Router();
const {
  receiveEstimateGhl,
  testConnectivity,
  logRequest,
} = require("../controller/Whmcs");

// Define route for estimate processing
router.post("/receiveEstimateGhl", receiveEstimateGhl);
router.get("/testconnectivity", testConnectivity);
router.get("/logRequest", logRequest);

module.exports = router;
