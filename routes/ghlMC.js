const express = require("express");
const router = express.Router();
const {
  MCappointment,
  reSchedMCappointment,
  Mcformsubmission,
  scale4Ipget,
} = require("../controller/ghlMC");

router.post("/setappointment", MCappointment);
router.post("/resched", reSchedMCappointment);
router.post("/formsubmission", Mcformsubmission);

//scale 4 media
router.post("/scale4Ipget", scale4Ipget);

module.exports = router;
