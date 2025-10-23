// routes/baseRoute.js

const express = require("express");
const router = express.Router();
const { getWelcomeMessage, showForm } = require("../controller/baseController");
const apiCtrl = require("../controller/apiPlayController");

router.get("/", getWelcomeMessage);
router.get("/play", showForm);
router.post("/play/fetch", apiCtrl.fetchApi);

module.exports = router;
