// config/dynamoose.js
const dynamoose = require("dynamoose");

console.log("Dynamoose version:", dynamoose.version); // Check Dynamoose version
console.log("access version:", process.env.AWS_ACCESS_KEY_ID);
console.log("secrte version:", process.env.AWS_SECRET_ACCESS_KEY);
// Configure AWS SDK v3
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

// Create a new DynamoDB instance
const ddb = new DynamoDB({
  region: process.env.AWS_REGION || "us-east-1", // Set your AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set your AWS access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set your AWS secret key
  },
});

// Set the DynamoDB instance in Dynamoose
dynamoose.aws.ddb.set(ddb);

console.log("Dynamoose configured successfully!");

module.exports = dynamoose;
