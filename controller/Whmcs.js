const { scrapeEstimate } = require("../services/scraperWhmcs");

exports.receiveEstimateGhl = async (req, res) => {
  try {
    const estimateUrl = req.body.customData?.estiUlr;
    if (!estimateUrl) {
      return res.status(400).json({ error: "Estimate URL is missing." });
    }

    const lineItems = await scrapeEstimate(estimateUrl);

    console.log("Extracted Line Items:", lineItems);

    return res.status(200).json({
      message: "Received estimate from GHL successfully!",
      estimateUrl,
      lineItems,
    });
  } catch (error) {
    console.error("Error in receiveEstimateGhl:", error);
    return res.status(500).json({
      error: "An error occurred while processing the estimate.",
    });
  }
};
