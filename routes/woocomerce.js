const express = require("express");
const createProductController = require("../controller/woocommerce");

const router = express.Router();

// POST route to create a new WooCommerce product
router.post("/addprod", createProductController);

module.exports = router;
