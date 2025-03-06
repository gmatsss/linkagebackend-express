const axios = require("axios");
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

const getClientDetails = async (clientEmail) => {
  if (!clientEmail) {
    throw new Error("Client email is missing.");
  }
  try {
    const params = buildRequestParams("GetClientsDetails", {
      email: clientEmail,
      stats: true,
    });
    const formParams = new URLSearchParams(params);
    const response = await axios.post(WHMCS_API_URL, formParams.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    await sendDiscordMessage({
      title: "Client Details Retrieved",
      statusCode: 200,
      message: `Client details for ${clientEmail} retrieved successfully.`,
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
      title: "Get Client Details Error",
      statusCode,
      message: `${MENTION_USER} Error retrieving client details for ${clientEmail}: ${errorDetail}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    throw error;
  }
};

module.exports = { getClientDetails, buildRequestParams };
