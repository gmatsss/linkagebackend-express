// routes/itemRoutes.js
const express = require("express");
const router = express.Router();
const {
  createItemHandler,
  getItemByIdHandler,
  updateItemHandler,
  deleteItemHandler,
} = require("../controller/itemTest");

// Create an item
router.post("/items", createItemHandler);

// Get an item by ID
router.get("/items/:id", getItemByIdHandler);

// Update an item
router.put("/items/:id", updateItemHandler);

// Delete an item
router.delete("/items/:id", deleteItemHandler);

module.exports = router;
