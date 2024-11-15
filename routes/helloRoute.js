// routes/helloRoute.js

const express = require("express");
const router = express.Router();
const helloController = require("../controller/helloController");

router.get("/hello", helloController.sayHello);

module.exports = router;
