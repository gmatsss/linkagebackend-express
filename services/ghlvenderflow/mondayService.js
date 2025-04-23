// services/mondayService.js
const axios = require("axios");
const { sendDiscordMessage } = require("../discordBotService");

const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_KEY = process.env.MONDAY_API;

const DISCORD_CHANNEL_ID = "1361503079106875442";
const DISCORD_USER_ID = "336794456063737857";
const STATIC_STATUS_COLUMN_ID = "status";

const fetchItem = async (id) => {
  // Build the query based on the provided id.
  const query = `
    query {
      items(ids: [${id}]) {
        id
        name
        created_at
        updated_at
        url
        column_values {
          id
          text
          type
          value
        }
      }
    }
  `;

  const response = await axios.post(
    MONDAY_API_URL,
    { query },
    {
      headers: {
        Authorization: MONDAY_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  // Depending on the structure returned from Monday, adjust as needed.
  return response.data.data.items || response.data.data.items_by_column_values;
};

const fetchUsersForItem = async (userIds) => {
  const userQuery = `
    query {
      users(ids: [${userIds.join(",")}]) {
        id
        name
        email
      }
    }
  `;
  const response = await axios.post(
    MONDAY_API_URL,
    { query: userQuery },
    {
      headers: {
        Authorization: MONDAY_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data.users || [];
};

async function changeItemStatus({ boardId, itemId, label }) {
  if (!boardId || !itemId || label == null) {
    throw new Error("Required: boardId, itemId, label");
  }

  const columnValue = JSON.stringify({ label });
  const escapedValue = columnValue.replace(/"/g, '\\"');

  const query = `
    mutation {
      change_column_value(
        board_id: ${boardId},
        item_id: ${itemId},
        column_id: "${STATIC_STATUS_COLUMN_ID}",
        value: "${escapedValue}"
      ) {
        id
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.monday.com/v2",
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MONDAY_API}`,
        },
      }
    );

    if (response.data.errors && response.data.errors.length) {
      const err = response.data.errors[0];
      const code = err.extensions?.code || "Error";
      const msg = err.message || "Unknown monday.com API error";
      throw new Error(`${code}: ${msg}`);
    }

    await sendDiscordMessage({
      title: `✅ Status Updated`,
      statusCode: 200,
      message: `• Board: ${boardId}\n• Item: ${itemId}\n• New Status: ${label}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    return response.data.data.change_column_value;
  } catch (err) {
    await sendDiscordMessage({
      title: `❌ Update Failed`,
      statusCode: err.response?.status || 500,
      message: `<@${DISCORD_USER_ID}> Failed to update status:\n• Board: ${boardId}\n• Item: ${itemId}\n• Attempted Status: ${label}\n• Error: ${err.message}`,
      channelId: DISCORD_CHANNEL_ID,
    });

    throw err;
  }
}

module.exports = { fetchItem, fetchUsersForItem, changeItemStatus };
