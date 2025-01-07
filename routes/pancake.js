const express = require("express");
const router = express.Router();
const { getPages } = require("../controller/pancake");

router.get("/pages", getPages);

module.exports = router;
