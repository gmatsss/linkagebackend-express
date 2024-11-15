// routes/helloRoute.js

const express = require("express");
const router = express.Router();
const helloController = require("../controllers/helloController");

router.get("/hello", helloController.sayHello);

module.exports = router;
