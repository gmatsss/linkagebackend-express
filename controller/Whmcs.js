const QuoteModel = require("../dynamodb/model/Quote");
const { sendDiscordMessage } = require("../services/discordBotService");

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

const {
  findQuote,
  updateQuoteInWhmcs,
  notifyQuoteUpdated,
} = require("../services/whmcsService/whmcUpdateQuote");

const {
  findQuoteForDeadStatus,
  updateQuoteToDeadInWhmcs,
  notifyQuoteMarkedDead,
} = require("../services/whmcsService/whmcsDeadService");

exports.markQuoteAsDead = async (req, res) => {
  const userEmail = req.body.email;
  const estimateUrl = req.body.customData?.estiUlr;

  if (!userEmail || !estimateUrl) {
    await sendDiscordMessage({
      title: "Quote Update Failed",
      statusCode: 400,
      message: "Missing user email or estimate URL.",
      channelId: "1345967280605102120",
    });
    return res
      .status(400)
      .json({ error: "Missing user email or estimate URL." });
  }

  try {
    const quote = await findQuoteForDeadStatus(userEmail, estimateUrl);
    if (!quote) return res.status(404).json({ error: "Quote not found." });

    const quoteUpdated = await updateQuoteToDeadInWhmcs(quote.quoteId);
    if (!quoteUpdated)
      return res
        .status(500)
        .json({ error: "Failed to update quote in WHMCS." });

    // ✅ Send success message to Discord
    await notifyQuoteMarkedDead(
      estimateUrl,
      req.body.first_name,
      req.body.last_name,
      userEmail,
      quote.quoteId
    );

    res.status(200).json({
      message: "Quote successfully marked as 'Dead' in WHMCS!",
      quoteId: quote.quoteId,
    });
  } catch (error) {
    await sendDiscordMessage({
      title: "Error Updating Quote to Dead",
      statusCode: 500,
      message: `<@336794456063737857> An error occurred while updating the quote to 'Dead'.\n\n**Error:** ${error.message}`,
      channelId: "1345967280605102120",
    });

    res.status(500).json({ error: "Internal server error." });
  }
};

exports.acceptquotewhmcs = async (req, res) => {
  const userEmail = req.body.email;
  const estimateUrl = req.body.customData?.estiUlr;
  const estName = req.body.customData?.estiname;

  if (!userEmail || !estimateUrl) {
    await sendDiscordMessage({
      title: "Quote Update Failed",
      statusCode: 400,
      message: "Missing user email or estimate URL.",
      channelId: "1345967280605102120",
    });
    return res
      .status(400)
      .json({ error: "Missing user email or estimate URL." });
  }

  try {
    // Pass estName in as the third argument:
    const success = await updateQuoteInWhmcs(userEmail, estimateUrl, estName);

    if (!success) {
      return res
        .status(500)
        .json({ error: "Failed to replace quote in WHMCS." });
    }

    return res.status(200).json({ message: "Quote replaced successfully!" });
  } catch (error) {
    console.error("❗ Error in acceptquotewhmcs:", error.message);
    await sendDiscordMessage({
      title: "Error Replacing Quote",
      statusCode: 500,
      message: `<@336794456063737857> An error occurred while updating the quote.\n\n**Error:** ${error.message}`,
      channelId: "1345967280605102120",
    });
    return res.status(500).json({ error: "Internal server error." });
  }
};

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
