const express = require("express");
const router = express.Router();
const { receiveEstimateGhl } = require("../controller/Whmcs");

router.post("/receiveEstimateGhl", receiveEstimateGhl);

module.exports = router;
