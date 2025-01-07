const express = require("express");
const router = express.Router();
const { MCappointment } = require("../controller/ghlMC");

router.post("/setappointment", MCappointment);

module.exports = router;
