const express = require("express");
const router = express.Router();
const { MCappointment, reSchedMCappointment } = require("../controller/ghlMC");

router.post("/setappointment", MCappointment);
router.post("/resched", reSchedMCappointment);

module.exports = router;
