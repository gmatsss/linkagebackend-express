const express = require("express");
const router = express.Router();
const webhookController = require("../../controller/premier/webhookoutlook");

router.get("/api", webhookController.validateSubscription);
router.post("/api", webhookController.handleNotification);

module.exports = router;
