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
    const twelveHoursAgoTimestamp = currentTimestamp - 43200;

    const params = {
      page_access_token: pageAccessToken,
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
    let zapierPosted = [];

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

        const isLeadInGHL = ghlContacts.some((contact) => {
          const normalizeField = (field) =>
            field?.trim().toLowerCase().replace(/\s+/g, "") || "";

          const ghlName = normalizeField(
            contact.contactName || `${contact.firstName} ${contact.lastName}`
          );
          const ghlEmail = normalizeField(contact.email);
          const ghlPhone = contact.phone
            ? contact.phone.replace(/\D/g, "")
            : "";

          const dataName = normalizeField(data.name);
          const dataEmail = normalizeField(data.email);
          const dataPhone = data.phone?.replace(/\D/g, "") || "";

          return (
            (ghlName && ghlName === dataName) ||
            (ghlEmail && ghlEmail === dataEmail) ||
            (ghlPhone && ghlPhone === dataPhone)
          );
        });

        if (!isLeadInGHL) {
          const postResponse = await axios.post(zapierEndpoint, data);
          zapierPosted.push({
            data,
            status: "Posted to Zapier",
            response: postResponse.data,
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

    if (zapierPosted.length === 0) {
      await sendDiscordMessage({
        title,
        statusCode: 200,
        message: `✅ All interested leads are already synced in GHL.`,
        channelId: discordChannelId,
      });

      return {
        success: true,
        message: "All interested leads are already synced in GHL.",
      };
    }

    await sendDiscordMessage({
      title,
      statusCode: 200,
      message: `✅ Sync completed. Leads posted to Zapier: ${JSON.stringify(
        zapierPosted
      )}`,
      channelId: discordChannelId,
    });

    return { success: true, postedToZapier: zapierPosted };
  } catch (error) {
    await sendDiscordMessage({
      title,
      statusCode: 500,
      message: `❌ Fetch Conversations Failed\nError: ${
        error.response ? error.response.data : error.message
      }`,
      channelId: discordChannelId,
    });

    throw new Error(
      `Failed to process cron job: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};

module.exports = fetchConversations;
