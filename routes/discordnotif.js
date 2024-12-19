const express = require("express");
const router = express.Router();
const {
  handleEstimateAccepted,
  handleEstimateDeclined,
  handleInvoicePaidNotif,
} = require("../controller/discordnotif");

router.post("/accepted", handleEstimateAccepted);
router.post("/declined", handleEstimateDeclined);
router.post("/invoice", handleInvoicePaidNotif);

module.exports = router;
