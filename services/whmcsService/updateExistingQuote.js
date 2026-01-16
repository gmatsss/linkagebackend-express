// services/whmcsService/updateExistingQuote.js

const axios = require("axios");
const phpSerialize = require("php-serialize");
const QuoteModel = require("../../dynamodb/model/Quote");
const { sendDiscordMessage } = require("../discordBotService");
const {
  encodeLineItems,
  formatDateToYYYYMMDD,
  createQuote,
} = require("./whmcsQuoteService");
const { scrapeEstimate } = require("./scraperWhmcs");
const { getClientDetails } = require("./whmcsClientService");
const { deleteQuoteInWhmcs } = require("./whmcUpdateQuote");

const WHMCS_QUOTES_URL = "https://my.murphyconsulting.us/cadzone/quotes.php";

// ─── helper to find the DynamoDB record (userEmail + estimateUrl) ───
const findQuote = async (userEmail, estimateUrl) => {
  try {
    const quotes = await QuoteModel.scan("userEmail")
      .eq(userEmail)
      .where("estimateUrl")
      .eq(estimateUrl)
      .exec();
    if (!quotes || quotes.length === 0) {
      return null;
    }
    return quotes[0];
  } catch (err) {
    await sendDiscordMessage({
      title: "Error Searching DynamoDB",
      statusCode: 500,
      message: `Error fetching quote from DynamoDB: ${err.message}`,
      channelId: "1345967280605102120",
    });
    throw new Error("Error fetching quote from DynamoDB: " + err.message);
  }
};

// ─── Core function: updateExistingQuote ───
// This will delete the old quote in WHMCS and create a new one (keeping the same logic
// as whmcsUpdateQuote, but without setting or modifying the quote status/stage).
const updateExistingQuote = async (userEmail, estimateUrl, estName) => {
  try {
    // 1) Look up the existing DynamoDB record to get quoteId:
    const quoteRecord = await findQuote(userEmail, estimateUrl);
    if (!quoteRecord) {
      // No record → we can’t proceed
      return false;
    }
    const oldQuoteId = quoteRecord.quoteId;
    if (!oldQuoteId) {
      // If DynamoDB record has no quoteId field, fail:
      return false;
    }

    // 2) DELETE the old quote in WHMCS (so its line‐items are completely removed)
    await deleteQuoteInWhmcs(oldQuoteId);

    // 3) Scrape the live estimate page to get fresh line items + dates:
    const { lineItems, metaData } = await scrapeEstimate(estimateUrl);

    // 4) Encode the new line items for WHMCS:
    const encodedLineItems = encodeLineItems(lineItems);

    // 5) Determine “validuntil” (expiry) and “datecreated” (issue date):
    const finalExpiryDate = metaData?.expiryDate
      ? formatDateToYYYYMMDD(metaData.expiryDate)
      : formatDateToYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const finalIssueDate = metaData?.issueDate
      ? formatDateToYYYYMMDD(metaData.issueDate)
      : formatDateToYYYYMMDD(new Date());

    // 6) Find or create the WHMCS client ID (userid) for this userEmail:
    let clientIdentifier;
    try {
      const clientDetails = await getClientDetails(userEmail);
      if (clientDetails?.result === "success" && clientDetails.client?.id) {
        clientIdentifier = clientDetails.client.id;
      } else {
        // If client doesn’t exist yet, we’ll just pass email; WHMCS will create a new client record.
        clientIdentifier = userEmail;
      }
    } catch (clientErr) {
      // If getClientDetails throws, fall back to using email
      clientIdentifier = userEmail;
    }

    // 7) Build the “CreateQuote” payload (new quote keeps only the new items, and no stage/status):
    const quoteParams = {
      subject: estName || "Estimate Quote on Venderflow",
      stage: "Delivered",
      validuntil: finalExpiryDate,
      datecreated: finalIssueDate,
      lineitems: encodedLineItems,
      proposal: `Please review your estimate here:\n${estimateUrl}`,
    };

    // Attach either userid or email, depending on what we have
    if (typeof clientIdentifier === "number") {
      quoteParams.userid = clientIdentifier;
    } else {
      quoteParams.email = clientIdentifier;
    }

    // 8) CALL CreateQuote → this is a brand‐new quote, so WHMCS has zero old items to append
    const quoteResponse = await createQuote(quoteParams);
    if (quoteResponse.result !== "success") {
      await sendDiscordMessage({
        title: "WHMCS Quote Replacement Failed",
        statusCode: 500,
        message: `Failed to replace quote in WHMCS.\nOld QuoteID: ${oldQuoteId}\nResponse: ${JSON.stringify(
          quoteResponse
        )}`,
        channelId: "1345967280605102120",
      });
      return false;
    }

    // 9) Save the new quoteId in DynamoDB and notify via Discord
    quoteRecord.quoteId = quoteResponse.quoteid;
    await quoteRecord.save();

    const subjectEncoded = encodeURIComponent(estName || "Estimate Quote on Venderflow");
    const whmcsQuoteLink = `${WHMCS_QUOTES_URL}?filter=true&subject=${subjectEncoded}`;

    await sendDiscordMessage({
      title: "Quote Replaced In WHMCS",
      statusCode: 200,
      message: `🔁 Old quote ${oldQuoteId} deleted. ➕ New quote ${quoteResponse.quoteid} created.\nEstimate URL: ${estimateUrl}\n🔗 [View Quote in WHMCS](${whmcsQuoteLink})`,
      channelId: "1345967280605102120",
    });

    return true;
  } catch (error) {
    await sendDiscordMessage({
      title: "Error Replacing Quote In WHMCS",
      statusCode: 500,
      message: `<@336794456063737857> Error replacing existing quote: ${error.message}`,
      channelId: "1345967280605102120",
    });
    return false;
  }
};

module.exports = {
  findQuote,
  updateExistingQuote,
};
