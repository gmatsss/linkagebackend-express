const axios = require("axios");

exports.generateSEOContent = async (data) => {
  console.log("Received data:", data);

  const { rowValues } = data;
  if (!rowValues || rowValues.length === 0) {
    throw new Error("No row values provided");
  }

  const rowData = rowValues[0];

  const prompt = `Create a detailed SEO-optimized content using the following details:
Keyword: ${rowData[0]}
Title: ${rowData[1]}
Meta Description: ${rowData[2]}
Outline: ${rowData[3]}
Please provide a final SEO copy that includes engaging and keyword-rich text.`;

  const requestData = {
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
  };

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    requestData,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return response.data;
};
