const express = require("express");
const router = express.Router();
const { getItem, updateStatus } = require("../controller/supportVenderflow");

router.post("/items", getItem);
router.post("/update", updateStatus);

module.exports = router;
