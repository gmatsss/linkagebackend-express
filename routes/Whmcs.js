const express = require("express");
const router = express.Router();
const {
  receiveEstimateGhl,
  acceptquotewhmcs,
  markQuoteAsDead,
  updatequotewhmcs,
} = require("../controller/Whmcs");

router.post("/receiveEstimateGhl", receiveEstimateGhl);
router.post("/acceptquotewhmcs", acceptquotewhmcs);
router.post("/markQuoteAsDead", markQuoteAsDead);
router.post("/updatequotewhmcs", updatequotewhmcs);

module.exports = router;
