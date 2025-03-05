const { scrapeEstimate } = require("../services/scraperWhmcs");
const axios = require("axios");

const WHMCS_API_IDENTIFIER = "jqI0u3EkPjjL38cEos38MVe5IsrX7LGQ";
const WHMCS_API_SECRET = "76rDuutcKsCM4F0GeCP68B3L7qXNLWHi";

const buildRequestParams = (action, additionalParams) => ({
  action,
  identifier: WHMCS_API_IDENTIFIER,
  secret: WHMCS_API_SECRET,
  responsetype: "json",
  ...additionalParams,
});

exports.receiveEstimateGhl = async (req, res) => {
  try {
    const estimateUrl = req.body.customData?.estiUlr;
    if (!estimateUrl) {
      return res.status(400).json({ error: "Estimate URL is missing." });
    }

    console.log(`Scraping estimate from: ${estimateUrl}`);
    const lineItems = await scrapeEstimate(estimateUrl);

    const quoteParams = {
      subject: req.body.subject || "Estimate Quote",
      stage: req.body.stage || "Draft",
      validuntil:
        req.body.validuntil ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      lineitems: JSON.stringify(lineItems),
    };

    const params = buildRequestParams("CreateQuote", quoteParams);
    const formParams = new URLSearchParams(params);

    console.log("Sending request to WHMCS API through proxy...");
    const response = await axios.post(
      "http://localhost:3000/whmcs-api",
      formParams.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("Received response from WHMCS API:", response.data);
    return res.status(200).json({
      message: "Estimate received and quote created successfully!",
      estimateUrl,
      lineItems,
      quoteResponse: response.data,
    });
  } catch (error) {
    console.error("Error in receiveEstimateGhl workflow:", error);
    return res.status(500).json({
      error: "An error occurred while processing the estimate.",
    });
  }
};

exports.testConnectivity = async (req, res) => {
  const { exec } = require("child_process");
  exec(
    "curl -I https://link.murphyconsulting.us/l/vW8toYeaA",
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).send(`Error: ${error.message}`);
      }
      res.send(`STDOUT: ${stdout}\nSTDERR: ${stderr}`);
    }
  );
};
