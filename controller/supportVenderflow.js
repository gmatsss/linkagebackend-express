// controllers/itemController.js
const {
  fetchItem,
  fetchUsersForItem,
} = require("../services/ghlvenderflow/mondayService");
const { getGHLUserIdByEmail } = require("../services/ghlvenderflow/ghlService");
const {
  handleStatusWorkflow,
} = require("../services/ghlvenderflow/statusWorkflowService");

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
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({
      error:
        "You must provide either an item 'id' or 'name' as a query parameter.",
    });
  }

  try {
    const items = await fetchItem(id);
    if (!items || items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    const item = items[0];
    const columns = {};
    let statusValue = "";

    for (const col of item.column_values) {
      const alias = columnAliases[col.id] || col.id;

      if (alias === "CS" && col.value) {
        try {
          const parsed = JSON.parse(col.value);
          const userIds = parsed?.personsAndTeams?.map((p) => p.id) || [];
          if (userIds.length) {
            const users = await fetchUsersForItem(userIds);
            columns[alias] = users[0]
              ? { id: users[0].id, name: users[0].name, email: users[0].email }
              : null;
          } else {
            columns[alias] = null;
          }
        } catch {
          columns[alias] = col.text;
        }
      } else if (col.type === "status") {
        columns[alias] = col.text;
        statusValue = col.text;
      } else if (col.value) {
        try {
          const parsed = JSON.parse(col.value);
          columns[alias] =
            parsed.text || parsed.phone || parsed.email || parsed || col.text;
        } catch {
          columns[alias] = col.text;
        }
      } else {
        columns[alias] = col.text || null;
      }
    }

    if (columns["CS"] && columns["CS"].email) {
      try {
        const ghlUserId = await getGHLUserIdByEmail(columns["CS"].email);
        columns["CS"].ghlUserId = ghlUserId;
        console.log(
          `Fetched GHL User ID for ${columns["CS"].email}:`,
          ghlUserId
        );
      } catch (e) {
        console.error("Failed to fetch GHL user ID:", e.message);
      }
    }

    const statusResult = await handleStatusWorkflow(statusValue, item, columns);

    return res.json({
      success: true,
      message: statusResult.message,
      continue: statusResult.continue,
      item: {
        subject: item.name,
        url: item.url,
        columns,
        aliases: columnAliases,
      },
    });
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
