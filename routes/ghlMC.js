const express = require("express");
const router = express.Router();
const {
  MCappointment,
  reSchedMCappointment,
  Mcformsubmission,
} = require("../controller/ghlMC");

router.post("/setappointment", MCappointment);
router.post("/resched", reSchedMCappointment);
router.post("/formsubmission", Mcformsubmission);

module.exports = router;
