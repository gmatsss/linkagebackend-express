const dynamoose = require("dynamoose");
const { v4: uuidv4 } = require("uuid");

const QuoteSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
    default: uuidv4,
  },
  estimateUrl: String,
  userName: String,
  userEmail: String,
  quoteId: Number,
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

module.exports = dynamoose.model("Quote", QuoteSchema);
