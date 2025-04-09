const axios = require("axios");
const QuoteModel = require("../../dynamodb/model/Quote");
const { sendDiscordMessage } = require("../discordBotService");

const findQuote = async (userEmail, estimateUrl) => {
  try {
    const quotes = await QuoteModel.scan("userEmail")
      .eq(userEmail)
      .where("estimateUrl")
      .eq(estimateUrl)
      .exec();

    if (!quotes || quotes.length === 0) {
      await sendDiscordMessage({
        title: "Quote Not Found",
        statusCode: 404,
        message: `No matching quote found for user: ${userEmail}`,
        channelId: "1345967280605102120",
      });
      return null;
    }

    return quotes[0];
  } catch (error) {
    await sendDiscordMessage({
      title: "DynamoDB Search Error",
      statusCode: 500,
      message: `<@336794456063737857> Error fetching quote from DynamoDB.\n\n**Error:** ${error.message}`,
      channelId: "1345967280605102120",
    });
    throw new Error("Error searching for quote in DynamoDB");
  }
};

// ✅ Function to update the quote in WHMCS
const updateQuoteInWhmcs = async (quoteId) => {
  try {
    const whmcsUrl = process.env.WHMCS_API_URL;
    const whmcsIdentifier = process.env.WHMCS_API_IDENTIFIER;
    const whmcsSecret = process.env.WHMCS_API_SECRET;

    const response = await axios.post(
      whmcsUrl,
      new URLSearchParams({
        action: "UpdateQuote",
        identifier: whmcsIdentifier,
        secret: whmcsSecret,
        quoteid: quoteId,
        stage: "Accepted",
        responsetype: "json",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.data.result !== "success") {
      await sendDiscordMessage({
        title: "WHMCS Quote Update Failed",
        statusCode: 500,
        message: `Failed to update quote in WHMCS for quote ID: ${quoteId}`,
        channelId: "1345967280605102120",
      });
      return false;
    }

    return true;
  } catch (error) {
    await sendDiscordMessage({
      title: "WHMCS API Error",
      statusCode: 500,
      message: `<@336794456063737857> Error updating quote in WHMCS.\n\n**Error:** ${error.message}`,
      channelId: "1345967280605102120",
    });
    throw new Error("Error updating quote in WHMCS");
  }
};

// ✅ Function to notify Discord about success
const notifyQuoteUpdated = async (
  estimateUrl,
  firstName,
  lastName,
  userEmail,
  quoteId
) => {
  await sendDiscordMessage({
    title: "Quote Updated Successfully",
    statusCode: 200,
    message: `Quote successfully updated to 'Accepted'.\n\n**Estimate URL:** ${estimateUrl}\n**User Name:** ${firstName} ${lastName}\n**User Email:** ${userEmail}\n**Quote ID:** ${quoteId}`,
    channelId: "1345967280605102120",
  });
};

module.exports = { findQuote, updateQuoteInWhmcs, notifyQuoteUpdated };
