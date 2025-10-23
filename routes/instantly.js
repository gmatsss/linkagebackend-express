const express = require("express");
const router = express.Router();
const {
  re3luxuryOpenEvents,
  re3luxuryReplyEvents,
  re3luxuryLinkclickEvents,
  re3luxydownloadevent,
} = require("../controller/instantly");

router.post("/re3luxuryevents", re3luxuryOpenEvents);
router.post("/re3luxuryreplyevents", re3luxuryReplyEvents);
router.post("/re3luxurylinkclickevents", re3luxuryLinkclickEvents);
router.post("/re3luxydownloadevent", re3luxydownloadevent);

module.exports = router;
