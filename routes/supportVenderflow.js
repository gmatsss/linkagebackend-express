const express = require("express");
const router = express.Router();
const { getItem } = require("../controller/supportVenderflow");

router.post("/items", getItem);

module.exports = router;
