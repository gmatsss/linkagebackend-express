const axios = require("axios");
const { sendDiscordMessage } = require("../services/discordBotService");
const discordChannelId = "1328533603163967661";

const generatePageAccessToken = async (pageId, userAccessToken) => {
  const url = `https://pages.fm/api/v1/pages/${pageId}/generate_page_access_token`;

  try {
    const response = await axios.post(url, null, {
      params: {
        page_id: pageId,
        access_token: userAccessToken,
      },
    });

    return response.data.page_access_token;
  } catch (error) {
    console.error(
      "Error generating page access token:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to generate page access token");
  }
};

const fetchConversations = async () => {
  const title = "Sync Pancake to GHL interested Lead";
  const userAccessToken = process.env.ACCESS_TOKENPANCAKE;
  const pageId = "170920549759718";
  const baseUrl = `https://pages.fm/api/public_api/v2/pages/${pageId}/conversations`;
  const zapierEndpoint = "https://hooks.zapier.com/hooks/catch/775472/2zeo155/";
  const ghlEndpoint = "https://rest.gohighlevel.com/v1/contacts";
  const ghlToken = process.env.GHL_LINKAGEWEBSOL_TOKEN;

  try {
    const pageAccessToken = await generatePageAccessToken(
      pageId,
      userAccessToken
    );

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const threeHoursAgoTimestamp = currentTimestamp - 10800;

    const params = {
      page_access_token: pageAccessToken,
      since: threeHoursAgoTimestamp,
      until: currentTimestamp,
    };

    const response = await axios.get(baseUrl, { params });

    const interestedData = response.data.conversations
      .filter((conversation) =>
        conversation.tag_histories?.some(
          (tag) => tag.payload?.tag?.text === "INTERESTED 🎺"
        )
      )
      .map((conversation) => {
        const name = conversation.from?.name || "N/A";
        const email = conversation.from?.email || "N/A";
        const phone =
          conversation.recent_phone_numbers?.[0]?.phone_number || "N/A";

        return { name, email, phone };
      });

    const postResults = [];

    for (const data of interestedData) {
      try {
        const ghlQueryParams = new URLSearchParams({
          query: data.name,
        }).toString();

        const ghlResponse = await axios.get(
          `${ghlEndpoint}?${ghlQueryParams}`,
          {
            headers: { Authorization: `Bearer ${ghlToken}` },
          }
        );

        const ghlContacts = ghlResponse.data.contacts || [];
        const isLeadInGHL = ghlContacts.some(
          (contact) =>
            contact.email === data.email || contact.phone === data.phone
        );

        if (!isLeadInGHL) {
          const postResponse = await axios.post(zapierEndpoint, data);
          postResults.push({
            data,
            status: "Posted to Zapier",
            response: postResponse.data,
          });
        } else {
          postResults.push({
            data,
            status: "Already exists in GHL",
          });
        }
      } catch (checkError) {
        postResults.push({
          data,
          status: "Failed during GHL check",
          error: checkError.response
            ? checkError.response.data
            : checkError.message,
        });
      }
    }

    // Send success message to Discord
    await sendDiscordMessage({
      title,
      statusCode: 200,
      message: `✅ Fetch Conversations Executed Successfully\nData: ${JSON.stringify(
        postResults
      )}`,
      channelId: discordChannelId, // Replace with your Discord channel ID
    });

    return { success: true, postResults };
  } catch (error) {
    // Send error message to Discord
    await sendDiscordMessage({
      title,
      statusCode: 500,
      message: `❌ Fetch Conversations Failed\nError: ${
        error.response ? error.response.data : error.message
      }`,
      channelId: discordChannelId, // Replace with your Discord channel ID
    });

    throw new Error(
      `Failed to process cron job: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};

module.exports = fetchConversations;
