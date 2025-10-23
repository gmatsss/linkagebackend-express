// controllers/itemController.js
const ItemModel = require("../dynamodb/model/ItemModel");

// Create an item
const createItemHandler = async (req, res) => {
  try {
    const itemData = req.body;
    const item = new ItemModel(itemData);
    await item.save();
    res.status(201).json({ message: "Item created successfully", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get an item by ID
const getItemByIdHandler = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await ItemModel.get(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an item
const updateItemHandler = async (req, res) => {
  try {
    const itemId = req.params.id;
    const updateData = req.body;
    const item = await ItemModel.get(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    Object.assign(item, updateData); // Update the item with new data
    await item.save();
    res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an item
const deleteItemHandler = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await ItemModel.get(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    await ItemModel.delete(itemId);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createItemHandler,
  getItemByIdHandler,
  updateItemHandler,
  deleteItemHandler,
};
