const axios = require("axios");
const phpSerialize = require("php-serialize");
const { sendDiscordMessage } = require("../discordBotService");

const WHMCS_API_URL = process.env.WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;
const DISCORD_CHANNEL_ID = "1345967280605102120";
const MENTION_USER = "<@336794456063737857>";

const buildRequestParams = (action, additionalParams) => ({
  action,
  identifier: WHMCS_API_IDENTIFIER,
  secret: WHMCS_API_SECRET,
  responsetype: "json",
  ...additionalParams,
});

const encodeLineItems = (lineItems) => {
  const formattedItems = lineItems.map((item) => ({
    desc: item.productDescriptions,
    qty: lineItems.quantity,
    up: item.price.replace(/[^0-9.]/g, "") || "0.00",
    discount: "0.00",
    taxable: true,
  }));
  const serialized = phpSerialize.serialize(formattedItems);
  return Buffer.from(serialized).toString("base64");
};

const formatDateToYYYYMMDD = (dateStr) => {
  const date = new Date(dateStr);
  if (!isNaN(date)) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const regex = /(\w+)\s+(\d{1,2}),\s*(\d{4})/;
  const match = dateStr.match(regex);
  if (match) {
    const monthNames = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };
    const month = monthNames[match[1]] || "01";
    const day = match[2].padStart(2, "0");
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

const createQuote = async (quoteParams) => {
  try {
    const params = buildRequestParams("CreateQuote", quoteParams);
    const formParams = new URLSearchParams(params);
    const response = await axios.post(WHMCS_API_URL, formParams.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    await sendDiscordMessage({
      title: "Quote Created Successfully",
      statusCode: 200,
      message: `Quote response: ${JSON.stringify(response.data)}`,
      channelId: DISCORD_CHANNEL_ID,
    });
    return response.data;
  } catch (error) {
    const statusCode = error.response ? error.response.status : 500;
    let errorDetail = error.message;

    if (error.response && error.response.data) {
      errorDetail += `\nAdditional Info: ${JSON.stringify(
        error.response.data,
        null,
        2
      )}`;
    }

    await sendDiscordMessage({
      title: "Quote Creation Error",
      statusCode,
      message: `${MENTION_USER} Error occurred: ${errorDetail}`,
      channelId: DISCORD_CHANNEL_ID,
    });
    throw error;
  }
};

module.exports = {
  encodeLineItems,
  formatDateToYYYYMMDD,
  createQuote,
  buildRequestParams,
};
