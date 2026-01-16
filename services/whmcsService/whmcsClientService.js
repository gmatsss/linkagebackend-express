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

    // Log client details to console
    console.log("Client Details Response:", response.data);

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

const addClient = async (clientData) => {
  try {
    const params = buildRequestParams("AddClient", {
      firstname: clientData.first_name || "Unknown",
      lastname: clientData.last_name || "Client",
      email: clientData.email,
      phonenumber: clientData.phone || "",
      companyname: clientData.company_name || "",
      address1: clientData.address1 || "",
      address2: clientData.address2 || "",
      city: clientData.city || "",
      state: clientData.state || "",
      postcode: clientData.postcode || "",
      country: clientData.country || "US",
      password2: Math.random().toString(36).slice(-12), // Generate random password
      skipvalidation: true,
    });
    const formParams = new URLSearchParams(params);
    const response = await axios.post(WHMCS_API_URL, formParams.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    console.log("Add Client Response:", response.data);

    if (response.data.result === "success") {
      await sendDiscordMessage({
        title: "New Client Created",
        statusCode: 200,
        message: `New client created: ${clientData.first_name} ${clientData.last_name} (${clientData.email})\nClient ID: ${response.data.clientid}`,
        channelId: DISCORD_CHANNEL_ID,
      });
    }

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
      title: "Add Client Error",
      statusCode,
      message: `${MENTION_USER} Error creating client ${clientData.email}: ${errorDetail}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    throw error;
  }
};

module.exports = { getClientDetails, addClient, buildRequestParams };
