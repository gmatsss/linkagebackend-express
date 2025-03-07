const express = require("express");
const router = express.Router();
const {
  receiveEstimateGhl,
  acceptquotewhmcs,
  markQuoteAsDead,
} = require("../controller/Whmcs");

router.post("/receiveEstimateGhl", receiveEstimateGhl);
router.post("/acceptquotewhmcs", acceptquotewhmcs);
router.post("/markQuoteAsDead", markQuoteAsDead);

module.exports = router;
