const dynamoose = require("../config/dynamoose");

const itemSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true, // Primary key
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = dynamoose.model("ItemTable", itemSchema); // Replace "ItemTable" with your DynamoDB table name
