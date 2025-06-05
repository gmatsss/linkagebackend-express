// services/whmcsService/whmcUpdateQuote.js

const axios = require("axios");
const phpSerialize = require("php-serialize");
const QuoteModel = require("../../dynamodb/model/Quote");
const { sendDiscordMessage } = require("../discordBotService");
const {
  encodeLineItems,
  formatDateToYYYYMMDD,
} = require("./whmcsQuoteService");
const { scrapeEstimate } = require("./scraperWhmcs");

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
    throw new Error("Error fetching quote from DynamoDB: " + err.message);
  }
};

// ─── Core function: updateExistingQuote ───
// This updates the existing quote in WHMCS (keeping its current stage).
const updateExistingQuote = async (userEmail, estimateUrl, estName) => {
  try {
    // 1) Look up the existing DynamoDB record to get quoteId:
    const quoteRecord = await findQuote(userEmail, estimateUrl);
    if (!quoteRecord) {
      // No record → we can’t proceed
      return false;
    }
    const existingQuoteId = quoteRecord.quoteId;
    if (!existingQuoteId) {
      // If DynamoDB record has no quoteId field, fail:
      return false;
    }

    // 2) Scrape the live estimate page to get fresh line items + dates:
    const { lineItems, metaData } = await scrapeEstimate(estimateUrl);

    // 3) Encode the new line items for WHMCS:
    const encoded = encodeLineItems(lineItems);

    // 4) Decide what “validuntil” (expiry) and “datecreated” (issue date) should be:
    const finalExpiryDate = metaData?.expiryDate
      ? formatDateToYYYYMMDD(metaData.expiryDate)
      : formatDateToYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const finalIssueDate = metaData?.issueDate
      ? formatDateToYYYYMMDD(metaData.issueDate)
      : formatDateToYYYYMMDD(new Date());

    // 5) Build the WHMCS UpdateQuote parameters. *** Crucial: do NOT include “stage” here. ***
    const params = {
      action: "UpdateQuote",
      identifier: process.env.WHMCS_API_IDENTIFIER,
      secret: process.env.WHMCS_API_SECRET,
      responsetype: "json",

      quoteid: existingQuoteId,
      // If you want to allow changing subject, you can pass “subject: estName”:
      subject: estName || undefined,
      // These fields will overwrite line items and dates; stage is omitted so it stays unchanged:
      validuntil: finalExpiryDate,
      datecreated: finalIssueDate,
      lineitems: encoded,
      proposal: `Please review your updated estimate here:\n${estimateUrl}`,
    };

    // Remove any undefined keys (so subject doesn’t send undefined if estName was null):
    for (const key of Object.keys(params)) {
      if (params[key] === undefined) delete params[key];
    }

    // 6) POST to WHMCS API:
    const response = await axios.post(
      process.env.WHMCS_API_URL,
      new URLSearchParams(params).toString(),
      {
        headers: { "Content‐Type": "application/x‐www‐form‐urlencoded" },
      }
    );

    // 7) Check result:
    if (response.data.result !== "success") {
      await sendDiscordMessage({
        title: "WHMCS Quote Update Failed",
        statusCode: 500,
        message: `Failed to update quote in WHMCS. QuoteID: ${existingQuoteId}\nResponse: ${JSON.stringify(
          response.data
        )}`,
        channelId: "1345967280605102120",
      });
      return false;
    }

    // 8) (Optional) Send a success message in Discord to notify team:
    await sendDiscordMessage({
      title: "Quote Updated In WHMCS",
      statusCode: 200,
      message: `✅ Quote ${existingQuoteId} updated (kept original stage).\nEstimate URL: ${estimateUrl}`,
      channelId: "1345967280605102120",
    });

    return true;
  } catch (error) {
    await sendDiscordMessage({
      title: "Error Updating Quote In WHMCS",
      statusCode: 500,
      message: `<@336794456063737857> Error updating existing quote: ${error.message}`,
      channelId: "1345967280605102120",
    });
    return false;
  }
};

module.exports = {
  findQuote,
  updateExistingQuote,
};
