const dynamoose = require("dynamoose");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const ddb = new DynamoDB({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

dynamoose.aws.ddb.set(ddb);

console.log("Dynamoose configured successfully!");

module.exports = dynamoose;
