// controllers/itemController.js
const axios = require("axios");
const { sendDiscordMessage } = require("../services/discordBotService");
const {
  fetchItem,
  fetchUsersForItem,
} = require("../services/ghlvenderflow/mondayService");
const { getGHLUserIdByEmail } = require("../services/ghlvenderflow/ghlService");

const WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/cgAQMEZGL1qQIq1fJXJ3/webhook-trigger/6c4a8498-bc12-410c-9a7b-b0c96ad33706";
const DISCORD_CHANNEL_ID = "1361503079106875442";
const DISCORD_USER_ID = "336794456063737857";

const columnAliases = {
  date4: "Date",
  text_mkpwwhza: "Client Name",
  phone_mkpwt2x8: "Phone",
  email_mkpwmge9: "Email",
  person: "CS",
  long_text_mkpwa6nv: "Message",
  status: "Status",
  link_mkpwvk6x: "File Link",
  text_mkpx234v: "Department",
  text_mkpx2djk: "Ticket",
  long_text_mkpxqp5k: "Clarifications",
  long_text_mkpxq0qe: "AdditionalNote",
};

const getItem = async (req, res) => {
  const { id, name } = req.body;

  // Check if the request includes the required id parameter.
  if (!id) {
    return res.status(400).json({
      error:
        "You must provide either an item 'id' or 'name' as a query parameter.",
    });
  }

  try {
    // Get the item from Monday using the service.
    const items = await fetchItem(id);
    if (!items || items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    const item = items[0];
    const columns = {};
    let statusValue = "";

    // Process each column from the Monday item.
    for (const col of item.column_values) {
      const alias = columnAliases[col.id] || col.id;

      if (alias === "CS" && col.value) {
        try {
          const parsed = JSON.parse(col.value);
          const userIds =
            parsed?.personsAndTeams?.map((person) => person.id) || [];

          if (userIds.length > 0) {
            const users = await fetchUsersForItem(userIds);
            if (users.length > 0) {
              const user = users[0];
              columns[alias] = {
                id: user.id,
                name: user.name,
                email: user.email,
              };
            } else {
              columns[alias] = null;
            }
          } else {
            columns[alias] = null;
          }
        } catch (err) {
          columns[alias] = col.text;
        }
      } else if (col.type === "status") {
        columns[alias] = col.text;
        statusValue = col.text;
      } else if (col.value) {
        try {
          const parsed = JSON.parse(col.value);
          columns[alias] =
            parsed?.text ||
            parsed?.phone ||
            parsed?.email ||
            parsed ||
            col.text;
        } catch {
          columns[alias] = col.text;
        }
      } else {
        columns[alias] = col.text || null;
      }
    }

    // Enrich the “CS” column with the GHL user id if an email is available.
    if (columns["CS"] && columns["CS"].email) {
      try {
        const ghlUserId = await getGHLUserIdByEmail(columns["CS"].email);
        columns["CS"].ghlUserId = ghlUserId;
        console.log(
          `Fetched GHL User ID for ${columns["CS"].email}: `,
          ghlUserId
        );
      } catch (e) {
        console.error("Failed to fetch GHL user ID:", e.message);
      }
    }

    // Determine whether to trigger the next workflow steps based on status.
    const shouldContinue = statusValue === "In Review";

    const responsePayload = {
      subject: item.name,
      url: item.url,
      columns,
    };

    if (shouldContinue) {
      try {
        await axios.post(WEBHOOK_URL, responsePayload);
        console.log("✅ Webhook sent successfully.");
        await sendDiscordMessage({
          title: "✅ Workflow Triggered In Review Status",
          statusCode: 200,
          message: `Board item is in review. Webhook sent successfully.\nItem: ${item.name}\n${item.url}`,
          channelId: DISCORD_CHANNEL_ID,
        });
      } catch (webhookErr) {
        console.error("❌ Webhook POST failed:", webhookErr.message);
        await sendDiscordMessage({
          title: "❌ Error Sending Webhook",
          statusCode: 500,
          message: `<@${DISCORD_USER_ID}> Failed to send webhook for item: ${item.name}\n${item.url}\nError: ${webhookErr.message}`,
          channelId: DISCORD_CHANNEL_ID,
        });
      }

      return res.json({
        success: true,
        message:
          "Board item status is 'In Review'. Pipeline moved to In Review.",
        continue: true,
        item: {
          subject: item.name,
          url: item.url,
          columns,
          aliases: columnAliases,
        },
      });
    } else {
      await sendDiscordMessage({
        title: "🛑 No Workflow Triggered In Review Status",
        statusCode: 200,
        message: `Board item is *not* in review. Workflow ended.\nItem: ${item.name}\n${item.url}`,
        channelId: DISCORD_CHANNEL_ID,
      });

      return res.json({
        success: true,
        message: "Board item status is not 'In Review'. Ending workflow.",
        continue: false,
        item: {
          subject: item.name,
          url: item.url,
          columns,
          aliases: columnAliases,
        },
      });
    }
  } catch (error) {
    console.error(
      "❌ Monday API Error:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      error: "Error fetching item from Monday.com",
    });
  }
};

module.exports = { getItem };
