const QuoteModel = require("../dynamodb/model/Quote");
const {
  getClientDetails,
} = require("../services/whmcsService/whmcsClientService");
const {
  encodeLineItems,
  createQuote,
  formatDateToYYYYMMDD,
} = require("../services/whmcsService/whmcsQuoteService");
const {
  scrapeEstimateLocal,
  scrapeEstimate,
} = require("../services/whmcsService/scraperWhmcs");

exports.receiveEstimateGhl = async (req, res) => {
  try {
    let clientDetails = {};
    let clientId = null;
    try {
      const clientEmail = req.body.email;
      const details = await getClientDetails(clientEmail);
      clientDetails = details;
      if (
        details &&
        details.result === "success" &&
        details.client &&
        details.client.id
      ) {
        clientId = details.client.id;
      }
    } catch (err) {
      console.warn(
        "Failed to fetch client details, fallback will be used.",
        err.message
      );
      clientDetails = {
        email: req.body.email || "",
        phone: req.body.phone || "",
        first_name: req.body.first_name || "",
        last_name: req.body.last_name || "",
        company_name: req.body.company_name || "",
        address1: req.body.address1 || "",
        address2: req.body.address2 || "",
        city: req.body.city || "",
        state: req.body.state || "",
        postcode: req.body.postcode || "",
        country: req.body.country || "",
      };
    }

    const estimateUrl = req.body.customData?.estiUlr;
    if (!estimateUrl) {
      return res.status(400).json({ error: "Estimate URL is missing." });
    }

    const { lineItems, metaData } = await scrapeEstimate(estimateUrl);
    const encodedLineItems = encodeLineItems(lineItems);

    const finalExpiryDate =
      metaData && metaData.expiryDate
        ? formatDateToYYYYMMDD(metaData.expiryDate)
        : formatDateToYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const finalIssueDate =
      metaData && metaData.issueDate
        ? formatDateToYYYYMMDD(metaData.issueDate)
        : "";

    const quoteParams = {
      subject: req.body.customData?.estiname || "Estimate Quote on Venderflow",
      stage: "Delivered",
      validuntil: finalExpiryDate,
      datecreated: finalIssueDate,
      lineitems: encodedLineItems,
    };

    if (clientId) {
      quoteParams.userid = clientId;
    } else {
      quoteParams.email = clientDetails.email || "";
    }

    const quoteResponse = await createQuote(quoteParams);
    console.log("WHMCS Quote API response:", quoteResponse);

    if (quoteResponse.result === "success") {
      const newQuote = new QuoteModel({
        estimateUrl: estimateUrl,

        userName: `${req.body.first_name || ""} ${
          req.body.last_name || ""
        }`.trim(),
        userEmail: req.body.email,
        quoteId: quoteResponse.quoteid,
      });
      await newQuote.save();
      console.log("Quote data saved to DynamoDB");
    }

    return res.status(200).json({
      message:
        "Client details obtained, estimate received, and quote created successfully!",
      clientDetails,
      estimateUrl,
      lineItems,
      quoteResponse,
    });
  } catch (error) {
    console.error("Error in workflow:", error.message || error);
    return res.status(500).json({
      error:
        error.message || "An error occurred while processing the estimate.",
    });
  }
};

exports.testConnectivity = async (req, res) => {
  try {
    // Make a GET request to the logRequest endpoint using Axios
    const response = await axios.get(
      "https://6eec-111-125-104-254.ngrok-free.app/whmcs/logRequest"
    );

    // Send back the response data from the logRequest endpoint
    res.send(
      `Response from logRequest endpoint: ${JSON.stringify(response.data)}`
    );
  } catch (error) {
    // Handle errors and return an error response
    res.status(500).send(`Error: ${error.message}`);
  }
};

// controllers/ipController.js
exports.logRequest = (req, res, next) => {
  // Extract the IP address from headers or connection
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log("Incoming request from IP:", ip);

  // Optionally attach the IP to the request for further use
  req.loggedIP = ip;

  // Call next() to proceed to the next middleware/controller
  next();
};
