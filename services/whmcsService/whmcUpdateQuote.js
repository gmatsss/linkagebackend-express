const axios = require("axios");
const phpSerialize = require("php-serialize");
const QuoteModel = require("../../dynamodb/model/Quote");
const { sendDiscordMessage } = require("../discordBotService");
const {
  buildRequestParams,
  getClientDetails,
} = require("./whmcsClientService");
const {
  encodeLineItems,
  formatDateToYYYYMMDD,
  createQuote,
} = require("./whmcsQuoteService");
const { scrapeEstimate } = require("./scraperWhmcs");

const DISCORD_CHANNEL_ID = "1345967280605102120";

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
        channelId: DISCORD_CHANNEL_ID,
      });
      return null;
    }

    return quotes[0];
  } catch (error) {
    await sendDiscordMessage({
      title: "DynamoDB Search Error",
      statusCode: 500,
      message: `${MENTION_USER} Error fetching quote from DynamoDB.\n\n**Error:** ${error.message}`,
      channelId: DISCORD_CHANNEL_ID,
    });
    throw new Error("Error searching for quote in DynamoDB");
  }
};

const deleteQuoteInWhmcs = async (quoteId) => {
  const params = buildRequestParams("DeleteQuote", { quoteid: quoteId });
  const response = await axios.post(
    process.env.WHMCS_API_URL,
    new URLSearchParams(params).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (
    response.data.result === "error" &&
    response.data.message?.includes("Quote ID Not Found")
  ) {
    return;
  }

  if (response.data.result !== "success") {
    throw new Error(
      `Failed to delete WHMCS quote ID ${quoteId}: ${JSON.stringify(
        response.data
      )}`
    );
  }
};

const updateQuoteInWhmcs = async (userEmail, estimateUrl, estName) => {
  try {
    const quoteRecord = await findQuote(userEmail, estimateUrl);
    if (!quoteRecord) return false;

    const oldQuoteId = quoteRecord.quoteId || quoteRecord.whmcsQuoteId;
    if (oldQuoteId) {
      await deleteQuoteInWhmcs(oldQuoteId);
    }

    let clientIdentifier;
    try {
      const clientDetails = await getClientDetails(userEmail);
      if (clientDetails?.result === "success" && clientDetails.client?.id) {
        clientIdentifier = clientDetails.client.id;
      } else {
        clientIdentifier = userEmail;
      }
    } catch {
      clientIdentifier = userEmail;
    }

    const { lineItems, metaData } = await scrapeEstimate(estimateUrl);
    const encodedLineItems = encodeLineItems(lineItems);

    const finalExpiryDate = metaData?.expiryDate
      ? formatDateToYYYYMMDD(metaData.expiryDate)
      : formatDateToYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const finalIssueDate = metaData?.issueDate
      ? formatDateToYYYYMMDD(metaData.issueDate)
      : formatDateToYYYYMMDD(new Date());

    const quoteParams = {
      subject: estName || "Estimate Quote on Venderflow",
      stage: "Accepted",
      validuntil: finalExpiryDate,
      datecreated: finalIssueDate,
      lineitems: encodedLineItems,
    };

    if (typeof clientIdentifier === "number") {
      quoteParams.userid = clientIdentifier;
    } else {
      quoteParams.email = clientIdentifier;
    }

    const quoteResponse = await createQuote(quoteParams);
    if (quoteResponse.result !== "success") return false;

    quoteRecord.quoteId = quoteResponse.quoteid;
    await quoteRecord.save();

    await sendDiscordMessage({
      title: "Quote Replaced Successfully",
      statusCode: 200,
      message: `🔁 Old quote deleted. ➕ New quote ${quoteResponse.quoteid} created and marked Accepted.\n🔗 ${estimateUrl}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    return true;
  } catch (error) {
    await sendDiscordMessage({
      title: "WHMCS Delete/Create Error",
      statusCode: 500,
      message: `${MENTION_USER} Error during delete/create flow: ${error.message}`,
      channelId: DISCORD_CHANNEL_ID,
    });
    return false;
  }
};

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
    channelId: DISCORD_CHANNEL_ID,
  });
};

module.exports = { findQuote, updateQuoteInWhmcs, notifyQuoteUpdated };
