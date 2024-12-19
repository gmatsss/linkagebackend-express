const express = require("express");
const router = express.Router();
const {
  handleEstimateAccepted,
  handleEstimateDeclined,
  handleInvoicePaidNotif,
} = require("../controller/discordnotif");

router.post("/accepted", handleEstimateAccepted);
router.post("/declined", handleEstimateDeclined);
router.post("/invpayment", handleInvoicePaidNotif);

module.exports = router;
