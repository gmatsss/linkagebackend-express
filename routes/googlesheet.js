const express = require("express");
const router = express.Router();
const { seoAuto } = require("../controller/googleSheet");

router.post("/seoauto", seoAuto);

module.exports = router;
